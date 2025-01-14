from django.contrib import admin
from .models import Habit, CustomUser, LogEntry, Achievement, UserAchievement, Post, Comment, FriendRequest, ChatMessage, Notification, Challenge

# Register your models here.

class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'frequency', 'start_date', 'active')  # Fields to show in admin list view
    list_filter = ('frequency', 'active')  # Filters for narrowing results
    search_fields = ('name', 'user__username')  # Search bar to find habits by name or user's username

admin.site.register(Habit, HabitAdmin)
admin.site.register(CustomUser)
admin.site.register(LogEntry)
admin.site.register(Achievement)
admin.site.register(UserAchievement)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(FriendRequest)
admin.site.register(ChatMessage)
admin.site.register(Notification)
admin.site.register(Challenge)
