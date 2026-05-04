from django.core.management.base import BaseCommand
from django.utils import timezone
from transactions.models import Transaction


class Command(BaseCommand):
    help = 'Mark pending transactions as auto_completed when their auto_complete_date has passed.'

    def handle(self, *args, **options):
        today = timezone.now().date()

        qs = Transaction.objects.filter(
            status='pending',
            auto_complete_date__lte=today,
            auto_complete_date__isnull=False,
        )

        count = qs.count()

        if count == 0:
            self.stdout.write('No transactions to auto-complete.')
            return

        # Process one-by-one so each instance's save() signal fires,
        # which handles marking the listing sold and clearing cart items.
        for tx in qs:
            tx.status = 'auto_completed'
            tx.save(update_fields=['status', 'updated_at'])

        self.stdout.write(
            self.style.SUCCESS(f'Auto-completed {count} transaction(s) as of {today}.')
        )
