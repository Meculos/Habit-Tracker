from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse, HttpResponseForbidden
from django.shortcuts import render, get_object_or_404, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.utils import timezone
from random import sample
from django.core.paginator import Paginator
import base64
from django.core.files.base import ContentFile
import json
from .achievement import check_and_award_achievements
from collections import Counter
from django.db.models import Q, Count, Avg
from datetime import date, timedelta, datetime
import logging

from .models import CustomUser, Habit, Relapse, LogEntry, Achievement, UserAchievement, Post, Comment, FriendRequest, ChatMessage, Notification, Challenge,UserChallenge, PointsHistory

logger = logging.getLogger(__name__)

# Create your views here.
def index(request):
    return render(request, "habit_tracker/index.html")

def login_view(request):
    if request.method == "POST":
        username = request.POST.get("loguser")
        password = request.POST.get("logpass")

        if not username:
            return render(request, "habit_tracker/login.html", {
                "message": "Please input username"
            })
        if not password:
            return render(request, "habit_tracker/login.html", {
                "message": "Please input password"
            })

        user = authenticate(request, username=username, password=password)
        if user:
            print(f"Authenticated User: {user.username}")
        else:
            print("Authentication failed")
        if user is not None:
            login(request, user)
            return redirect("dashboard")
        else:
            return render(request, "habit_tracker/login.html", {
                "message": "Incorrect username or password"
            })
    return render(request, "habit_tracker/login.html")

def logout_view(request):
    logout(request)
    return redirect("index")

@login_required
def dashboard(request):
    user_achievements = UserAchievement.objects.filter(user=request.user).select_related('achievement')[:5]
    notification = Notification.objects.filter(user=request.user, is_read=False)
    user = CustomUser.objects.get(username=request.user.username)
    relapse_chart_data = get_all_habit_relapse_chart_data(request.user)
    mood_chart_data = get_combined_mood_chart_data(request.user)
    return render(request, "habit_tracker/dashboard.html", {
        "user_achievements": user_achievements,
        "user": user,
        "notifications": notification,
        "relapse_chart_data": relapse_chart_data,
        "combined_mood_chart_data": mood_chart_data
    })

def register(request):
    if request.method == "POST":
        real_name = request.POST.get("realname")
        username = request.POST.get("new-username")
        email = request.POST.get("email")
        password = request.POST.get("new-password")
        confirmation = request.POST.get("new-confirmation")
        age_group = request.POST.get("age_group")
        gender = request.POST.get("gender")

        if any(not field for field in [real_name, username, email, password, confirmation]):
            return render(request, "habit_tracker/register.html", {
                "message": "Required fields cannot be empty"
            })
        if password != confirmation:
            return render(request, "habit_tracker/register.html", {
                "message": "Passwords do not match"
            })
        if len(password) < 8 or not password.isalnum():
            return render(request, "habit_tracker/register.html", {
                "message": "Password must be at least 8 characters and must be alpha-numerical"
            })
        if CustomUser.objects.filter(username=username).exists():
            return render(request, "habit_tracker/register.html", {
                "message": "Username already taken."
            })
        if CustomUser.objects.filter(email=email).exists():
            return render(request, "habit_tracker/register.html", {
                "message": "Email already registered."
            })
        
        user = CustomUser.objects.create_user(username=username, password=password, email=email)
        user.real_name = real_name
        user.age_group = age_group
        user.gender = gender
        user.save()

        login(request, user)
        return redirect("dashboard")
    return render(request, "habit_tracker/register.html")

