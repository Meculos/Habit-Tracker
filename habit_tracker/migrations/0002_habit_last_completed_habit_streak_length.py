# Generated by Django 5.1.4 on 2024-12-11 10:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('habit_tracker', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='habit',
            name='last_completed',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='habit',
            name='streak_length',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
