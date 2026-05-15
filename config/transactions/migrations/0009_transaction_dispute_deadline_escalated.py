from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0008_merge_20260512_1843'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='dispute_deadline',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='transaction',
            name='dispute_escalated',
            field=models.BooleanField(default=False),
        ),
    ]