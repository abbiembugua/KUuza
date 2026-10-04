from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0012_notification_listing_field'),
    ]

    operations = [
        migrations.DeleteModel(name='Notification'),
    ]
