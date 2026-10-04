from django.contrib import admin
from .models import Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    model   = ListingImage
    extra   = 0
    readonly_fields = ['display_order', 'uploaded_at']


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display  = ['title', 'seller', 'category', 'listing_type', 'price', 'status', 'is_draft', 'created_at']
    list_filter   = ['status', 'listing_type', 'category', 'is_draft']
    search_fields = ['title', 'seller__email', 'seller__first_name', 'seller__last_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'views_count']
    ordering      = ['-created_at']
    inlines       = [ListingImageInline]
    actions       = ['deactivate_listings', 'activate_listings']

    @admin.action(description='Deactivate selected listings')
    def deactivate_listings(self, request, queryset):
        queryset.update(status='deactivated')

    @admin.action(description='Reactivate selected listings')
    def activate_listings(self, request, queryset):
        queryset.update(status='active')