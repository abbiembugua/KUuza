from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from listings.models import Listing
from reports.models import Report
from transactions.models import Transaction as Txn
from notifications.models import Notification
from accounts.emails import send_account_suspended_email, send_account_reactivated_email
from .permissions import IsStaffUser

User = get_user_model()


class AdminDashboardView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        return Response({
            'total_listings':     Listing.objects.filter(status='active', is_draft=False).count(),
            'total_users':        User.objects.filter(is_staff=False).count(),
            'pending_reports':    Report.objects.filter(status='pending').count(),
            'verified_sellers':   User.objects.filter(is_verified_seller=True, is_staff=False).count(),
            'escalated_disputes': Txn.objects.filter(is_disputed=True, dispute_escalated=True).count(),
        })


class AdminListingsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        listings = Listing.objects.select_related('seller').order_by('-created_at')
        data = [
            {
                'id': str(l.id),
                'title': l.title,
                'seller_name': l.seller.full_name,
                'seller_email': l.seller.email,
                'price': str(l.price) if l.price is not None else None,
                'category': l.get_category_display(),
                'category_code': l.category,
                'listing_type': l.listing_type,
                'status': l.status,
                'is_draft': l.is_draft,
                'created_at': l.created_at.isoformat(),
            }
            for l in listings
        ]
        return Response(data)


