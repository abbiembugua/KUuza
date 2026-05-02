from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from listings.models import Listing
from reports.models import Report
from .permissions import IsStaffUser

User = get_user_model()


class AdminDashboardView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        return Response({
            'total_listings': Listing.objects.filter(status='active', is_draft=False).count(),
            'total_users': User.objects.filter(is_staff=False).count(),
            'pending_reports': Report.objects.filter(status='pending').count(),
            'verified_sellers': User.objects.filter(is_verified_seller=True, is_staff=False).count(),
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
            listing = Listing.objects.get(pk=pk)
            listing.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)


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
            return Response({'message': 'User suspended'})

        if action == 'reactivate':
            user.is_active = True
            user.save(update_fields=['is_active'])
            return Response({'message': 'User reactivated'})

        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


class AdminReportsView(APIView):
    permission_classes = [IsStaffUser]

    def get(self, request):
        reports = Report.objects.select_related('listing', 'reporter', 'reported_user').all()
        data = [
            {
                'id': str(r.id),
                'listing_id': str(r.listing.id) if r.listing else None,
                'listing_title': r.listing.title if r.listing else None,
                'reported_user_id': str(r.reported_user.id) if r.reported_user else None,
                'reported_user_name': r.reported_user.full_name if r.reported_user else None,
                'reported_user_email': r.reported_user.email if r.reported_user else None,
                'reporter_name': r.reporter.full_name,
                'reporter_email': r.reporter.email,
                'reason': r.get_reason_display(),
                'reason_code': r.reason,
                'details': r.details,
                'status': r.status,
                'created_at': r.created_at.isoformat(),
            }
            for r in reports
        ]
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
            return Response({'message': 'Report dismissed'})

        if action == 'remove_listing':
            if report.listing:
                report.listing.delete()
            report.status = 'acted'
            report.save(update_fields=['status'])
            return Response({'message': 'Listing removed and report resolved'})

        if action == 'suspend_user':
            if report.reported_user:
                report.reported_user.is_active = False
                report.reported_user.save(update_fields=['is_active'])
            report.status = 'acted'
            report.save(update_fields=['status'])
            return Response({'message': 'User suspended and report resolved'})

        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


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
