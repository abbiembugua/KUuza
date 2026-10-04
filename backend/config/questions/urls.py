from django.urls import path
from .views import QuestionListCreateView, QuestionDetailView, QuestionAnswerView

urlpatterns = [
    path('questions/',                      QuestionListCreateView.as_view(), name='questions-list-create'),
    path('questions/<uuid:pk>/',            QuestionDetailView.as_view(),     name='questions-detail'),
    path('questions/<uuid:pk>/answer/',     QuestionAnswerView.as_view(),     name='questions-answer'),
]