class AdminListingDetailView(APIView):
    permission_classes = [IsStaffUser]

    def delete(self, request, pk):
        try:
            listing = Listing.objects.select_related('seller').get(pk=pk)
        except (Listing.DoesNotExist, Exception):
            return Response({'error': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)

        listing.status = 'deactivated'
        try:
            listing.save(update_fields=['status'])
        except Exception as e:
            return Response({'error': f'Failed to archive listing: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            Notification.objects.create(
                recipient=listing.seller,
                notification_type='listing_archived',
                title='Your listing has been archived',
                body=f'Your listing "{listing.title}" has been archived by a platform administrator and is no longer visible to other users. Contact support if you believe this is an error.',
            )
        except Exception:
            pass
        return Response({'message': 'Listing archived'}, status=status.HTTP_200_OK)


class AdminUsersView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        users = User.objects.filter(is_staff=False).order_by('-created_at')
        data = [
            {
                'id': str(u.id),
                'full_name': u.full_name,
                'email': u.email,
                'is_active': u.is_active,
                'is_verified_seller': u.is_verified_seller,
                'is_email_verified': u.is_email_verified,
                'created_at': u.created_at.isoformat(),
            }
            for u in users
        ]
        return Response(data)


class AdminUserActionView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, pk, action):
        try:
            user = User.objects.get(pk=pk, is_staff=False)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'suspend':
            user.is_active = False
            user.save(update_fields=['is_active'])
            try:
                Notification.objects.create(
                    recipient=user,
                    notification_type='account_suspended',
                    title='Your account has been suspended',
                    body='Your KUuza account has been suspended by a platform administrator. Contact support if you believe this is an error.',
                )
            except Exception:
                pass
            try:
                send_account_suspended_email(user)
            except Exception:
                pass
            return Response({'message': 'User suspended'})

        if action == 'reactivate':
            user.is_active = True
            user.save(update_fields=['is_active'])
            try:
                Notification.objects.create(
                    recipient=user,
                    notification_type='account_reactivated',
                    title='Your account has been reactivated',
                    body='Your KUuza account has been reactivated. You can now log in and use the platform.',
                )
            except Exception:
                pass
            try:
                send_account_reactivated_email(user)
            except Exception:
                pass
            return Response({'message': 'User reactivated'})

        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class AdminReportsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        reports = Report.objects.select_related(
            'listing',
            'reporter',
            'reported_user',
            'transaction',
            'transaction__buyer',
            'transaction__seller',
            'transaction__listing',
        ).all()
        data = []
        for r in reports:
            txn = r.transaction
            entry = {
                'id': str(r.id),
                # Listing context
                'listing_id':    str(r.listing.id) if r.listing else None,
                'listing_title': r.listing.title   if r.listing else None,
                # Reporter (always the complainant)
                'reporter_name':  r.reporter.full_name,
                'reporter_email': r.reporter.email,
                # Reported user
                'reported_user_id':    str(r.reported_user.id)    if r.reported_user else None,
                'reported_user_name':  r.reported_user.full_name  if r.reported_user else None,
                'reported_user_email': r.reported_user.email      if r.reported_user else None,
                # Report metadata
                'reason':     r.get_reason_display(),
                'reason_code': r.reason,
                'details':    r.details,
                'status':     r.status,
                'created_at': r.created_at.isoformat(),
                # Transaction context (populated for delivery disputes)
                'transaction_id':      str(txn.id)                       if txn else None,
                'agreed_price':        str(txn.agreed_price)             if txn and txn.agreed_price else None,
                'payment_method':      txn.get_payment_method_display()  if txn else None,
                'scheduled_date':      txn.scheduled_date.isoformat()    if txn and txn.scheduled_date else None,
                'buyer_name':          txn.buyer.full_name               if txn and txn.buyer  else None,
                'buyer_email':         txn.buyer.email                   if txn and txn.buyer  else None,
                'seller_name':         txn.seller.full_name              if txn and txn.seller else None,
                'seller_email':        txn.seller.email                  if txn and txn.seller else None,
                # Dispute state
                'dispute_deadline':  txn.dispute_deadline.isoformat() if txn and txn.dispute_deadline else None,
                'dispute_escalated': txn.dispute_escalated             if txn else False,
                'dispute_resolved':  (not txn.is_disputed)             if txn else False,
            }
            data.append(entry)
        return Response(data)


class AdminReportActionView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, pk, action):
        try:
            report = Report.objects.select_related('listing', 'reported_user').get(pk=pk)
        except Report.DoesNotExist:
            return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'dismiss':
            report.status = 'dismissed'
            report.save(update_fields=['status'])
            try:
                Notification.objects.create(
                    recipient=report.reporter,
                    notification_type='report_dismissed',
                    title='Your report was reviewed',
                    body='A report you submitted has been reviewed and dismissed by a platform administrator.',
                )
            except Exception:
                pass
            return Response({'message': 'Report dismissed'})

        if action == 'remove_listing':
            if report.listing:
                listing = report.listing
                listing.status = 'deactivated'
                listing.save(update_fields=['status'])
                try:
                    Notification.objects.create(
                        recipient=listing.seller,
                        notification_type='listing_archived',
                        title='Your listing has been archived',
                        body=f'Your listing "{listing.title}" has been archived following a report. It is no longer visible to other users. Contact support if you believe this is an error.',
                    )
                except Exception:
                    pass
            report.status = 'acted'
            report.save(update_fields=['status'])
            try:
                Notification.objects.create(
                    recipient=report.reporter,
                    notification_type='report_acted',
                    title='Your report has been acted on',
                    body='A report you submitted has been reviewed and the listing has been archived.',
                )
            except Exception:
                pass
            return Response({'message': 'Listing archived and report resolved'})

        if action == 'suspend_user':
            if report.reported_user:
                report.reported_user.is_active = False
                report.reported_user.save(update_fields=['is_active'])
                try:
                    Notification.objects.create(
                        recipient=report.reported_user,
                        notification_type='account_suspended',
                        title='Your account has been suspended',
                        body='Your KUuza account has been suspended following a report. Contact support if you believe this is an error.',
                    )
                except Exception:
                    pass
                try:
                    send_account_suspended_email(report.reported_user)
                except Exception:
                    pass
            report.status = 'acted'
            report.save(update_fields=['status'])
            try:
                Notification.objects.create(
                    recipient=report.reporter,
                    notification_type='report_acted',
                    title='Your report has been acted on',
                    body='A report you submitted has been reviewed and the reported user has been suspended.',
                )
            except Exception:
                pass
            return Response({'message': 'User suspended and report resolved'})

        if action == 'prompt_resolution':
            txn = report.transaction
            if not txn:
                return Response({'error': 'No transaction linked to this report.'}, status=status.HTTP_400_BAD_REQUEST)
            if not txn.is_disputed:
                return Response({'error': 'This dispute is already resolved.'}, status=status.HTTP_400_BAD_REQUEST)

            report.status = 'in_mediation'
            report.save(update_fields=['status'])

            listing_title = txn.listing.title if txn.listing else 'the item'
            try:
                Notification.objects.create(
                    recipient=txn.buyer,
                    transaction=txn,
                    notification_type='delivery_disputed',
                    title='Please try to resolve your dispute directly',
                    body=(
                        f'A KUuza admin has reviewed your dispute on "{listing_title}". '
                        f'We ask that you and the seller try to reach an agreement directly first. '
                        f'If you cannot resolve it, admin will step in and make a final decision.'
                    ),
                )
            except Exception:
                pass
            try:
                Notification.objects.create(
                    recipient=txn.seller,
                    transaction=txn,
                    notification_type='delivery_disputed',
                    title='Please resolve the dispute with your buyer',
                    body=(
                        f'A KUuza admin has reviewed the dispute on "{listing_title}". '
                        f'Please contact your buyer and try to reach an agreement. '
                        f'If unresolved, admin will make a final decision that may affect your account.'
                    ),
                )
            except Exception:
                pass

            return Response({'message': 'Both parties notified to attempt self-resolution.'})

        if action == 'resolve_for_buyer':
            txn = report.transaction
            if not txn:
                return Response({'error': 'No transaction linked to this report.'}, status=status.HTTP_400_BAD_REQUEST)
            if not txn.is_disputed:
                return Response({'error': 'This dispute is already resolved.'}, status=status.HTTP_400_BAD_REQUEST)

            txn.is_disputed      = False
            txn.status           = 'cancelled'
            txn.save(update_fields=['is_disputed', 'status', 'updated_at'])

            report.status = 'acted'
            report.save(update_fields=['status'])

            listing_title = txn.listing.title if txn.listing else 'your order'
            try:
                Notification.objects.create(
                    recipient=txn.buyer,
                    transaction=txn,
                    notification_type='dispute_resolved',
                    title='Dispute resolved — decision in your favour',
                    body=(
                        f'An admin has reviewed your dispute on "{listing_title}" and ruled in your favour. '
                        f'The transaction has been cancelled. '
                        f'If you made an M-Pesa payment, please contact support to arrange a refund.'
                    ),
                )
            except Exception:
                pass
            try:
                Notification.objects.create(
                    recipient=txn.seller,
                    transaction=txn,
                    notification_type='dispute_resolved',
                    title='Dispute resolved by admin — transaction cancelled',
                    body=(
                        f'An admin has reviewed the dispute on "{listing_title}" and cancelled the transaction. '
                        f'If the buyer made a payment, you are required to refund it. '
                        f'Repeated disputes may affect your seller status.'
                    ),
                )
            except Exception:
                pass

            return Response({'message': 'Dispute resolved in buyer\'s favour. Transaction cancelled.'})

        if action == 'resolve_for_seller':
            txn = report.transaction
            if not txn:
                return Response({'error': 'No transaction linked to this report.'}, status=status.HTTP_400_BAD_REQUEST)
            if not txn.is_disputed:
                return Response({'error': 'This dispute is already resolved.'}, status=status.HTTP_400_BAD_REQUEST)

            from django.utils import timezone as tz
            txn.is_disputed      = False
            txn.status           = 'completed'
            txn.seller_confirmed = True
            txn.buyer_confirmed  = True
            txn.completed_at     = tz.now()
            txn.save(update_fields=['is_disputed', 'status', 'seller_confirmed', 'buyer_confirmed', 'completed_at', 'updated_at'])

            report.status = 'acted'
            report.save(update_fields=['status'])

            listing_title = txn.listing.title if txn.listing else 'the item'
            try:
                Notification.objects.create(
                    recipient=txn.seller,
                    transaction=txn,
                    notification_type='dispute_resolved',
                    title='Dispute resolved — delivery confirmed by admin',
                    body=(
                        f'An admin has reviewed the dispute on "{listing_title}" and confirmed that delivery was completed. '
                        f'The transaction is now marked as complete.'
                    ),
                )
            except Exception:
                pass
            try:
                Notification.objects.create(
                    recipient=txn.buyer,
                    transaction=txn,
                    notification_type='dispute_resolved',
                    title='Dispute reviewed — delivery confirmed by admin',
                    body=(
                        f'An admin has reviewed your dispute on "{listing_title}" and determined that delivery was completed. '
                        f'The transaction has been marked as complete. '
                        f'If you believe this is incorrect, please contact support.'
                    ),
                )
            except Exception:
                pass

            return Response({'message': 'Dispute resolved in seller\'s favour. Transaction marked as completed.'})

        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class AdminSellerRevokeView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk, is_staff=False, is_verified_seller=True)
        except User.DoesNotExist:
            return Response({'error': 'Verified seller not found'}, status=status.HTTP_404_NOT_FOUND)

        user.is_verified_seller = False
        user.save(update_fields=['is_verified_seller'])
        try:
            Notification.objects.create(
                recipient=user,
                notification_type='seller_revoked',
                title='Your seller status has been revoked',
                body='Your KUuza seller verification has been revoked by a platform administrator. Your listings have been deactivated. Contact support for more information.',
            )
        except Exception:
            pass
        return Response({'message': 'Seller verification revoked'})


class AdminSellersView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        sellers = User.objects.filter(is_verified_seller=True, is_staff=False).order_by('-created_at')
        data = [
            {
                'id': str(s.id),
                'full_name': s.full_name,
                'email': s.email,
                'student_id': s.student_id,
                'national_id': s.national_id,
                'course': s.course,
                'school': s.school,
                'department': s.department,
                'year_of_study': s.year_of_study,
                'mpesa_phone': s.mpesa_phone,
                'created_at': s.created_at.isoformat(),
            }
            for s in sellers
        ]
        return Response(data)
