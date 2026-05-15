from django.contrib import admin
from .models import ListingQuestion


@admin.register(ListingQuestion)
class ListingQuestionAdmin(admin.ModelAdmin):
    list_display  = ['listing', 'asker', 'created_at', 'is_answered']
    list_filter   = ['created_at']
    search_fields = ['question', 'answer', 'listing__title', 'asker__email']

    def is_answered(self, obj):
        return bool(obj.answer)
    is_answered.boolean = True