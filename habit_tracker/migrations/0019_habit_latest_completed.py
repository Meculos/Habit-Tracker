# Generated by Django 5.1.4 on 2025-01-26 10:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('habit_tracker', '0018_pointshistory'),
    ]

    operations = [
        migrations.AddField(
            model_name='habit',
            name='latest_completed',
            field=models.DateField(blank=True, null=True),
        ),
    ]
