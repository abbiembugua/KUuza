from django.contrib import admin
from .models import Notification, Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display  = ['id', 'buyer', 'seller', 'listing_title', 'agreed_price', 'status', 'seller_confirmed', 'is_disputed', 'created_at']
    list_filter   = ['status', 'interaction_type', 'payment_method', 'seller_confirmed', 'is_disputed', 'buyer_confirmed']
    search_fields = ['buyer__email', 'seller__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'completed_at', 'confirmation_deadline', 'disputed_at']
    ordering      = ['-created_at']

    def listing_title(self, obj):
        return obj.listing.title if obj.listing else '—'
    listing_title.short_description = 'Listing'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ['title', 'recipient', 'actor', 'notification_type', 'is_read', 'created_at']
    list_filter   = ['notification_type', 'is_read']
    search_fields = ['recipient__email', 'title']
    readonly_fields = ['id', 'created_at', 'read_at']
    ordering      = ['-created_at']