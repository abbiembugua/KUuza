from django.db.models import Q
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Transaction
from .serializers import TransactionSerializer
from notifications.models import Notification
from accounts.emails import send_dispute_raised_email


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'scheduled_date']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        now  = timezone.now()

        # Lazy auto-confirm: seller marked delivered, buyer didn't act within 48h
        Transaction.objects.filter(
            Q(buyer=user) | Q(seller=user),
            status='pending',
            seller_confirmed=True,
            is_disputed=False,
            confirmation_deadline__lt=now,
        ).update(status='completed', buyer_confirmed=True)

        # Lazy dispute escalation: deadline passed, not yet escalated
        expired = list(Transaction.objects.filter(
            Q(buyer=user) | Q(seller=user),
            is_disputed=True,
            dispute_escalated=False,
            dispute_deadline__lt=now,
        ).select_related('listing', 'buyer', 'seller'))
        for txn in expired:
            txn.dispute_escalated = True
            txn.save(update_fields=['dispute_escalated', 'updated_at'])
            listing_title = txn.listing.title if txn.listing else 'the item'
            try:
                Notification.objects.create(
                    recipient=txn.seller,
                    transaction=txn,
                    notification_type='delivery_disputed',
                    title='Dispute deadline passed — admin review pending',
                    body=f'The 72-hour window to resolve the dispute on "{listing_title}" has passed. KUuza admin will now review and may take action on your account.',
                )
                Notification.objects.create(
                    recipient=txn.buyer,
                    transaction=txn,
                    notification_type='delivery_disputed',
                    title='Dispute escalated to admin',
                    body=f'The 72-hour resolution window for your dispute on "{listing_title}" has passed. KUuza admin will now review.',
                )
            except Exception:
                pass
            try:
                from accounts.emails import send_dispute_escalation_email
                send_dispute_escalation_email(txn.seller, txn.buyer.full_name, listing_title)
            except Exception:
                pass

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

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(listing__category=category)

        return queryset

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['patch'])
    def mark_complete(self, request, pk=None):
        from datetime import timedelta
        transaction = self.get_object()

        if transaction.seller != request.user:
            return Response(
                {'error': 'Only the seller can mark a transaction as complete.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if transaction.status in ('completed', 'auto_completed') or transaction.seller_confirmed:
            return Response(
                {'error': 'This transaction is already complete.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()
        transaction.seller_confirmed      = True
        transaction.completed_at          = now
        transaction.confirmation_deadline = now + timedelta(hours=48)
        transaction.save(update_fields=[
            'seller_confirmed', 'completed_at', 'confirmation_deadline', 'updated_at'
        ])

        # Notify buyer
        try:
            Notification.objects.create(
                recipient=transaction.buyer,
                actor=transaction.seller,
                transaction=transaction,
                notification_type='delivery_marked',
                title='Your order has been marked as delivered',
                body=(
                    f'{transaction.seller.full_name} has marked your order '
                    f'"{transaction.listing.title if transaction.listing else "item"}" '
                    f'as delivered. Confirm receipt to leave a review.'
                ),
            )
        except Exception:
            pass

        return Response(
            TransactionSerializer(transaction, context={'request': request}).data
        )

    @action(detail=True, methods=['patch'])
    def confirm_receipt(self, request, pk=None):
        transaction = self.get_object()

        if transaction.buyer != request.user:
            return Response(
                {'error': 'Only the buyer can confirm receipt.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if transaction.status != 'pending' or transaction.is_disputed:
            return Response(
                {'error': 'This transaction is not awaiting confirmation.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaction.status           = 'completed'
        transaction.buyer_confirmed  = True
        transaction.seller_confirmed = True
        transaction.save()

        # Notify seller
        try:
            Notification.objects.create(
                recipient=transaction.seller,
                actor=transaction.buyer,
                transaction=transaction,
                notification_type='receipt_confirmed',
                title='Buyer confirmed delivery',
                body=(
                    f'{transaction.buyer.full_name} confirmed they received '
                    f'"{transaction.listing.title if transaction.listing else "the item"}". '
                    f'They can now leave you a review.'
                ),
            )
        except Exception:
            pass

        return Response(
            TransactionSerializer(transaction, context={'request': request}).data
        )

    @action(detail=True, methods=['patch'])
    def dispute(self, request, pk=None):
        transaction = self.get_object()

        if transaction.buyer != request.user:
            return Response(
                {'error': 'Only the buyer can raise a dispute.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if transaction.is_disputed:
            return Response(
                {'error': 'A dispute has already been raised on this transaction.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        buyer_reason = (request.data.get('reason') or '').strip()
        if not buyer_reason:
            return Response(
                {'error': 'Please describe the issue with your order so admin can review it if needed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()
        post_receipt = False

        if transaction.status == 'pending':
            pass  # always allowed while pending
        elif transaction.status in ('completed', 'auto_completed'):
            if not transaction.completed_at:
                return Response(
                    {'error': 'This transaction cannot be disputed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            hours_since = (now - transaction.completed_at).total_seconds() / 3600
            if hours_since > 24:
                return Response(
                    {'error': 'Disputes on completed orders must be raised within 24 hours of confirming receipt.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            post_receipt = True
        else:
            return Response(
                {'error': 'This transaction cannot be disputed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from datetime import timedelta
        transaction.is_disputed       = True
        transaction.disputed_at       = now
        transaction.dispute_deadline  = now + timedelta(hours=72)
        transaction.dispute_escalated = False
        transaction.save(update_fields=['is_disputed', 'disputed_at', 'dispute_deadline', 'dispute_escalated', 'updated_at'])

        # Create a report record so admin can review it
        try:
            from reports.models import Report
            listing_title = transaction.listing.title if transaction.listing else 'Unknown listing'
            context_note = 'after confirming receipt (item defective/not as described)' if post_receipt else 'before receipt (item not received)'
            Report.objects.create(
                transaction=transaction,
                listing=transaction.listing,
                reported_user=transaction.seller,
                reporter=transaction.buyer,
                reason='delivery_dispute',
                details=(
                    f'Buyer {transaction.buyer.full_name} reported an issue with '
                    f'"{listing_title}" (KSh {transaction.agreed_price}) '
                    f'from seller {transaction.seller.full_name} — {context_note}. '
                    f'Scheduled: {transaction.scheduled_date}. '
                    f'Payment: {transaction.get_payment_method_display()}.\n\n'
                    f'Buyer\'s description: {buyer_reason}'
                ),
            )
        except Exception:
            pass

        # Notify seller
        listing_title = transaction.listing.title if transaction.listing else 'the item'
        try:
            Notification.objects.create(
                recipient=transaction.seller,
                actor=transaction.buyer,
                transaction=transaction,
                notification_type='delivery_disputed',
                title='Buyer raised a dispute',
                body=(
                    f'{transaction.buyer.full_name} reported an issue with '
                    f'"{listing_title}". '
                    f'Please contact them directly to resolve this. '
                    f'If resolved, ask them to close the dispute on their end.'
                ),
            )
        except Exception:
            pass
        try:
            send_dispute_raised_email(transaction.seller, transaction.buyer.full_name, listing_title)
        except Exception:
            pass

        return Response(
            TransactionSerializer(transaction, context={'request': request}).data
        )

    @action(detail=True, methods=['patch'])
    def resolve_dispute(self, request, pk=None):
        transaction = self.get_object()

        if transaction.buyer != request.user:
            return Response(
                {'error': 'Only the buyer can close a dispute.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not transaction.is_disputed:
            return Response(
                {'error': 'No active dispute on this transaction.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaction.is_disputed = False
        transaction.save(update_fields=['is_disputed', 'updated_at'])

        # Close the pending dispute report — no admin intervention needed
        try:
            from reports.models import Report
            Report.objects.filter(
                transaction=transaction,
                reason='delivery_dispute',
                status__in=['pending', 'in_mediation'],
            ).update(status='dismissed')
        except Exception:
            pass

        try:
            Notification.objects.create(
                recipient=transaction.seller,
                actor=transaction.buyer,
                transaction=transaction,
                notification_type='dispute_resolved',
                title='Dispute closed',
                body=(
                    f'{transaction.buyer.full_name} has closed the dispute on '
                    f'"{transaction.listing.title if transaction.listing else "the item"}". '
                    f'The issue has been resolved — thank you for following up.'
                ),
            )
        except Exception:
            pass

        return Response(
            TransactionSerializer(transaction, context={'request': request}).data
        )

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        from django.db.models import F
        from listings.models import Listing

        transaction = self.get_object()

        if transaction.status != 'pending':
            return Response(
                {'error': 'Only pending transactions can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if transaction.mpesa_paid:
            return Response(
                {'error': 'This transaction cannot be cancelled because M-Pesa payment has already been received. Raise a dispute if there is an issue.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user != transaction.buyer and request.user != transaction.seller:
            return Response(
                {'error': 'You are not authorised to cancel this transaction.'},
                status=status.HTTP_403_FORBIDDEN
            )

        transaction.status = 'cancelled'
        transaction.save(update_fields=['status'])

        if transaction.interaction_type == 'purchase' and transaction.listing_id:
            Listing.objects.filter(pk=transaction.listing_id).update(
                quantity=F('quantity') + transaction.quantity
            )
            released = Listing.objects.filter(pk=transaction.listing_id).first()
            if released and released.status == 'sold' and released.quantity > 0:
                Listing.objects.filter(pk=transaction.listing_id).update(status='active')

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

        bulk_ids = request.data.get('bulk_transaction_ids', [])
        if bulk_ids:
            bulk_txns = Transaction.objects.filter(id__in=bulk_ids, buyer=request.user)
            amount = sum(
                float(t.agreed_price or 0) * int(t.quantity or 1)
                for t in bulk_txns
            ) or request.data.get('amount') or float(transaction.agreed_price or 0) * int(transaction.quantity or 1) or 1
        else:
            amount = (
                request.data.get('amount')
                or float(transaction.agreed_price or 0) * int(transaction.quantity or 1)
                or 1
            )

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

            try:
                Notification.objects.create(
                    recipient=transaction.buyer,
                    actor=transaction.seller,
                    transaction=transaction,
                    notification_type='receipt_ready',
                    title='Receipt ready',
                    body=f'Your receipt for {transaction.listing.title if transaction.listing else "your purchase"} is ready to download.',
                )
            except Exception:
                pass

            return Response({
                'message': 'STK push sent. Check your phone to complete payment.',
                'checkout_request_id': result.get('CheckoutRequestID'),
            })
        except Exception as exc:
            import requests as req_lib
            if isinstance(exc, (req_lib.exceptions.ConnectionError, req_lib.exceptions.Timeout)):
                msg = 'M-Pesa is temporarily unavailable. Please try again in a moment.'
            else:
                msg = 'Could not initiate M-Pesa payment. Please try again.'
            return Response({'error': msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                transaction.mpesa_paid    = True
                # Keep status='pending' — delivery still needs to happen.
                # The normal mark_complete / confirm_receipt flow runs from here.
                transaction.save(update_fields=['mpesa_receipt', 'mpesa_paid', 'updated_at'])
                # Notify the seller that payment is confirmed and they should arrange delivery
                try:
                    Notification.objects.create(
                        recipient=transaction.seller,
                        actor=transaction.buyer,
                        transaction=transaction,
                        notification_type='purchase_created',
                        title='M-Pesa payment confirmed',
                        body=(
                            f'{transaction.buyer.full_name} has paid via M-Pesa for '
                            f'"{transaction.listing.title if transaction.listing else "your listing"}". '
                            f'Please arrange delivery and mark it as delivered once done.'
                        ),
                    )
                except Exception:
                    pass

            else:
                transaction.mpesa_receipt = ''
                transaction.save(update_fields=['mpesa_receipt'])
        except Exception as exc:
            print(f"M-Pesa callback error: {exc}")

        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})