def log_page(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            habit_name = data.get("habit_name")
            habit_description = data.get("habit_description")
            habit_frequency = data.get("habit_frequency")
            habit_duration = data.get("habit_duration")

            new_habit = Habit.objects.create(
                user = request.user,
                name = habit_name,
                description = habit_description,
                frequency = habit_frequency,
                duration = habit_duration
            )
            return JsonResponse({"Message": "Habit created successfully", "id": new_habit.id})
        except Exception as e:
            return JsonResponse({"Message": f"Error {str(e)}"}, status=400)
        
def all_habits(request):
    habits = Habit.objects.filter(user=request.user, active=True).order_by("-id")
    user_habits = [habit.serialize() for habit in habits]
    return JsonResponse({"habits": user_habits})

def archived_habits(request):
    habits = Habit.objects.filter(user=request.user, active=False).order_by("-id")
    user_habits = [habit.serialize() for habit in habits]
    return JsonResponse({"habits": user_habits})

def activity_page(request):
    habits = Habit.objects.filter(user=request.user).prefetch_related("logs").order_by('-start_date')
    logs = []

    for habit in habits:
        for log in habit.logs.all():
            logs.append({
                "habit_name": habit.name,
                "note": log.notes,
                "status": log.status,
                "mood": log.get_mood_display(),
                "date": log.date
            })
    
    return JsonResponse({"logs": logs})

def logging_page(request):
    habits = Habit.objects.filter(user=request.user)
    for habit in habits:
        if habit.end_days <= 0 and not habit.notification_sent:
            Notification.objects.create(
                user = request.user,
                message = f"You have completed tracking the habit: {habit.name}",
                link = "/habit_tracker/logging_page/"
            )
            habit.notification_sent = True
            habit.save()
    return render(request, "habit_tracker/log_habit.html")

def log_habit(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            habit_id = data.get("habit_id")
            log_status = data.get("log_status") == "True"
            log_note = data.get("log_note")
            log_mood = data.get("log_mood")

            habit = Habit.objects.get(id=habit_id)
            habit.last_completed = date.today()
            habit.save()
            LogEntry.objects.create(
                habit = habit,
                status = log_status,
                notes = log_note,
                mood = log_mood
            )
            if log_status:
                habit.mark_completed()
            else:
                Relapse.objects.create(habit=habit)  # No need to manually pass the date
                habit.total_relapses += 1
                habit.save()

            habit.save()

            check_and_award_achievements(request.user)

            return JsonResponse({"message": "Habit logged successfully"})
        except Exception as e:
            logger.error(f"Error logging habit: {e}")
            return JsonResponse({"Message": f"Error {str(e)}"}, status=400)
        
def inactive_habit(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            habit_id = data.get("habit_id")

            habit = Habit.objects.get(id=habit_id)
            habit.active = False
            habit.save()

            return JsonResponse({"message": "Habit is now inactive"})
        except Exception as e:
            return JsonResponse({"error": f"Error {str(e)}"}, status=400)
        
def active_habit(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            habit_id = data.get("habit_id")

            habit = Habit.objects.get(id=habit_id)
            habit.active = True
            habit.save()

            return JsonResponse({"message": "Habit is now active"})
        except Exception as e:
            return JsonResponse({"error": f"Error {str(e)}"}, status=400)
        
def profile(request, user_id):
    user = CustomUser.objects.get(id=user_id)
    frequest = FriendRequest.objects.filter(from_user=request.user, to_user=user).first()
    are_friends = user in request.user.friends.all()
    return render(request, "habit_tracker/profile.html", {
        "user": user,
        "main": request.user,
        "request": frequest,
        "are_friends": are_friends,
    })

def edit_picture(request):
    return render(request, "habit_tracker/edit_picture.html", {
        "user": request.user
    })

def edit_profile(request):
    if request.method == "POST":
        realname = request.POST.get("editrealname")
        username = request.POST.get("editusername")
        email = request.POST.get("editemail")
        age_group = request.POST.get("edit_age_group")
        gender = request.POST.get("editgender")
        userbio = request.POST.get("editbio")
        
        messages = []

        # Validation checks
        if any(not field for field in [realname, username, email]):
            messages.append("Required fields cannot be empty.")
        if CustomUser.objects.filter(username=username).exclude(id=request.user.id).exists():
            messages.append("Username already taken.")
        if CustomUser.objects.filter(email=email).exclude(id=request.user.id).exists():
            messages.append("Email already registered.")
        
        if messages:
            return render(request, "habit_tracker/edit_profile.html", {
                "messages": messages,
            }, status=400)
        
        # Save the updated profile
        try:
            user = CustomUser.objects.get(id=request.user.id)
            user.real_name = realname
            user.username = username
            user.email = email
            user.age_group = age_group
            user.gender = gender
            user.user_bio = userbio
            user.save()
        except CustomUser.DoesNotExist:
            return render(request, "habit_tracker/edit_profile.html", {
                "messages": ["User not found."],
            }, status=404)

        return render(request, "habit_tracker/profile.html", {
            "user": user,
        })

    # Render edit profile form with current data
    try:
        profile = CustomUser.objects.get(id=request.user.id)
    except CustomUser.DoesNotExist:
        return render(request, "habit_tracker/edit_profile.html", {
            "messages": ["User not found."],
        }, status=404)
    
    return render(request, "habit_tracker/edit_profile.html", {
        "profile": profile,
    })

def community(request):
    posts = Post.objects.select_related("user").all().order_by("-posted_on")
    return render(request, "habit_tracker/community.html", {
        "user": request.user,
        "posts": posts,
    })

def create_post(request):
    if request.method == "POST":
        post = request.POST.get("createPost")
        if len(post.strip()) > 3000:
            return render(request, "habit_tracker/create_post.html", {
                "message": "Post is greater than 3000 words"
            })
        if not post:
            return render(request, "habit_tracker/create_post.html", {
                "message": "Post cannot be empty"
            })
        
        Post.objects.create(
            user = request.user,
            post = post
        )
        return redirect("community")
    return render(request, "habit_tracker/create_post.html")

def post_details(request, postId):
    post = get_object_or_404(Post, id=postId)
    return render(request, "habit_tracker/post_details.html", {
        "post": post
    })

def submit_comment(request):
    if request.method == "POST":
        try:
            # Parse request body
            data = json.loads(request.body)
            comment_text = data.get("comment")
            post_id = data.get("post_id")

            # Validate inputs
            if not comment_text or not post_id:
                return JsonResponse({"message": "Invalid data provided"}, status=400)

            # Retrieve the post object
            post = get_object_or_404(Post, id=post_id)

            # Create a new comment
            Comment.objects.create(
                user=request.user,
                post=post,
                comment=comment_text
            )

            # Return a success response
            return JsonResponse({"message": "Comment created successfully"})
        
        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON data"}, status=400)
        except Exception as e:
            return JsonResponse({"message": f"Error: {str(e)}"}, status=400)
    
    elif request.method == "GET":
        # Retrieve comments for the post
        post_id = request.GET.get("post_id")
        if not post_id:
            return JsonResponse({"message": "Post ID not provided"}, status=400)

        post = get_object_or_404(Post, id=post_id)
        comments = Comment.objects.filter(post=post).select_related("user").order_by('-created_at')

        # Prepare the response
        comms = [
            {
                "picture": comment.user.profile_picture.url if comment.user.profile_picture else None,
                "username": comment.user.username,
                "date": comment.created_at,
                "comment": comment.comment,
                "id": comment.user.id,
            }
            for comment in comments
        ]

        return JsonResponse({"comments": comms})
    
    return JsonResponse({"message": "Invalid request method"}, status=405)

def update_profile_pic(request):
    if request.method == "POST":
        data = json.loads(request.body)
        image_data = data.get("image")
        if not image_data:
            return JsonResponse({"success": False, "error": "No image provided"}, status=400)

        # Decode the Base64 image
        format, imgstr = image_data.split(";base64,")
        ext = format.split("/")[-1]  # Get file extension
        image_data = ContentFile(base64.b64decode(imgstr), name=f"profile_pic.{ext}")

        # Save the image to the user's profile
        user = request.user
        user.profile_picture.save(image_data.name, image_data)
        user.save()

        return JsonResponse({"success": True, "redirect_url": f"/habit_tracker/profile/{request.user.id}"})
    return JsonResponse({"success": False}, status=400)

def send_friend_request(request):
    if request.method == "POST":
        data = json.loads(request.body)
        receiver_id = data.get("receiver_id")

        receiver = get_object_or_404(CustomUser, id=receiver_id)
        sender = request.user
        
        # Check if a friend request already exists
        if FriendRequest.objects.filter(from_user=sender, to_user=receiver, status="pending").exists():
            return JsonResponse({"success": False, "message": "Friend request already sent."}, status=400)
        
        # Check if they are already friends
        if receiver in sender.friends.all():
            return JsonResponse({"success": False, "message": "You're already friends."}, status=400)

        # Create the friend request
        friend_request = FriendRequest(from_user=sender, to_user=receiver, status="pending")
        friend_request.save()
        Notification.objects.create(
            user = receiver,
            message = f"{request.user.username} sent you a friend request!",
            link = f"/profile/{request.user.id}/",
            friend_request = friend_request
        )

        return JsonResponse({"success": True, "message": "Friend request sent!"})

    return JsonResponse({"success": False, "message": "Invalid request method."}, status=400)

def accept_friend_request(request):
    if request.method == "POST":
        data = json.loads(request.body)
        request_id = data.get("request_id")

        friend_request = get_object_or_404(FriendRequest, id=request_id)

        if friend_request.to_user != request.user:
            return JsonResponse({"success": False, "message": "Permission denied."}, status=403)

        friend_request.status = "accepted"
        friend_request.save()
        # Add users as friends
        friend_request.from_user.friends.add(friend_request.to_user)
        friend_request.to_user.friends.add(friend_request.from_user)

        notification = Notification.objects.filter(friend_request=friend_request).first()
        if notification:
            notification.is_read = True
            notification.save()

        return JsonResponse({"success": True, "message": "Friend request accepted."})

    return JsonResponse({"success": False, "message": "Invalid request method."}, status=400)

def deny_friend_request(request):
    if request.method == "POST":
        data = json.loads(request.body)
        request_id = data.get("request_id")

        friend_request = get_object_or_404(FriendRequest, id=request_id)

        if friend_request.to_user != request.user:
            return JsonResponse({"success": False, "message": "Permission denied."}, status=403)

        friend_request.status = "rejected"
        friend_request.save()

        notification = Notification.objects.filter(friend_request=friend_request).first()
        if notification:
            notification.is_read = True
            notification.save()

        return JsonResponse({"success": True, "message": "Friend request denied."})

    return JsonResponse({"success": False, "message": "Invalid request method."}, status=400)

def friends_corner(request):
    if not request.user.is_authenticated:
        return redirect('login')

    chats = ChatMessage.objects.filter(
        Q(sender=request.user) | Q(receiver=request.user)
    ).order_by('-timestamp')

    # Keep only unique sender-receiver pairs
    unique_chats = {}
    for chat in chats:
        pair = tuple(sorted([chat.sender.id, chat.receiver.id]))  # Ensure consistent ordering
        if pair not in unique_chats:
            unique_chats[pair] = chat

    return render(request, "habit_tracker/friends_corner.html", {
        "chats": unique_chats.values()  # Pass the values of the dictionary (unique chats)
    })

def friends_list(request):
    user = CustomUser.objects.get(id=request.user.id)
    friends = user.friends.all()
    return render(request, "habit_tracker/friends_list.html", {
        "friends": friends
    })

def chat_page(request, friend_id):
    friend = get_object_or_404(CustomUser, id=friend_id)
    messages = ChatMessage.objects.filter(
        sender__in=[request.user, friend],
        receiver__in=[request.user, friend]
    ).order_by('timestamp')

    for msg in messages:
        msg.message_class = 'outgoing' if msg.sender == request.user else 'incoming'
        
    return render(request, "habit_tracker/chat_page.html", {
        "friend": friend,
        "messages": messages,
        "user": request.user
    })

def send_message(request):
    if request.method == "POST":
        data = json.loads(request.body)
        sender = request.user
        receiver_id = data.get("receiver_id")
        message_content = data.get("message")

        receiver = get_object_or_404(CustomUser, id=receiver_id)
        message = ChatMessage.objects.create(
            sender=sender, receiver=receiver, content=message_content
        )
        Notification.objects.create(
            user = receiver,
            message = f"You received a message from {sender.username}",
            link = f"/habit_tracker/chat/{sender.id}/"
        )
        return JsonResponse({
            "success": True,
            "message": "Message sent successfully.",
            "timestamp": message.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        })

    return JsonResponse({"success": False, "message": "Invalid request method."}, status=400)

def load_messages(request, friend_id):
    friend = get_object_or_404(CustomUser, id=friend_id)
    messages = ChatMessage.objects.filter(
        sender__in=[request.user, friend],
        receiver__in=[request.user, friend]
    ).order_by('-timestamp')[:50]  # Limit to the latest 50 messages
    return JsonResponse({
    "messages": [
        {
            "user": request.user.username,
            "sender": msg.sender.username,
            "message": msg.content,
            "timestamp": msg.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            "sender_profile_picture_url": msg.sender.profile_picture.url if msg.sender.profile_picture else "/static/default-profile.png"
        }
        for msg in messages
    ]
})

def friends_post(request):
    user = get_object_or_404(CustomUser, id=request.user.id)
    friends = user.friends.all()
    
    posts = Post.objects.filter(user__in=friends).order_by("-posted_on")
    
    return render(request, "habit_tracker/friends_posts.html", {
        "posts": posts
    })

def mark_as_read(request, noti_id):
    notification = get_object_or_404(Notification, id=noti_id)
    notification.is_read = True
    notification.save()

    return redirect("dashboard")

def challenge(request):
    challenges = Challenge.objects.all()
    return render(request, "habit_tracker/challenges.html", {
        "challenges": challenges
    })

def take_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    return render(request, "habit_tracker/challenge_page.html", {
        "challenge": challenge
    })

def check_challenge(request, challenge_id):
    try:
        user = request.user
        challenge = Challenge.objects.get(id=challenge_id)
        if challenge:
            print("challenge found")

        # Check or create UserChallenge entry for this user and challenge
        user_challenge, created = UserChallenge.objects.get_or_create(
            user=user,
            challenge=challenge,
            defaults={"attempts_left": 3}
        )

        # Handle GET request (challenge status)
        if request.method == "GET":
            return JsonResponse({
                "attempts_left": user_challenge.attempts_left,
                "completed": user_challenge.completed,
                "time_remaining": 60  # Adjust if needed for persistent timers
            })

        # Handle POST request (answer submission)
        if request.method == "POST":
            if user_challenge.completed:
                return JsonResponse({
                    "correct": False,
                    "attempts_left": 0,
                    "message": "You've already completed this challenge."
                }, status=200)
            
            if user_challenge.attempts_left <= 0:
                # Mark challenge as completed due to no attempts left
                user_challenge.completed = True
                user_challenge.save()
                return JsonResponse({
                    "message": "No attempts left. Challenge locked.",
                    "attempts_left": 0
                }, status=200)

            data = json.loads(request.body)
            answer = data.get("answer", "").lower().strip()

            if answer in [ans.lower() for ans in challenge.answers]:
                user.points += challenge.point  # Add points
                user.save()
                PointsHistory.objects.create(user=user, points=user.points)
                
                user_challenge.completed = True  # Mark as completed
                user_challenge.save()

                return JsonResponse({
                    "correct": True,
                    "points_awarded": challenge.point,
                    "message": f"You've earned {challenge.point} points!"
                })

            # Deduct an attempt for an incorrect answer
            user_challenge.attempts_left -= 1
            user_challenge.save()

            if user_challenge.attempts_left > 0:
                return JsonResponse({
                    "correct": False,
                    "attempts_left": user_challenge.attempts_left,
                    "message": "Incorrect answer. Try again."
                })
            else:
                user_challenge.completed = True
                user_challenge.save()
                return JsonResponse({
                    "correct": False,
                    "attempts_left": 0,
                    "message": "No attempts left. Challenge locked."
                })

    except Challenge.DoesNotExist:
        return JsonResponse({"error": "Challenge not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method."}, status=400)

def leaderboard(request):
    users = CustomUser.objects.all().order_by("-points")
    paginator = Paginator(users, 10)  # Show 10 users per page
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)
    return render(request, "habit_tracker/leaderboard.html", {
        "users": users,
        "page_obj": page_obj
    })

def delete_habit(request):
    if request.method == "POST":
        data = json.loads(request.body)
        habit_id = data.get("habit_id")
        try:
            habit = Habit.objects.get(id=habit_id)
            habit.delete()  # Call delete on the retrieved habit instance
            return JsonResponse({"message": "Habit deleted successfully"})
        except Habit.DoesNotExist:
            return JsonResponse({"error": "Habit not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=405)
    
def renew_habit(request):
    if request.method == "POST":
        data = json.loads(request.body)
        habit_id = data.get("habit_id")

        try:
            habit = Habit.objects.get(id=habit_id)
            habit.start_date = datetime.now().date()
            habit.notification_sent = False  # Reset notification sent flag
            habit.save()

            return JsonResponse({
                    "success": True,
                    "message": f"The habit '{habit.name}' has been renewed!",
                    "new_end_days": habit.end_days,
                })
        except Habit.DoesNotExist:
            return JsonResponse({
                    "success": False,
                    "error": "Habit not found."
                }, status=404)
    return JsonResponse({"success": False, "error": "Invalid request method."}, status=405)

def points_history(request):
    user = request.user  # Assume the user is logged in
    points_data = PointsHistory.objects.filter(user=user).order_by("timestamp")

    data = {
        "points": [
            {"date": point.timestamp.strftime("%Y-%m-%d"), "points": point.points}
            for point in points_data
        ]
    }
    return JsonResponse(data)

def habit_completion_rate(request):
    habits = Habit.objects.filter(user=request.user)
    
    # Aggregate logs across all habits
    all_logs = LogEntry.objects.filter(habit__in=habits)
    
    total_logs = all_logs.count()
    completed_logs = all_logs.filter(status=True).count()
    missed_logs = total_logs - completed_logs

    return JsonResponse({
        "completed": completed_logs,
        "missed": missed_logs
    })


def details_page(request, habit_id):
    # Retrieve the habit or show 404 if it doesn't exist
    habit = get_object_or_404(Habit, id=habit_id)

    # Ensure that the logged-in user owns the habit (if this is a multi-user app)
    if habit.user != request.user:
        return HttpResponseForbidden("You do not have access to this habit.")

    # Fetch all log entries associated with the habit, ordered by timestamp (most recent first)
    logs = LogEntry.objects.filter(habit=habit).order_by('-date')

    days_elapsed = (date.today() - habit.start_date).days  # Days elapsed since start
    total_duration = habit.duration  # Total duration of the habit in days

    # Ensure days_elapsed doesn't exceed total_duration
    days_elapsed = min(days_elapsed, total_duration)

    # Calculate progress as a percentage
    progress = (days_elapsed / total_duration) * 100 if total_duration > 0 else 0
    progress = round(progress, 2)

    relapse_chart_data = get_relapse_chart_data(habit)

    # Streak length data over time
    streak_data = list(
        habit.logs.order_by('date').values('date', 'habit__streak_length')
    )

    # Serialize the data into JSON for the chart
    streak_chart_data = json.dumps(
        [
            {
                "date": entry["date"].isoformat() if entry["date"] else None,
                "streak_length": entry["habit__streak_length"] if entry["habit__streak_length"] is not None else 0,
            }
            for entry in streak_data
        ]
    )

    # Mood tracking data: Extract moods with corresponding dates
    mood_data = [
        {
            'date': log.date.isoformat(),  # Convert date to string format (YYYY-MM-DD)
            'mood': log.mood
        }
        for log in logs
    ]

    # Paginate logs: Show 10 logs per page
    paginator = Paginator(logs, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # Render the template with paginated logs
    return render(request, "habit_tracker/habit_details.html", {
        "habit": habit,
        "logs": page_obj,  # Pass the paginated logs object to the template
        "success_count": logs.filter(status=True).count(),
        "setback_count": logs.filter(status=False).count(),
        "mood_chart_data": json.dumps(mood_data),
        "progress": progress,
        "streak_chart_data": streak_chart_data,
        "relapse_chart_data": relapse_chart_data,
    })

def search(request):
    query = request.GET.get("search")
    users = CustomUser.objects.filter(username__icontains=query).exclude(id=request.user.id)
    main_user = get_object_or_404(CustomUser, id=request.user.id)
    friends = main_user.friends.all()
    for user in users:
        if user in friends:
            user.already_friends = True

    return render(request, "habit_tracker/search.html", {
        "users": users
    })

def get_relapse_chart_data(habit):
    # Query relapses related to the habit and group by date
    relapses_by_date = (
        habit.relapses.values("date")  # Get only the 'date' field from related Relapse objects
        .annotate(relapse_count=Count("id"))  # Count relapses on each date
        .order_by("date")  # Order by date for chronological data
    )

    # Prepare data in the format needed for the chart
    relapse_chart_data = json.dumps(
        [
            {"date": str(entry["date"]), "relapse_count": entry["relapse_count"]}
            for entry in relapses_by_date
        ]
    )
    return relapse_chart_data

def get_all_habit_relapse_chart_data(user):
    # Query all habits for the user
    habits = Habit.objects.filter(user=user)
    
    # Create a dictionary to store relapses for each habit
    all_habit_data = {}
    
    for habit in habits:
        # Query relapses related to the habit and group by date
        relapses_by_date = (
            habit.relapses.values("date")  # Get only the 'date' field from related Relapse objects
            .annotate(relapse_count=Count("id"))  # Count relapses on each date
            .order_by("date")  # Order by date for chronological data
        )

        # Store the chart data for the habit
        all_habit_data[habit.name] = [
            {"date": str(entry["date"]), "relapse_count": entry["relapse_count"]}
            for entry in relapses_by_date
        ]
    
    # Convert the data dictionary to JSON for use in the front-end
    return json.dumps(all_habit_data)

def get_combined_mood_chart_data(user):
    """
    Returns combined mood data for all habits of the given user, suitable for a single chart.
    """
    habits = Habit.objects.filter(user=user)
    combined_mood_data = []

    for habit in habits:
        mood_data = (
            habit.logs.values("date")
            .annotate(average_mood=Avg("mood"))  # Average mood per day
            .filter(average_mood__isnull=False)  # Exclude entries with null mood
            .order_by("date")
        )

        combined_mood_data.append({
            "habit": habit.name,
            "mood_data": [
                {"date": str(entry["date"]), "average_mood": round(entry["average_mood"], 1)}
                for entry in mood_data
            ],
        })

    return json.dumps(combined_mood_data)

