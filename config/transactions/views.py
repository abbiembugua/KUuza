from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Transaction
from .serializers import TransactionSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


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
# Add these two actions inside TransactionViewSet:

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def initiate_mpesa(self, request, pk=None):
        from .mpesa_service import stk_push
        from django.conf import settings  # ← ADD THIS

        transaction = self.get_object()

        if transaction.buyer != request.user:
            return Response({'error': 'Only the buyer can initiate payment.'}, status=status.HTTP_403_FORBIDDEN)

        if transaction.payment_method != 'mpesa':
            return Response({'error': 'This transaction is not set to M-Pesa payment.'}, status=status.HTTP_400_BAD_REQUEST)

        if transaction.mpesa_receipt:
            return Response({'error': 'Payment already completed for this transaction.'}, status=status.HTTP_400_BAD_REQUEST)

        phone  = transaction.mpesa_phone or request.data.get('phone_number', '')
        amount = transaction.agreed_price or 1

        if not phone:
            return Response({'error': 'No M-Pesa phone number on this transaction.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            print("📱 Phone:", phone)
            print("💰 Amount:", amount)
            print("🔑 MPESA_ENV:", settings.MPESA_ENV)

            result = stk_push(phone, amount, transaction.id)  # ← only once
            print("✅ STK RESULT:", result)

            transaction.mpesa_receipt = result.get('CheckoutRequestID', '')
            transaction.save(update_fields=['mpesa_receipt'])

            return Response({
                'message': 'STK push sent. Check your phone to complete payment.',
                'checkout_request_id': result.get('CheckoutRequestID'),
            })

        except Exception as e:
            return Response({'error': f'M-Pesa error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            


    @action(
        detail=False, methods=['post'],
        permission_classes=[],          # Public — Safaricom calls this
        authentication_classes=[],
        url_path='mpesa_callback'
    )
    def mpesa_callback(self, request):
        """
        POST /api/transactions/mpesa_callback/
        Safaricom calls this automatically after the buyer accepts or rejects payment.
        """
        try:
            stk_callback = request.data.get('Body', {}).get('stkCallback', {})
            checkout_request_id = stk_callback.get('CheckoutRequestID', '')
            result_code         = stk_callback.get('ResultCode')

            # Find the transaction by the CheckoutRequestID we stored in mpesa_receipt
            transaction = Transaction.objects.filter(
                mpesa_receipt=checkout_request_id
            ).first()

            if not transaction:
                return Response({"ResultCode": 0, "ResultDesc": "Accepted"})

            if result_code == 0:
                # Payment successful — extract the real receipt number
                items = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                receipt = next(
                    (i['Value'] for i in items if i.get('Name') == 'MpesaReceiptNumber'),
                    ''
                )
                transaction.mpesa_receipt  = receipt          # replace with real receipt
                transaction.status         = 'completed'
                transaction.completed_at   = timezone.now()
                transaction.save(update_fields=['mpesa_receipt', 'status', 'completed_at', 'updated_at'])

                # Mark listing as sold if it is a good
                if transaction.listing and transaction.interaction_type == 'purchase':
                    transaction.listing.mark_sold()
            else:
                # Payment cancelled or failed — reset so buyer can retry
                transaction.mpesa_receipt = ''
                transaction.save(update_fields=['mpesa_receipt'])

        except Exception as e:
            print(f"M-Pesa callback error: {e}")

        # Always return this — Safaricom will keep retrying if you do not
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})