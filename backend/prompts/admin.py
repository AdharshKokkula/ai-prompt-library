from django.contrib import admin
from .models import Prompt, Tag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name']


@admin.register(Prompt)
class PromptAdmin(admin.ModelAdmin):
    list_display = ['title', 'complexity', 'created_at']
    list_filter = ['complexity', 'tags']
    search_fields = ['title', 'content']
    filter_horizontal = ['tags']
