import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('listings', '0004_listing_min_discount_percent'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ListingQuestion',
            fields=[
                ('id',          models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('question',    models.TextField()),
                ('answer',      models.TextField(blank=True)),
                ('answered_at', models.DateTimeField(blank=True, null=True)),
                ('created_at',  models.DateTimeField(auto_now_add=True)),
                ('listing', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='questions',
                    to='listings.listing',
                )),
                ('asker', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='questions_asked',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='listingquestion',
            index=models.Index(fields=['listing', 'created_at'], name='questions_l_listing_idx'),
        ),
    ]