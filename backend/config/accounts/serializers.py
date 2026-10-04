import re
from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'is_active', 'is_staff', 'created_at', 'is_email_verified',
            'is_verified_seller', 'student_id', 'national_id', 'mpesa_phone',
            'seller_terms_accepted', 'course', 'school', 'department',
            'year_of_study', 'profile_picture',
        ]
        read_only_fields = [
            'id', 'is_active', 'is_staff', 'created_at',
            'is_email_verified', 'is_verified_seller', 'full_name',
        ]


class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'password',
            'confirm_password',
            'accepted_terms',
        ]

    def validate_email(self, value):
        if not value.endswith('@students.ku.ac.ke'):
            raise serializers.ValidationError(
                "Only KU student emails (@students.ku.ac.ke) are allowed."
            )
        pattern = r'^[A-Za-z0-9]+\.20\d{2}@students\.ku\.ac\.ke$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Email format should be: admissionnumber.year@students.ku.ac.ke "
                "(e.g., 0983.2022@students.ku.ac.ke)"
            )
        return value

    def validate_first_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("First name cannot be empty.")
        if not re.match(r"^[A-Za-z\s'\-]+$", value):
            raise serializers.ValidationError("First name can only contain letters.")
        return value

    def validate_last_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Last name cannot be empty.")
        if not re.match(r"^[A-Za-z\s'\-]+$", value):
            raise serializers.ValidationError("Last name can only contain letters.")
        return value

    def validate_accepted_terms(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the terms and conditions.")
        return value

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        return User.objects.create_user(**validated_data)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name',
            'student_id', 'national_id', 'mpesa_phone',
            'course', 'school', 'department', 'year_of_study',
        ]

    def validate_first_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("First name cannot be empty.")
        return value

    def validate_last_name(self, value):
        return value.strip()

    def validate_mpesa_phone(self, value):
        if value:
            pattern = r'^(\+254|254|0)[17]\d{8}$'
            if not re.match(pattern, value.strip()):
                raise serializers.ValidationError(
                    "Enter a valid M-Pesa number (e.g. 0712345678 or +254712345678)."
                )
        return value


class SellerVerificationSerializer(serializers.Serializer):
    student_id = serializers.CharField(max_length=50)
    national_id = serializers.CharField(max_length=50)
    mpesa_phone = serializers.CharField(max_length=20)
    seller_terms_accepted = serializers.BooleanField()
    course = serializers.CharField(max_length=200)
    school = serializers.CharField(max_length=200)
    department = serializers.CharField(max_length=200)
    year_of_study = serializers.CharField(max_length=20)

    def validate_student_id(self, value):
        return value.strip()

    def validate_national_id(self, value):
        return value.strip()

    def validate_mpesa_phone(self, value):
        pattern = r'^(\+254|254|0)[17]\d{8}$'
        if not re.match(pattern, value.strip()):
            raise serializers.ValidationError(
                "Enter a valid M-Pesa number (e.g. 0712345678 or +254712345678)."
            )
        return value.strip()

    def validate_seller_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the seller terms and conditions.")
        return value
