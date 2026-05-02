from django.db.models import Q
from django.db import connection
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification, Transaction
from .serializers import NotificationSerializer, TransactionSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'scheduled_date']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Transaction.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).select_related(
            'listing', 'buyer', 'seller'
        ).prefetch_related(
            'listing__images'
        )

        role = self.request.query_params.get('role')
        transaction_status = self.request.query_params.get('status')

        if role == 'buyer':
          queryset = queryset.filter(buyer=user)
        elif role == 'seller':
          queryset = queryset.filter(seller=user)

        if transaction_status:
          queryset = queryset.filter(status=transaction_status)

        return queryset

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['patch'])
    def mark_complete(self, request, pk=None):
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

        transaction.status = 'completed'
        transaction.completed_at = timezone.now()
        transaction.save()

        return Response(
            TransactionSerializer(transaction, context={'request': request}).data
        )
    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        transaction = self.get_object()

        if transaction.status != 'pending':
            return Response(
                {'error': 'Only pending transactions can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user != transaction.buyer and request.user != transaction.seller:
            return Response(
                {'error': 'You are not authorised to cancel this transaction.'},
                status=status.HTTP_403_FORBIDDEN
            )

        transaction.status = 'cancelled'
        transaction.save(update_fields=['status'])

        return Response(
            TransactionSerializer(transaction, context={'request': request}).data
        )

    @action(detail=False, methods=['get'])
    def pending_reviews(self, request):
        from reviews.models import Review

        user = request.user
        completed = Transaction.objects.filter(
            Q(buyer=user) | Q(seller=user),
            status__in=['completed', 'auto_completed']
        )

        reviewed_transaction_ids = Review.objects.filter(
            reviewer=user
        ).values_list('transaction_id', flat=True)

        pending = completed.exclude(
            id__in=reviewed_transaction_ids
        ).select_related(
            'listing', 'buyer', 'seller'
        ).prefetch_related(
            'listing__images'
        )

        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def initiate_mpesa(self, request, pk=None):
        from django.conf import settings
        from .mpesa_service import stk_push

        transaction = self.get_object()

        if transaction.buyer != request.user:
            return Response(
                {'error': 'Only the buyer can initiate payment.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if transaction.payment_method != 'mpesa':
            return Response(
                {'error': 'This transaction is not set to M-Pesa payment.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if transaction.mpesa_receipt:
            return Response(
                {'error': 'Payment already completed for this transaction.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        phone = transaction.mpesa_phone or request.data.get('phone_number', '')
        amount = request.data.get('amount') or transaction.agreed_price or 1

        if not phone:
            return Response(
                {'error': 'No M-Pesa phone number on this transaction.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            print('Phone:', phone)
            print('Amount:', amount)
            print('MPESA_ENV:', settings.MPESA_ENV)

            result = stk_push(phone, amount, transaction.id)
            print('STK RESULT:', result)

            transaction.mpesa_receipt = result.get('CheckoutRequestID', '')
            transaction.save(update_fields=['mpesa_receipt'])

            return Response({
                'message': 'STK push sent. Check your phone to complete payment.',
                'checkout_request_id': result.get('CheckoutRequestID'),
            })
        except Exception as exc:
            return Response(
                {'error': f'M-Pesa error: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[],
        authentication_classes=[],
        url_path='mpesa_callback'
    )
    def mpesa_callback(self, request):
        try:
            stk_callback = request.data.get('Body', {}).get('stkCallback', {})
            checkout_request_id = stk_callback.get('CheckoutRequestID', '')
            result_code = stk_callback.get('ResultCode')

            transaction = Transaction.objects.filter(
                mpesa_receipt=checkout_request_id
            ).first()

            if not transaction:
                return Response({"ResultCode": 0, "ResultDesc": "Accepted"})

            if result_code == 0:
                items = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                receipt = next(
                    (item['Value'] for item in items if item.get('Name') == 'MpesaReceiptNumber'),
                    ''
                )
                transaction.mpesa_receipt = receipt
                transaction.status = 'completed'
                transaction.completed_at = timezone.now()
                transaction.save(update_fields=['mpesa_receipt', 'status', 'completed_at', 'updated_at'])

                if transaction.listing:
                    transaction.listing.mark_sold(quantity_sold=transaction.quantity or 1)

            else:
                transaction.mpesa_receipt = ''
                transaction.save(update_fields=['mpesa_receipt'])
        except Exception as exc:
            print(f"M-Pesa callback error: {exc}")

        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        existing_tables = connection.introspection.table_names()
        if 'transactions_notification' not in existing_tables:
            return Notification.objects.none()

        return Notification.objects.filter(
            recipient=self.request.user,
            is_read=False
        ).select_related('actor', 'transaction')

    @action(detail=True, methods=['patch'])
    def dismiss(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at'])
        return Response(self.get_serializer(notification).data)
