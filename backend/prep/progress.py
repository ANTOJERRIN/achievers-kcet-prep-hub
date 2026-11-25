from django.db.models import Count, Sum

from .attempts import expire_open_attempts, summary
from .models import Attempt, Lesson, LessonProgress, Quiz, Subject


def dashboard(student):
    expire_open_attempts(student)
    graded = Attempt.objects.filter(student=student, submitted_at__isnull=False)
    topic_stats = {
        row["topic_id"]: row
        for row in graded.order_by().values("topic_id").annotate(
            points=Sum("score"), questions=Sum("question_count"),
            attempts=Count("id"),
        )
    }
    completed = set(LessonProgress.objects.filter(student=student).values_list("lesson_id", flat=True))
    notes = Lesson.objects.filter(published=True).order_by("title", "id")
    quizzes = Quiz.objects.filter(published=True, questions__isnull=False).distinct().order_by("title", "id")
    notes_by_topic = {}
    quizzes_by_topic = {}
    for note in notes:
        notes_by_topic.setdefault(note.topic_id, []).append({
            "id": note.pk, "title": note.title, "completed": note.pk in completed,
        })
    for quiz in quizzes:
        quizzes_by_topic.setdefault(quiz.topic_id, []).append({
            "id": quiz.pk, "title": quiz.title, "durationSeconds": quiz.duration_seconds,
        })

    subjects = []
    recommendations = []
    for subject in Subject.objects.prefetch_related("topics"):
        topics = []
        for topic in subject.topics.all():
            progress = topic_stats.get(topic.pk)
            accuracy = round(100 * progress["points"] / progress["questions"]) if progress else None
            weak = bool(progress and progress["questions"] >= 3 and accuracy < 70)
            topics.append({
                "id": topic.slug, "title": topic.title,
                "notes": notes_by_topic.get(topic.pk, []), "quizzes": quizzes_by_topic.get(topic.pk, []),
                "accuracy": accuracy, "attempts": progress["attempts"] if progress else 0,
                "weak": weak,
            })
            if weak:
                recommendations.append({
                    "subject": subject.name, "topic": topic.title, "accuracy": accuracy,
                })
        subjects.append({"id": subject.slug, "name": subject.name, "topics": topics})

    recommendations.sort(key=lambda item: (item["accuracy"], item["topic"]))
    points = sum(row["points"] for row in topic_stats.values())
    questions = sum(row["questions"] for row in topic_stats.values())
    return {
        "subjects": subjects,
        "stats": {
            "completedAttempts": sum(row["attempts"] for row in topic_stats.values()),
            "notesRead": sum(note["completed"] for notes in notes_by_topic.values() for note in notes),
            "accuracy": round(100 * points / questions) if questions else None,
            "weakTopics": len(recommendations),
        },
        "recommendations": recommendations,
        "recentAttempts": [
            summary(attempt)
            for attempt in graded.select_related("topic").order_by("-submitted_at", "-id")[:10]
        ],
        "activeAttempts": [
            {"id": str(attempt.pk), "quizTitle": attempt.quiz_title, "deadline": attempt.deadline}
            for attempt in Attempt.objects.filter(student=student, submitted_at__isnull=True).order_by("deadline")
        ],
    }
