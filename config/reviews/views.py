from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count
from .models import Review
from .serializers import ReviewSerializer, ReviewSummarySerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """
    Endpoints:
      GET  /api/reviews/                        — list all reviews (filterable)
      POST /api/reviews/                        — submit a review
      GET  /api/reviews/{id}/                   — single review detail
      GET  /api/reviews/for_user/{user_id}/     — all reviews FOR a specific user
      GET  /api/reviews/by_me/                  — reviews the logged-in user has given
      GET  /api/reviews/summary/{user_id}/      — aggregated stats for a user
      GET  /api/reviews/pending/                — transactions awaiting review from me
    """

    serializer_class   = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends    = [filters.OrderingFilter]
    ordering_fields    = ['created_at', 'score']
    ordering           = ['-created_at']

    def get_queryset(self):
        qs = Review.objects.select_related('reviewer', 'reviewee').all()

        # Filter by reviewee (who is being reviewed)
        reviewee = self.request.query_params.get('reviewee')
        if reviewee:
            qs = qs.filter(reviewee__id=reviewee)

        # Filter by reviewer (who wrote the review)
        reviewer = self.request.query_params.get('reviewer')
        if reviewer:
            qs = qs.filter(reviewer__id=reviewer)

        # Filter by transaction
        transaction_id = self.request.query_params.get('transaction_id')
        if transaction_id:
            qs = qs.filter(transaction_id=transaction_id)

        # Filter by score
        score = self.request.query_params.get('score')
        if score:
            qs = qs.filter(score=score)

        return qs

    def get_permissions(self):
        if self.action in ['create', 'by_me', 'pending']:
            return [IsAuthenticated()]
        return super().get_permissions()

    # ── POST /api/reviews/ ────────────────────────────────────────────────────
    def perform_create(self, serializer):
        review = serializer.save(reviewer=self.request.user)
        try:
            from notifications.models import Notification
            Notification.objects.create(
                recipient=review.reviewee,
                actor=review.reviewer,
                notification_type='review_received',
                title='You received a new review',
                body=(
                    f'{review.reviewer.full_name} left you a '
                    f'{review.score}-star review'
                    + (f': "{review.comment[:80]}"' if review.comment else '.')
                ),
            )
        except Exception:
            pass

    # ── GET /api/reviews/for_user/{user_id}/ ──────────────────────────────────
    @action(detail=False, methods=['get'], url_path='for_user/(?P<user_id>[^/.]+)')
    def for_user(self, request, user_id=None):
        """
        All reviews received BY a specific user.
        Pass ?as_seller=true to restrict to reviews from transactions where
        the user was the seller (i.e. buyer-reviewing-seller feedback only).
        """
        reviews = Review.objects.filter(
            reviewee__id=user_id
        ).select_related('reviewer', 'reviewee').order_by('-created_at')

        as_seller = request.query_params.get('as_seller', '').lower() in ('true', '1')
        as_buyer  = request.query_params.get('as_buyer',  '').lower() in ('true', '1')
        if as_seller or as_buyer:
            from transactions.models import Transaction
            role_field = 'seller__id' if as_seller else 'buyer__id'
            role_txn_ids = Transaction.objects.filter(
                **{role_field: user_id}
            ).values_list('id', flat=True)
            reviews = reviews.filter(transaction_id__in=role_txn_ids)

        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    # ── GET /api/reviews/by_me/ ───────────────────────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def by_me(self, request):
        """All reviews the logged-in user has written."""
        reviews = Review.objects.filter(
            reviewer=request.user
        ).select_related('reviewer', 'reviewee').order_by('-created_at')

        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    # ── GET /api/reviews/summary/{user_id}/ ───────────────────────────────────
    @action(detail=False, methods=['get'], url_path='summary/(?P<user_id>[^/.]+)')
    def summary(self, request, user_id=None):
        """
        Aggregated rating summary for a user.
        Returns average, total count, and per-star breakdown.
        """
        reviews = Review.objects.filter(reviewee__id=user_id)
        agg     = reviews.aggregate(avg=Avg('score'), total=Count('id'))

        breakdown = {}
        for star in range(1, 6):
            breakdown[str(star)] = reviews.filter(score=star).count()

        return Response({
            'average_rating':  round(agg['avg'] or 0, 2),
            'total_reviews':   agg['total'] or 0,
            'score_breakdown': breakdown,
        })

    # ── GET /api/reviews/check/?transaction_id=xxx ────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def check(self, request):
        """
        Check if the current user has already reviewed a specific transaction.
        Returns { has_reviewed: bool }
        """
        transaction_id = request.query_params.get('transaction_id')
        if not transaction_id:
            return Response(
                {'error': 'transaction_id query param required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        has_reviewed = Review.objects.filter(
            reviewer=request.user,
            transaction_id=transaction_id
        ).exists()
        return Response({'has_reviewed': has_reviewed})