from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0009_transaction_dispute_deadline_escalated'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='mpesa_paid',
            field=models.BooleanField(default=False),
        ),
    ]