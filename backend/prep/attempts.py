from datetime import timedelta

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from .models import Attempt


class AttemptConflict(Exception):
    pass


def finalize(attempt, now):
    if attempt.submitted_at:
        return attempt
    score = sum(
        attempt.answers.get(str(question["id"])) == question["correctIndex"]
        for question in attempt.questions
    )
    finished_at = min(attempt.deadline, now)
    updated = Attempt.objects.filter(
        pk=attempt.pk, submitted_at__isnull=True, revision=attempt.revision,
    ).update(
        submitted_at=finished_at,
        score=score,
        answered_count=len(attempt.answers),
        elapsed_seconds=max(0, int((finished_at - attempt.started_at).total_seconds())),
    )
    attempt.refresh_from_db()
    if not updated and not attempt.submitted_at:
        raise AttemptConflict("Answers changed. Reload the attempt and try again.")
    return attempt


def expire(attempt, now):
    if not attempt.submitted_at and now >= attempt.deadline:
        return finalize(attempt, now)
    return attempt


def expire_open_attempts(student):
    now = timezone.now()
    for attempt in Attempt.objects.filter(
        student=student, submitted_at__isnull=True, deadline__lte=now,
    ):
        try:
            expire(attempt, now)
        except AttemptConflict:
            # A response that began before the deadline may have just saved an answer.
            expire(attempt, now)


def begin(student, quiz):
    now = timezone.now()
    active = Attempt.objects.filter(student=student, quiz=quiz, submitted_at__isnull=True).first()
    if active and not expire(active, now).submitted_at:
        return active, False
    questions = [{
        "id": question.pk,
        "prompt": question.prompt,
        "options": question.options,
        "correctIndex": question.correct_index,
        "explanation": question.explanation,
    } for question in quiz.questions.all()]
    if not questions:
        raise AttemptConflict("This practice set has no questions yet.")
    try:
        with transaction.atomic():
            attempt = Attempt.objects.create(
                student=student, quiz=quiz, topic=quiz.topic, quiz_title=quiz.title,
                questions=questions, question_count=len(questions),
                started_at=now, deadline=now + timedelta(seconds=quiz.duration_seconds),
            )
    except IntegrityError:
        attempt = Attempt.objects.filter(student=student, quiz=quiz, submitted_at__isnull=True).first()
        if attempt is None:
            raise
        return attempt, False
    return attempt, True


def save_answer(attempt, question_id, selected, revision, now):
    if attempt.submitted_at:
        raise AttemptConflict("This attempt has already been graded.")
    if now >= attempt.deadline:
        return expire(attempt, now)
    if revision != attempt.revision:
        raise AttemptConflict("Answers changed. Reload the attempt and try again.")
    answers = dict(attempt.answers)
    if selected is None:
        answers.pop(str(question_id), None)
    else:
        answers[str(question_id)] = selected
    updated = Attempt.objects.filter(
        pk=attempt.pk, revision=revision, submitted_at__isnull=True, deadline__gt=now,
    ).update(answers=answers, revision=F("revision") + 1)
    attempt.refresh_from_db()
    if not updated and not attempt.submitted_at:
        raise AttemptConflict("Answers changed. Reload the attempt and try again.")
    return attempt


def summary(attempt):
    return {
        "id": str(attempt.pk), "quizTitle": attempt.quiz_title,
        "topicTitle": attempt.topic.title,
        "questionsCount": attempt.question_count, "answeredCount": attempt.answered_count,
        "score": attempt.score, "elapsedSeconds": attempt.elapsed_seconds,
        "submittedAt": attempt.submitted_at,
    }


def serialize(attempt, now):
    graded = attempt.submitted_at is not None
    return {
        **summary(attempt),
        "status": "graded" if graded else "active",
        "deadline": attempt.deadline, "serverTime": now,
        "revision": attempt.revision, "answers": attempt.answers,
        "questions": attempt.questions if graded else [
            {key: question[key] for key in ("id", "prompt", "options")}
            for question in attempt.questions
        ],
    }
