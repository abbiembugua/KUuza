import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    """
    A review submitted by one user (reviewer) about another user (reviewee)
    after a transaction is completed.

    Both the buyer and seller can review each other once per transaction.
    The unique_together constraint prevents duplicate reviews.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # The completed transaction this review is tied to
    transaction_id = models.UUIDField(
        null=True, blank=True,
        help_text='ID of the transaction that generated this review.'
    )

    # Who wrote the review
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given',
    )

    # Who is being reviewed
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_received',
    )

    # The listing the transaction was about (for display context)
    listing_title = models.CharField(
        max_length=255, blank=True,
        help_text='Snapshot of the listing title at time of review.'
    )

    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Rating from 1 to 5 stars.'
    )

    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        # One review per reviewer per transaction
        unique_together = [('reviewer', 'transaction_id')]
        indexes = [
            models.Index(fields=['reviewee']),
            models.Index(fields=['reviewer']),
            models.Index(fields=['transaction_id']),
        ]

    def __str__(self):
        return f"{self.reviewer} → {self.reviewee} ({self.score}★)"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the reviewee's average rating on their profile
        self._update_reviewee_stats()

    def _update_reviewee_stats(self):
        """Recalculate average_rating and total_reviews on UserProfile."""
        try:
            from accounts.models import UserProfile  # adjust import path if needed
            profile = UserProfile.objects.filter(user=self.reviewee).first()
            if profile:
                reviews = Review.objects.filter(reviewee=self.reviewee)
                count = reviews.count()
                avg   = reviews.aggregate(
                    avg=models.Avg('score')
                )['avg'] or 0
                profile.average_rating = round(avg, 2)
                profile.total_reviews  = count
                profile.save(update_fields=['average_rating', 'total_reviews'])
        except Exception:
            pass  # Never let a stats failure block a review save