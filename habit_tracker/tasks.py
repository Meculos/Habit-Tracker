from datetime import date, timedelta
from celery import shared_task
from .models import Habit, Notification

@shared_task
def create_habit_notifications():
    today = date.today()

    habits = Habit.objects.all()
    for habit in habits:
        if habit.frequency == "daily" and habit.last_completed != today:
            due_date = habit.last_completed + timedelta(days=1) if habit.last_completed else today
        elif habit.frequency == "weekly" and (habit.last_completed is None or today >= habit.last_completed + timedelta(days=7)):
            due_date = habit.last_completed + timedelta(weeks=1) if habit.last_completed else today
        elif habit.frequency == "monthly" and (habit.last_completed is None or today.month != habit.last_completed.month):
            due_date = (habit.last_completed + timedelta(days=30)) if habit.last_completed else today
        else:
            continue  # Habit not due for a log

        if due_date == today:
            Notification.objects.create(
                user=habit.user,
                message=f"Don't forget to log your habit: {habit.name}!",
                link=f"/habit_tracker/habits/{habit.id}/log/"
            )
