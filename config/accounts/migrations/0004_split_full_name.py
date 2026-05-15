from django.db import migrations, models


def split_full_name(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for user in User.objects.all():
        parts = (user.full_name or '').split(' ', 1)
        user.first_name = parts[0].strip()
        user.last_name = parts[1].strip() if len(parts) > 1 else ''
        user.save(update_fields=['first_name', 'last_name'])


def merge_names(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for user in User.objects.all():
        user.full_name = f"{user.first_name} {user.last_name}".strip()
        user.save(update_fields=['full_name'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_mark_existing_users_verified'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='first_name',
            field=models.CharField(default='', max_length=150),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='user',
            name='last_name',
            field=models.CharField(default='', max_length=150),
            preserve_default=False,
        ),
        migrations.RunPython(split_full_name, merge_names),
        migrations.RemoveField(
            model_name='user',
            name='full_name',
        ),
    ]
