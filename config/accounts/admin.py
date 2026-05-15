from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display    = ['email', 'first_name', 'last_name', 'is_email_verified', 'is_verified_seller', 'is_active', 'is_staff', 'created_at']
    list_filter     = ['is_active', 'is_email_verified', 'is_verified_seller', 'is_staff']
    search_fields   = ['email', 'first_name', 'last_name']
    readonly_fields = ['id', 'created_at', 'email_verification_token', 'email_verification_otp']
    ordering        = ['-created_at']
    actions         = ['suspend_users', 'activate_users']

    fieldsets = (
        ('Identity', {
            'fields': ('id', 'email', 'first_name', 'last_name', 'created_at')
        }),
        ('Account Status', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_email_verified', 'accepted_terms')
        }),
        ('Seller Verification', {
            'fields': ('is_verified_seller', 'student_id', 'national_id', 'mpesa_phone',
                       'seller_terms_accepted', 'course', 'school', 'department', 'year_of_study')
        }),
        ('Email Tokens', {
            'classes': ('collapse',),
            'fields': ('email_verification_token', 'email_verification_otp', 'email_verification_expiry')
        }),
    )

    @admin.action(description='Suspend selected accounts')
    def suspend_users(self, request, queryset):
        queryset.update(is_active=False)

    @admin.action(description='Activate selected accounts')
    def activate_users(self, request, queryset):
        queryset.update(is_active=True)
