import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .resource_links import validate_resource_url


class Subject(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=80)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "name"]

    def __str__(self):
        return self.name


class Topic(models.Model):
    subject = models.ForeignKey(Subject, related_name="topics", on_delete=models.PROTECT)
    slug = models.SlugField(unique=True)
    title = models.CharField(max_length=120)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "title"]

    def __str__(self):
        return self.title


class Lesson(models.Model):
    topic = models.ForeignKey(Topic, related_name="lessons", on_delete=models.PROTECT)
    title = models.CharField(max_length=140)
    body = models.TextField()
    published = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class LearningResource(models.Model):
    class Kind(models.TextChoices):
        READING = "reading", "Reading"
        VIDEO = "video", "Video"

    topic = models.ForeignKey(Topic, related_name="resources", on_delete=models.PROTECT)
    kind = models.CharField(max_length=7, choices=Kind.choices)
    title = models.CharField(max_length=200)
    source = models.CharField(max_length=120, help_text="Name of the site or the creator.")
    url = models.URLField(max_length=600, validators=[validate_resource_url])
    published = models.BooleanField(default=False)

    class Meta:
        ordering = ["title", "id"]
        constraints = [models.UniqueConstraint(fields=["topic", "url"], name="unique_topic_resource_url")]

    def __str__(self):
        return self.title

    def as_resource(self):
        return {"id": self.pk, "kind": self.kind, "title": self.title, "source": self.source, "url": self.url}


class Quiz(models.Model):
    topic = models.ForeignKey(Topic, related_name="quizzes", on_delete=models.PROTECT)
    title = models.CharField(max_length=140)
    duration_seconds = models.PositiveIntegerField(
        default=300, validators=[MinValueValidator(30), MaxValueValidator(10800)],
    )
    published = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    position = models.PositiveSmallIntegerField()
    prompt = models.TextField()
    option_a = models.CharField(max_length=250)
    option_b = models.CharField(max_length=250)
    option_c = models.CharField(max_length=250)
    option_d = models.CharField(max_length=250)
    correct_index = models.PositiveSmallIntegerField(
        choices=[(0, "A"), (1, "B"), (2, "C"), (3, "D")],
    )
    explanation = models.TextField()

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["quiz", "position"], name="unique_question_position"),
            models.CheckConstraint(condition=models.Q(correct_index__lte=3), name="valid_correct_index"),
        ]

    @property
    def options(self):
        return [self.option_a, self.option_b, self.option_c, self.option_d]

    def clean(self):
        if len({option.strip().casefold() for option in self.options}) != 4:
            raise ValidationError("Enter four distinct options.")


class Attempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.PROTECT)
    topic = models.ForeignKey(Topic, on_delete=models.PROTECT)
    quiz_title = models.CharField(max_length=140)
    questions = models.JSONField()
    started_at = models.DateTimeField()
    deadline = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True)
    answers = models.JSONField(default=dict)
    revision = models.PositiveIntegerField(default=0)
    score = models.PositiveIntegerField(null=True)
    question_count = models.PositiveIntegerField()
    answered_count = models.PositiveIntegerField(default=0)
    elapsed_seconds = models.PositiveIntegerField(null=True)

    class Meta:
        constraints = [models.UniqueConstraint(
            fields=["student", "quiz"],
            condition=models.Q(submitted_at__isnull=True),
            name="one_open_attempt_per_quiz",
        )]
        indexes = [
            models.Index(fields=["student", "-submitted_at"]),
        ]


class LessonProgress(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(
            fields=["student", "lesson"], name="one_completion_per_lesson",
        )]
