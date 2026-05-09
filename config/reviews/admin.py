from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ['reviewer', 'reviewee', 'listing_title', 'score', 'created_at']
    list_filter   = ['score']
    search_fields = ['reviewer__email', 'reviewee__email', 'listing_title']
    readonly_fields = ['id', 'created_at', 'reviewer', 'reviewee', 'transaction_id', 'listing_title']
    ordering      = ['-created_at']