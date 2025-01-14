from .models import Achievement, UserAchievement, LogEntry, Habit

ACHIEVEMENT_CONDITIONS = {
    'log_10_times': lambda user: LogEntry.objects.filter(habit__user=user).count() >= 10,
    '30_days_no_relapse': lambda user: Habit.objects.filter(user=user, streak_length__gte=30).exists(),
}

def check_and_award_achievements(user):
    for condition, check_function in ACHIEVEMENT_CONDITIONS.items():
        if check_function(user):  # Check if user meets the condition
            try:
                achievement = Achievement.objects.get(condition=condition)
                if not UserAchievement.objects.filter(user=user, achievement=achievement).exists():
                    UserAchievement.objects.create(user=user, achievement=achievement)
                    print(f"{user.username} earned the achievement: {achievement.name}")
            except Achievement.DoesNotExist:
                print(f"Achievement with condition '{condition}' does not exist.")