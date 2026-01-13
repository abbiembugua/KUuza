from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'is_active', 'created_at']
        read_only_fields = ['id', 'is_active', 'created_at']

class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'full_name',
            'email',
            'password',
            'confirm_password',
            'accepted_terms'
        ]

    def validate_email(self, value):
        # Updated to accept student emails: admissionnumber.year@students.ku.ac.ke
        if not value.endswith('@students.ku.ac.ke'):
            raise serializers.ValidationError("Only KU student emails (@students.ku.ac.ke) are allowed.")
        
        # Additional validation for format: admissionnumber.year@students.ku.ac.ke
        import re
        pattern = r'^[A-Za-z0-9]+\.20\d{2}@students\.ku\.ac\.ke$'
        if not re.match(pattern, value):
            raise serializers.ValidationError("Email format should be: admissionnumber.year@students.ku.ac.ke (e.g., 0983.2022@students.ku.ac.ke)")
        
        return value

    def validate(self, data):
        # Check if passwords match
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        # Remove confirm_password from validated data before creating user
        validated_data.pop('confirm_password', None)
        return User.objects.create_user(**validated_data)