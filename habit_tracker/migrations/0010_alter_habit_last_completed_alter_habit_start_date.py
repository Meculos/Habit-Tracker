# Generated by Django 5.1.4 on 2025-01-01 07:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('habit_tracker', '0009_alter_habit_last_completed_alter_habit_start_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='habit',
            name='last_completed',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='habit',
            name='start_date',
            field=models.DateField(auto_now_add=True),
        ),
    ]
