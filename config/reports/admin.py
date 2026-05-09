from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display  = ['created_at', 'reason_display', 'reporter', 'reported_user', 'listing_title', 'status']
    list_filter   = ['status', 'reason']
    search_fields = ['reporter__email', 'reported_user__email', 'details']
    readonly_fields = ['transaction', 'listing', 'reported_user', 'reporter', 'reason', 'details', 'created_at']
    ordering = ['-created_at']
    actions  = ['mark_acted', 'mark_dismissed']

    def reason_display(self, obj):
        return obj.get_reason_display()
    reason_display.short_description = 'Reason'

    def listing_title(self, obj):
        if obj.listing:
            return obj.listing.title
        if obj.transaction and obj.transaction.listing:
            return obj.transaction.listing.title
        return '—'
    listing_title.short_description = 'Listing'

    @admin.action(description='Mark selected reports as Acted On')
    def mark_acted(self, request, queryset):
        queryset.update(status='acted')

    @admin.action(description='Mark selected reports as Dismissed')
    def mark_dismissed(self, request, queryset):
        queryset.update(status='dismissed')
