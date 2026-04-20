# accounts/emails.py
import secrets
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

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


def send_password_reset_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = PasswordResetTokenGenerator().make_token(user)
    reset_url = f"{settings.FRONTEND_URL}/forgot-password?uid={uid}&token={token}"

    send_mail(
        subject="Reset your KUuza password",
        message=(
            f"Hi {user.full_name},\n\n"
            f"Click the link below to reset your password:\n{reset_url}\n\n"
            "If you did not request this, you can ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
