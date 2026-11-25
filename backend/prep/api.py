import io
import json
from functools import wraps
from xml.sax.saxutils import escape

from django import forms
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import RequestDataTooBig, ValidationError
from django.db import IntegrityError, connection, transaction
from django.http import Http404, HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.csrf import csrf_failure as default_csrf_failure
from django.views.decorators.cache import never_cache
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate

from .attempts import AttemptConflict, begin, expire, finalize, save_answer, serialize
from .models import Attempt, Lesson, LessonProgress, Quiz
from .progress import dashboard as build_dashboard

User = get_user_model()


def api(*methods, student=True):
    def decorate(view):
        @never_cache
        @wraps(view)
        def endpoint(request, *args, **kwargs):
            if request.method not in methods:
                return JsonResponse({"error": "Method not allowed."}, status=405, headers={"Allow": ", ".join(methods)})
            if student and not request.user.is_authenticated:
                return JsonResponse({"error": "Sign in to continue."}, status=401)
            try:
                return view(request, *args, **kwargs)
            except Http404:
                return JsonResponse({"error": "This resource was not found."}, status=404)
            except ValidationError as error:
                return JsonResponse({"error": " ".join(error.messages)}, status=400)
            except RequestDataTooBig:
                return JsonResponse({"error": "Request is too large."}, status=413)
            except AttemptConflict as error:
                return JsonResponse({"error": str(error)}, status=409)
        return endpoint
    return decorate


def csrf_failure(request, reason=""):
    if request.path.startswith("/api/"):
        return JsonResponse({"error": "Session verification failed. Refresh the page and try again."}, status=403)
    return default_csrf_failure(request, reason)


def body(request):
    if request.content_type != "application/json":
        raise ValidationError("Send a JSON object.")
    try:
        payload = json.loads(request.body)
    except (ValueError, UnicodeError) as error:
        raise ValidationError("Send a valid JSON object.") from error
    if not isinstance(payload, dict):
        raise ValidationError("Send a JSON object.")
    return payload


def profile(user):
    return {"name": user.first_name or user.email, "email": user.email} if user.is_authenticated else None


def session_response(request, status=200):
    return JsonResponse({"user": profile(request.user), "csrfToken": get_token(request)}, status=status)


@api("GET", student=False)
def health(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return JsonResponse({"ok": True})


@api("GET", student=False)
def session(request):
    return session_response(request)


@api("POST", student=False)
def sign_up(request):
    payload = body(request)
    name, email, password = (payload.get(key) for key in ("name", "email", "password"))
    if not isinstance(name, str) or not 2 <= len(name.strip()) <= 120 or "\x00" in name:
        raise ValidationError("Enter a name between 2 and 120 characters.")
    if not isinstance(email, str):
        raise ValidationError("Enter a valid email address.")
    email = forms.EmailField(max_length=150).clean(email.lower())
    if not isinstance(password, str) or not 8 <= len(password) <= 128 or "\x00" in password:
        raise ValidationError("Use a password between 8 and 128 characters.")
    user = User(username=email, email=email, first_name=name.strip())
    validate_password(password, user)
    user.set_password(password)
    try:
        with transaction.atomic():
            user.save(force_insert=True)
    except IntegrityError:
        if User.objects.filter(username=email).exists():
            return JsonResponse({"error": "An account already uses this email. Please sign in."}, status=409)
        raise
    login(request, user)
    return session_response(request, 201)


@api("POST", student=False)
def sign_in(request):
    payload = body(request)
    email, password = payload.get("email"), payload.get("password")
    if not isinstance(email, str) or not isinstance(password, str) or len(email) > 150 or len(password) > 128 or "\x00" in email:
        raise ValidationError("Enter your email address and password.")
    user = authenticate(request, username=email.strip().lower(), password=password)
    if user is None:
        return JsonResponse({"error": "Email or password is incorrect."}, status=401)
    login(request, user)
    return session_response(request)


@api("POST", student=False)
def sign_out(request):
    logout(request)
    return session_response(request)


@api("GET")
def dashboard(request):
    return JsonResponse(build_dashboard(request.user))


@api("GET", "POST")
def lesson_detail(request, lesson_id):
    lesson = get_object_or_404(Lesson.objects.select_related("topic"), pk=lesson_id, published=True)
    completion = LessonProgress.objects.filter(student=request.user, lesson=lesson)
    if request.method == "POST":
        LessonProgress.objects.get_or_create(student=request.user, lesson=lesson)
    return JsonResponse({
        "id": lesson.pk, "title": lesson.title, "body": lesson.body, "topic": lesson.topic.title,
        "completed": completion.exists(),
        "resources": [resource.as_resource() for resource in lesson.topic.resources.filter(published=True)],
    })


@api("POST")
def start_quiz(request, quiz_id):
    quiz = get_object_or_404(Quiz, pk=quiz_id, published=True)
    attempt, created = begin(request.user, quiz)
    return JsonResponse(serialize(attempt, timezone.now()), status=201 if created else 200)


def owned_attempt(request, attempt_id):
    return get_object_or_404(
        Attempt.objects.select_related("topic"), pk=attempt_id, student=request.user,
    )


@api("GET")
def attempt_detail(request, attempt_id):
    now = timezone.now()
    return JsonResponse(serialize(expire(owned_attempt(request, attempt_id), now), now))


@api("PUT")
def answer(request, attempt_id, question_id):
    attempt = owned_attempt(request, attempt_id)
    data = body(request)
    if question_id not in {question["id"] for question in attempt.questions}:
        raise Http404
    selected, revision = data.get("selected"), data.get("revision")
    if "selected" not in data or (selected is not None and (type(selected) is not int or not 0 <= selected < 4)):
        raise ValidationError("Select one of the four options or clear the answer.")
    if type(revision) is not int or not 0 <= revision <= 2_147_483_647:
        raise ValidationError("Supply the current answer revision.")
    now = timezone.now()
    return JsonResponse(serialize(save_answer(attempt, question_id, selected, revision, now), now))


@api("POST")
def submit(request, attempt_id):
    now = timezone.now()
    return JsonResponse(serialize(finalize(owned_attempt(request, attempt_id), now), now))


@api("GET")
def study_plan(request):
    data = build_dashboard(request.user)
    styles = getSampleStyleSheet()
    content = [
        Paragraph("Achievers Club KCET Study Plan", styles["Title"]),
        Paragraph(f'Practice sets completed: {data["stats"]["completedAttempts"]}', styles["Normal"]),
        Paragraph("What to study next", styles["Heading2"]),
    ]
    for item in data["recommendations"]:
        topic = escape(f'{item["subject"]}: {item["topic"]}')
        content.append(Paragraph(
            f'{topic} ({item["accuracy"]}% accuracy). Revisit the notes and retry a timed practice set.',
            styles["BodyText"],
        ))
    if not data["recommendations"]:
        content.append(Paragraph(
            "Take a timed practice set in each subject to identify what to review.", styles["BodyText"],
        ))
    buffer = io.BytesIO()
    SimpleDocTemplate(buffer, title="KCET Study Plan").build(content)
    return HttpResponse(buffer.getvalue(), content_type="application/pdf", headers={
        "Content-Disposition": 'attachment; filename="achievers-club-study-plan.pdf"',
    })
