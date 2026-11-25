from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import Client, TestCase
from django.utils import timezone

from .models import Attempt, Lesson, LessonProgress, Question, Quiz

PASSWORD = "marble-drizzle-ostrich-467"


class PrepApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_kcet", verbosity=0)
        cls.quiz = Quiz.objects.get(topic__slug="thermodynamics")
        cls.lesson = Lesson.objects.get(topic__slug="thermodynamics")
        cls.question = cls.quiz.questions.first()

    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)

    def register(self, client, email="learn@example.com"):
        csrf = client.get("/api/auth/session/").json()["csrfToken"]
        response = client.post(
            "/api/auth/register/", {"name": "Practice Student", "email": email, "password": PASSWORD},
            content_type="application/json", headers={"X-CSRFToken": csrf},
        )
        self.assertEqual(response.status_code, 201, response.content)
        return response.json()["csrfToken"]

    def post(self, path, token, data=None, client=None):
        return (client or self.client).post(
            path, data or {}, content_type="application/json", headers={"X-CSRFToken": token},
        )

    def start(self, token):
        response = self.post(f"/api/quizzes/{self.quiz.pk}/attempts/", token)
        self.assertEqual(response.status_code, 201)
        return response.json()

    def answer(self, attempt, token, selected, revision):
        return self.client.put(
            f"/api/attempts/{attempt['id']}/answers/{self.question.pk}/",
            {"selected": selected, "revision": revision},
            content_type="application/json", headers={"X-CSRFToken": token},
        )

    def test_session_requires_csrf_and_survives_requests(self):
        route = "/api/auth/register/"
        self.assertEqual(self.client.post(route, {}, content_type="application/json").status_code, 403)
        self.assertEqual(self.client.get("/api/dashboard/").status_code, 401)
        token = self.register(self.client)
        user = get_user_model().objects.get(email="learn@example.com")
        self.assertTrue(user.check_password(PASSWORD))
        self.assertNotEqual(user.password, PASSWORD)
        self.assertEqual(self.client.get("/api/auth/session/").json()["user"]["email"], user.email)
        duplicate = self.post(route, token, {
            "name": "Other Student", "email": "LEARN@example.com", "password": PASSWORD,
        })
        self.assertEqual(duplicate.status_code, 409)
        logout = self.post("/api/auth/logout/", token)
        self.assertIsNone(logout.json()["user"])
        credentials = {"email": "LEARN@example.com", "password": PASSWORD}
        signed_in = self.post("/api/auth/login/", logout.json()["csrfToken"], credentials)
        self.assertEqual(signed_in.json()["user"]["email"], user.email)

    def test_attempt_is_versioned_private_and_idempotently_graded(self):
        token = self.register(self.client)
        attempt = self.start(token)
        path = f"/api/attempts/{attempt['id']}/"
        self.assertNotIn("correctIndex", attempt["questions"][0])
        self.assertNotIn("explanation", attempt["questions"][0])
        resumed = self.post(f"/api/quizzes/{self.quiz.pk}/attempts/", token)
        self.assertEqual(resumed.status_code, 200)
        self.assertEqual(resumed.json()["id"], attempt["id"])
        self.assertEqual(self.answer(attempt, token, True, 0).status_code, 400)
        self.assertEqual(self.answer(attempt, token, self.question.correct_index, 1).status_code, 409)
        saved = self.answer(attempt, token, self.question.correct_index, 0)
        self.assertEqual(saved.json()["revision"], 1)
        self.assertEqual(self.answer(attempt, token, 0, 0).status_code, 409)
        self.assertEqual(self.client.get(path).json()["answers"], {str(self.question.pk): self.question.correct_index})

        other = Client(enforce_csrf_checks=True)
        other_token = self.register(other, "another@example.com")
        self.assertEqual(other.get(path).status_code, 404)
        self.assertEqual(self.post(path + "submit/", other_token, client=other).status_code, 404)
        self.assertEqual(other.get("/api/dashboard/").json()["stats"]["completedAttempts"], 0)

        Question.objects.filter(pk=self.question.pk).update(correct_index=0)
        result = self.post(path + "submit/", token).json()
        self.assertEqual(result["score"], 1)
        self.assertEqual(result["answeredCount"], 1)
        self.assertEqual(result["questions"][0]["correctIndex"], self.question.correct_index)
        self.assertEqual(self.post(path + "submit/", token).json()["submittedAt"], result["submittedAt"])
        self.assertEqual(self.answer(attempt, token, 0, 1).status_code, 409)
        data = self.client.get("/api/dashboard/").json()
        self.assertEqual(data["stats"]["accuracy"], 33)
        self.assertEqual(data["recommendations"][0]["topic"], "Thermodynamics")

    def test_deadline_grades_only_saved_answers(self):
        token = self.register(self.client)
        attempt = self.start(token)
        self.assertEqual(self.answer(attempt, token, self.question.correct_index, 0).status_code, 200)
        record = Attempt.objects.get(pk=attempt["id"])
        Attempt.objects.filter(pk=record.pk).update(
            started_at=timezone.now() - timedelta(seconds=181),
            deadline=timezone.now() - timedelta(seconds=1),
        )
        response = self.answer(attempt, token, 0, 1)
        self.assertEqual(response.json()["status"], "graded")
        self.assertEqual(response.json()["score"], 1)
        self.assertEqual(response.json()["answers"][str(self.question.pk)], self.question.correct_index)
        self.assertEqual(self.start(token)["status"], "active")

    def test_notes_and_study_plan(self):
        token = self.register(self.client)
        path = f"/api/lessons/{self.lesson.pk}/"
        self.assertFalse(self.client.get(path).json()["completed"])
        for _ in range(2):
            self.assertTrue(self.post(path, token).json()["completed"])
        self.assertEqual(LessonProgress.objects.count(), 1)
        self.assertEqual(self.client.get("/api/dashboard/").json()["stats"]["notesRead"], 1)
        report = self.client.get("/api/study-plan.pdf")
        self.assertEqual(report["Content-Type"], "application/pdf")
        self.assertTrue(report.content.startswith(b"%PDF-"))
        self.assertIn("no-store", report["Cache-Control"])
        self.lesson.published = False
        self.lesson.save()
        self.assertEqual(self.client.get(path).status_code, 404)
