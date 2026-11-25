from django import forms
from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import LearningResource, Lesson, Question, Quiz, Subject, Topic
from .resource_links import openstax_metadata, openstax_page, youtube_metadata, youtube_video_id


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


class LearningResourceForm(forms.ModelForm):
    title = forms.CharField(max_length=200, required=False)
    source = forms.CharField(max_length=120, required=False, help_text="Leave blank to look up the source for YouTube or OpenStax.")

    class Meta:
        model = LearningResource
        fields = "__all__"

    def clean(self):
        data = super().clean()
        url = data.get("url")
        if not url:
            return data
        missing = [field for field in ("title", "source") if not data.get(field) and field not in self.errors]
        if not missing:
            return data
        kind = data.get("kind")
        video_id = youtube_video_id(url) if kind == LearningResource.Kind.VIDEO else None
        reading_path = openstax_page(url) if kind == LearningResource.Kind.READING else None
        try:
            if video_id:
                title, source = youtube_metadata(video_id)
            elif reading_path:
                title, source = openstax_metadata(reading_path)
            else:
                for field in missing:
                    self.add_error(field, "Enter this detail for the linked resource.")
                return data
        except ValidationError as error:
            self.add_error(None, error)
        else:
            values = {"title": title, "source": source}
            for field in missing:
                data[field] = values[field]
        return data


@admin.register(LearningResource)
class LearningResourceAdmin(admin.ModelAdmin):
    form = LearningResourceForm
    list_display = ["title", "source", "kind", "topic", "published"]
    list_filter = ["kind", "published", "topic__subject"]
    search_fields = ["title", "source", "topic__title"]


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ["name"]}
