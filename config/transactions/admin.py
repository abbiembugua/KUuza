from django.contrib import admin
from .models import Transaction


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
