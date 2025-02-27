from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", views.index, name='index'),
    path("register/", views.register, name="register"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("api/habit_tracker/logging_page/", views.log_page, name="logging_page"),
    path("api/habit_tracker/all_habits/", views.all_habits, name="all_habits"),
    path("api/habit_tracker/activity_logs/", views.activity_page, name="activity_page"),
    path("api/habit_tracker/log_habit/", views.log_habit, name="log_habit"),
    path("api/habit_tracker/inactive/", views.inactive_habit, name="inactive_habit"),
    path("api/habit_tracker/archived_habits/", views.archived_habits, name="archived_habits"),
    path("api/habit_tracker/active/", views.active_habit, name="active_habit"),
    path("api/update_profile_pic/", views.update_profile_pic, name="update_profile_pic"),
    path("api/habit_tracker/send_friend_request/", views.send_friend_request, name="send_friend_request"),
    path("api/habit_tracker/send_message/", views.send_message, name="send_message"),
    path("api/habit_tracker/friend_request/accept/", views.accept_friend_request, name="accept_friend_request"),
    path("api/habit_tracker/friend_request/deny/", views.deny_friend_request, name="deny_friend_request"),
    path("api/habit_tracker/comment/", views.submit_comment, name="submitComment"),
    path("api/habit_tracker/load_messages/<int:friend_id>/", views.load_messages, name="load_messages"),
    path("api/habit_tracker/check_answer/<int:challenge_id>/", views.check_challenge, name="check_challenge"),
    path("api/habit_tracker/renew_habit/", views.renew_habit, name="renew_habit"),
    path("api/habit_tracker/delete_habit/", views.delete_habit, name="delete_habit"),
    path("api/habit_tracker/points_history/", views.points_history, name="points_history"),
    path("api/habit_tracker/habit_completion_rate/", views.habit_completion_rate, name="habit_completion_rate"),
    path("logging_page/", views.logging_page, name="log_page"),
    path("profile/<int:user_id>/", views.profile, name="profile"),
    path("edit_profile/", views.edit_profile, name="edit_profile"),
    path("community/", views.community, name="community"),
    path("create_post/", views.create_post, name="make_post"),
    path("post_details/<int:postId>/", views.post_details, name="post_details"),
    path("edit_profile_picture/", views.edit_picture, name="edit_profile_picture"),
    path("friends_corner/", views.friends_corner, name="friends_corner"),
    path("friends_list", views.friends_list, name="friends_list"),
    path("chat/<int:friend_id>/", views.chat_page, name="chat"),
    path("friends_posts/", views.friends_post, name="friends_posts"),
    path("read/<int:noti_id>/", views.mark_as_read, name="read"),
    path("challenges/", views.challenge, name="challenge"),
    path("take_challenge/<int:challenge_id>/", views.take_challenge, name="challenge_page"),
    path("leaderboard/", views.leaderboard, name="leaderboard"),
    path("habit_details/<int:habit_id>/", views.details_page, name="details_page"),
    path("search/", views.search, name="search"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)