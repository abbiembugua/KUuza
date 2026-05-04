from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_add_academic_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='email_verification_otp',
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='email_verification_expiry',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
