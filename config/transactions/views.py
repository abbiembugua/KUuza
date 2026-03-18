from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    """
    Endpoints:
      POST /api/transactions/              — create a transaction (buyer checkout)
      GET  /api/transactions/              — list all transactions for current user
      GET  /api/transactions/{id}/         — single transaction detail
      PATCH /api/transactions/{id}/mark_complete/  — seller marks done
      GET  /api/transactions/pending_reviews/      — transactions awaiting a review
    """

    serializer_class   = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [filters.OrderingFilter]
    ordering_fields    = ['created_at', 'scheduled_date']
    ordering           = ['-created_at']

    def get_queryset(self):
        """
        Return all transactions where the current user is either the buyer
        or the seller. This powers the unified Purchases page.
        """
        user = self.request.user
        qs   = Transaction.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).select_related(
            'listing', 'buyer', 'seller'
        ).prefetch_related(
            'listing__images'
        )

        # Optional filters from query params
        role   = self.request.query_params.get('role')   # 'buyer' or 'seller'
        status = self.request.query_params.get('status') # 'pending', 'completed' etc

        if role == 'buyer':
            qs = qs.filter(buyer=user)
        elif role == 'seller':
            qs = qs.filter(seller=user)

        if status:
            qs = qs.filter(status=status)

        return qs

    def perform_create(self, serializer):
        serializer.save()

    # ── PATCH /api/transactions/{id}/mark_complete/ ───────────────────────────
    @action(detail=True, methods=['patch'])
    def mark_complete(self, request, pk=None):
        """
        Seller marks the transaction as complete.
        This triggers listing status update and unlocks the review prompt.
        """
        transaction = self.get_object()

        if transaction.seller != request.user:
            return Response(
                {'error': 'Only the seller can mark a transaction as complete.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if transaction.status in ('completed', 'auto_completed'):
            return Response(
                {'error': 'This transaction is already complete.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaction.status       = 'completed'
        transaction.completed_at = timezone.now()
        transaction.save()

        return Response(
            TransactionSerializer(transaction, context={'request': request}).data
        )

    # ── GET /api/transactions/pending_reviews/ ────────────────────────────────
    @action(detail=False, methods=['get'])
    def pending_reviews(self, request):
        """
        Returns completed transactions where the current user
        has not yet submitted a review.
        Used to show the 'Leave a Review' prompt on the Purchases page.
        """
        from reviews.models import Review

        user = request.user

        # All completed transactions involving this user
        completed = Transaction.objects.filter(
            Q(buyer=user) | Q(seller=user),
            status__in=['completed', 'auto_completed']
        )

        # Find which ones the user has already reviewed
        reviewed_transaction_ids = Review.objects.filter(
            reviewer=user
        ).values_list('transaction_id', flat=True)

        # Return the ones not yet reviewed
        pending = completed.exclude(
            id__in=reviewed_transaction_ids
        ).select_related('listing', 'buyer', 'seller').prefetch_related('listing__images')

        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)