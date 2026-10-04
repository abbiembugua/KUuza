from django.utils import timezone
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [filters.OrderingFilter]
    ordering_fields    = ['created_at']
    ordering           = ['-created_at']

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
            is_read=False
        ).select_related('actor', 'transaction', 'listing')

    @action(detail=True, methods=['patch'])
    def dismiss(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at'])
        return Response(self.get_serializer(notification).data)
