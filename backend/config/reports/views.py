from rest_framework import generics, permissions
from .models import Report
from .serializers import ReportCreateSerializer


class CreateReportView(generics.CreateAPIView):
    serializer_class = ReportCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
