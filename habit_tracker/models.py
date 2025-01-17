from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxLengthValidator
from datetime import timedelta, datetime
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

# Create your models here.
class CustomUser(AbstractUser):
    AGE_GROUP_CHOICES = [
        ("13-17", "13-17 years"),
        ("18-24", "18-24 years"),
        ("25-34", "25-34 years"),
        ("35-44", "35-44 years"),
        ("45-54", "45-54 years"),
        ("55+", "55+ years"),
    ]
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("no gender", "Prefer not to say")
    ]
    age_group = models.CharField(max_length=10, choices=AGE_GROUP_CHOICES, null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True, null=True)
    real_name = models.CharField(max_length=150)
    user_bio = models.TextField(max_length=200, null=True, blank=True, default="No bio yet")
    points = models.IntegerField(default=0)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        default='profile_pictures/default.jpeg'
    )
    friends = models.ManyToManyField('self', blank=True, symmetrical=True)

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_groups",
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_permissions",
        blank=True,
    )

    def get_posts(self):
        return self.user_posts.all().order_by('-posted_on')

    def __str__(self):
        return f"{self.username} has been validated"
    
class Habit(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="habits") # link to User model
    name = models.CharField(max_length=100) # name of habit to keep track of eg no smoking
    description = models.TextField(blank=True, null=True) # description of the model
    notification_sent = models.BooleanField(default=False)
    frequency = models.CharField(
        max_length=20,
        choices=[("daily", "Daily"), ("weekly", "Weekly"), ("monthly", "Monthly")],
        default="daily"
    ) # how often to track the habit
    start_date = models.DateField(auto_now_add=True) # date habit started being tracked
    active = models.BooleanField(default=True) # if the habit is active or not
    total_relapses = models.IntegerField(default=0)  # Count of total relapses
    relapse_dates = models.JSONField(default=list, blank=True)  # List of dates of relapses
    streak_length = models.PositiveIntegerField(default=0)  # Field to track streak length
    last_completed = models.DateField(null=True, blank=True)  # Field to track last completed date
    
    class Duration(models.IntegerChoices):
        ONE_WEEK = 7, "One week"
        TWO_WEEKS = 14, "Two weeks"
        ONE_MONTH = 30, "A month"
        THREE_MONTHS = 90, "Three months"
        SIX_MONTHS = 180, "Six months"
    
    duration = models.IntegerField(choices=Duration.choices, default=Duration.ONE_WEEK)

    @property
    def end_date(self):
        if self.duration:
            return self.start_date + timedelta(days=self.duration)
        return None
    
    @property
    def end_days(self):
        if self.duration and self.start_date:
            # Get the end date as the start date plus the duration
            end_date = self.start_date + timedelta(days=self.duration)
            # Convert datetime.now() to date and calculate the difference
            days_left = (end_date - datetime.now().date()).days
            return days_left
        return None

    def add_relapse(self, date):
        """Increment relapse count and add the date of relapse."""
        self.total_relapses += 1
        self.relapse_dates.append(str(date))
        self.save()

    def mark_completed(self):
        today = timezone.now().date()
        if self.last_completed:
            # Check if the completion is consecutive (no break in the streak)
            if self.last_completed == today - timedelta(days=1):
                self.streak_length += 1  # Increment streak if completed the previous day
            else:
                self.streak_length = 1  # Reset streak if there was a break
        else:
            self.streak_length = 1  # Start a new streak if this is the first time
        self.last_completed = today  # Update the completion date
        self.save()

    class Meta:
        unique_together = ('user', 'name')

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "habit_name": self.name,
            "description": self.description,
            "frequency": self.frequency,
            "start_date": self.start_date.isoformat(),
            "active": self.active,
            "streak_length": self.streak_length,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "days_left": self.end_days
        }

    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
class LogEntry(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="logs")
    date = models.DateField(auto_now_add=True) # date the user made the log
    status = models.BooleanField()  # True for success, False for relapse
    notes = models.TextField(blank=True, null=True) # user reflection for the day
    mood = models.IntegerField(
        choices=[(1, "Very Low"), (2, "Low"), (3, "Neutral"), (4, "Good"), (5, "Very Good")],
        null=True, blank=True, default=None
    )

    def save(self, *args, **kwargs):
        # Check if this is a new entry marking a relapse
        if not self.pk and not self.status:  # New record and a relapse
            self.habit.add_relapse(self.date)
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('habit', 'date')

    def __str__(self):
        return f"{self.habit.name} - {self.date} - {'Success' if self.status else 'Relapse'}"

class Achievement(models.Model):
    name = models.CharField(max_length=255)  # The name of the achievement
    description = models.TextField()  # Description of the achievement
    condition = models.CharField(max_length=50, unique=True)  # A unique key for achievement logic
    icon = models.CharField(max_length=255, blank=True, null=True)  # Optional icon for badges
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class UserAchievement(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="achievements")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="users")
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')  # Prevent duplicate achievements

    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"

class Post(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="user_posts")
    post = models.TextField(validators=[MaxLengthValidator(3000)])
    posted_on = models.DateTimeField(auto_now_add=True)

    def get_comments(self):
        return self.post_comments.all().order_by('-created_at')

    def __str__(self):
        return f"{self.user.username} posted {self.post[:30]}"
    
class Comment(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="user_comments")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="post_comment")
    comment = models.TextField(validators=[MaxLengthValidator(3000)])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} commented {self.comment[:30]} on {self.post.post[:30]}"

class FriendRequest(models.Model):
    from_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_friend_requests')
    to_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_friend_requests')
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user} to {self.to_user} ({self.status})"

class ChatMessage(models.Model):
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender} to {self.receiver} at {self.timestamp}"

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    link = models.URLField(null=True, blank=True)  # Optional link to view more details
    friend_request = models.ForeignKey(FriendRequest, null=True, blank=True, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user.username} received a message: {self.message}"

class Challenge(models.Model):
    name = models.CharField(max_length=255)
    question = models.TextField()
    point = models.IntegerField()
    ended = models.BooleanField(default=False)
    answers = models.JSONField()  # Supports both single and multiple answers

    def __str__(self):
        return f"{self.name} is worth {self.point} points"

    def is_correct(self, provided_answer):
        """
        Check if the provided answer matches one of the valid answers.
        """
        if isinstance(self.answers, list):
            return provided_answer.strip().lower() in [ans.strip().lower() for ans in self.answers]
        return False
    
class UserChallenge(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)  # True if user completes it
    attempts_left = models.IntegerField(default=3)  # Initial attempts

    def __str__(self):
        return f"{self.user.username} has completed the challenge: {self.challenge.name}"

@receiver(post_save, sender=Challenge)
def notify_users_of_new_challenge(sender, instance, created, **kwargs):
    if created:  # Only trigger when a new challenge is created
        users = CustomUser.objects.all()  # Get all users
        for user in users:
            Notification.objects.create(
                user=user,
                message=f"New challenge '{instance.name}' is now available! Earn {instance.point} points by completing it.",
                link=f"/habit_tracker/challenges/"  # Link to the challenge detail page
            )

class PointsHistory(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="points_history")
    points = models.IntegerField()  # Points at a given time
    timestamp = models.DateTimeField(auto_now_add=True)  # When the points were recorded

    def __str__(self):
        return f"{self.user.username} - {self.points} points on {self.timestamp}"
