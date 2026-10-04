import uuid
from django.db import models
from django.conf import settings


class ListingQuestion(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing     = models.ForeignKey(
        'listings.Listing',
        on_delete=models.CASCADE,
        related_name='questions',
    )
    asker       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='questions_asked',
    )
    question    = models.TextField()
    answer      = models.TextField(blank=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [models.Index(fields=['listing', 'created_at'])]

    def __str__(self):
        return f'Q on "{self.listing}" by {self.asker}'