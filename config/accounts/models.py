import uuid
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager
)

class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, accepted_terms=False):
        if not email:
            raise ValueError("Email is required")

        if not accepted_terms:
            raise ValueError("Terms must be accepted")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            full_name=full_name,
            accepted_terms=accepted_terms
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password):
        user = self.create_user(
            email=email,
            full_name=full_name,
            password=password,
            accepted_terms=True
        )
        user.is_staff = True
        user.is_superuser = True
        user.is_email_verified = True
        user.save()
        return user


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)

    accepted_terms = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=64, blank=True, null=True)
    email_verification_otp = models.CharField(max_length=6, blank=True, null=True)
    email_verification_expiry = models.DateTimeField(blank=True, null=True)

    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)

    # Seller verification fields
    student_id = models.CharField(max_length=50, blank=True, null=True)
    national_id = models.CharField(max_length=50, blank=True, null=True)
    mpesa_phone = models.CharField(max_length=20, blank=True, null=True)
    seller_terms_accepted = models.BooleanField(default=False)
    is_verified_seller = models.BooleanField(default=False)
    course = models.CharField(max_length=200, blank=True, null=True)
    school = models.CharField(max_length=200, blank=True, null=True)
    department = models.CharField(max_length=200, blank=True, null=True)
    year_of_study = models.CharField(max_length=20, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    def __str__(self):
        return self.email
