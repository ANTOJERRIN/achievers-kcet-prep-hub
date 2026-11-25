from django.contrib import admin

from .models import Lesson, Question, Quiz, Subject, Topic


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ["title", "topic", "published", "duration_seconds"]
    list_filter = ["published", "topic__subject"]
    search_fields = ["title", "topic__title"]
    inlines = [QuestionInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ["title", "topic", "published"]
    list_filter = ["published", "topic__subject"]
    search_fields = ["title", "body"]


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ["title", "subject", "position"]
    list_filter = ["subject"]
    prepopulated_fields = {"slug": ["title"]}


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ["name"]}
