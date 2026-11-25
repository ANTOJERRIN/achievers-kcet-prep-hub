from django.urls import path

from . import api

urlpatterns = [
    path("health/", api.health),
    path("auth/session/", api.session),
    path("auth/register/", api.sign_up),
    path("auth/login/", api.sign_in),
    path("auth/logout/", api.sign_out),
    path("dashboard/", api.dashboard),
    path("lessons/<int:lesson_id>/", api.lesson_detail),
    path("quizzes/<int:quiz_id>/attempts/", api.start_quiz),
    path("attempts/<uuid:attempt_id>/", api.attempt_detail),
    path("attempts/<uuid:attempt_id>/answers/<int:question_id>/", api.answer),
    path("attempts/<uuid:attempt_id>/submit/", api.submit),
    path("study-plan.pdf", api.study_plan),
]
