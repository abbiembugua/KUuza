import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0002_notification'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='actor',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sent_notifications',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='notification',
            name='transaction',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='notifications',
                to='transactions.transaction',
            ),
        ),
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(
                choices=[
                    ('purchase_created',    'Purchase Created'),
                    ('receipt_ready',       'Receipt Ready'),
                    ('delivery_marked',     'Delivery Marked'),
                    ('receipt_confirmed',   'Receipt Confirmed'),
                    ('delivery_disputed',   'Delivery Disputed'),
                    ('seller_verified',     'Seller Verified'),
                    ('seller_revoked',      'Seller Status Revoked'),
                    ('account_suspended',   'Account Suspended'),
                    ('account_reactivated', 'Account Reactivated'),
                    ('review_received',     'Review Received'),
                    ('report_acted',        'Report Acted On'),
                    ('report_dismissed',    'Report Dismissed'),
                ],
                max_length=32,
            ),
        ),
    ]