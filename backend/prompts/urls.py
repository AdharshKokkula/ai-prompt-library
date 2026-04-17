from django.urls import path
from .views import PromptListView, PromptDetailView, TagListView

urlpatterns = [
    path('', PromptListView.as_view(), name='prompt-list'),
    path('tags/', TagListView.as_view(), name='tag-list'),
    path('<str:prompt_id>/', PromptDetailView.as_view(), name='prompt-detail'),
]
