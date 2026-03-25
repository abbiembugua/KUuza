import uuid
from django.db import models
from django.conf import settings
from listings.models import Listing


class Cart(models.Model):
    """One cart per user. Only goods can be added — services go to checkout directly."""

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart — {self.user.email}"


class CartItem(models.Model):
    """
    An individual listing in a user's cart.
    First to checkout wins — no reservation held.
    If a listing sells before the buyer checks out,
    the item is flagged as unavailable.
    """

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart       = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    listing    = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='cart_items')
    quantity   = models.PositiveIntegerField(default=1)
    added_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('cart', 'listing')]
        ordering        = ['-added_at']

    def __str__(self):
        return f"{self.listing.title} × {self.quantity}"

    @property
    def is_available(self):
        return self.listing.status == 'active' and not self.listing.is_draft

    @property
    def subtotal(self):
        if self.listing.price:
            return self.listing.price * self.quantity
        return None