from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_name     = serializers.CharField(source='actor.full_name', read_only=True)
    transaction_id = serializers.UUIDField(source='transaction.id',  read_only=True)
    listing_id     = serializers.UUIDField(source='listing.id',      read_only=True)

    class Meta:
        model  = Notification
        fields = [
            'id',
            'title',
            'body',
            'notification_type',
            'is_read',
            'created_at',
            'read_at',
            'actor_name',
            'transaction_id',
            'listing_id',
        ]
