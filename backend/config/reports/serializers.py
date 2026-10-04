from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Report

User = get_user_model()


class ReportCreateSerializer(serializers.ModelSerializer):
    reported_user_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Report
        fields = ['listing', 'reported_user_id', 'reason', 'details']

    def validate(self, data):
        if not data.get('listing') and not data.get('reported_user_id'):
            raise serializers.ValidationError("A listing or a user must be specified.")
        return data

    def create(self, validated_data):
        listing = validated_data.pop('listing', None)
        reported_user_id = validated_data.pop('reported_user_id', None)

        if listing:
            reported_user = listing.seller
        elif reported_user_id:
            reported_user = User.objects.filter(pk=reported_user_id).first()
        else:
            reported_user = None

        # reporter is injected via perform_create → serializer.save(reporter=...)
        return Report.objects.create(
            listing=listing,
            reported_user=reported_user,
            **validated_data
        )
