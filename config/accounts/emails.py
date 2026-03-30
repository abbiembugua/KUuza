# accounts/emails.py
import secrets
from django.core.mail import send_mail
from django.conf import settings

def generate_verification_token():
    return secrets.token_urlsafe(32)

def send_verification_email(user):
    token = generate_verification_token()
    user.email_verification_token = token
    user.save(update_fields=['email_verification_token'])

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    send_mail(
        subject="Verify your KUuza email",
        message=f"Hi {user.full_name},\n\nClick the link below to verify your email:\n{verify_url}\n\nThis link expires in 24 hours.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )