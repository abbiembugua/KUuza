from django.db import migrations

def mark_existing_verified(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(is_email_verified=False).update(is_email_verified=True)

def reverse_func(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_add_email_verification_fields'),  # ← points to 0002
    ]

    operations = [
        migrations.RunPython(mark_existing_verified, reverse_func),
    ]