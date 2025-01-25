# Habit Tracker Platform

Welcome to the Habit Tracker Platform! This application is designed to help users create, track, and maintain habits, foster a supportive community, and encourage personal growth.

---

## Features

### Core Functionalities
1. **Create and Track Habits**:
   - Add new habits to your dashboard.
   - Log habits daily to maintain consistency.
   - Track streaks, relapses, and progress over time.

2. **Interactive Community**:
   - Add and chat with friends in real-time.
   - Encourage each other to stay on track.
   - Join the vibrant community of like-minded individuals.

3. **Gamification**:
   - Participate in weekly challenges and quizzes.
   - Earn points and climb leaderboards.
   - Unlock achievements and earn rewards.

4. **Articles and Resources**:
   - Access user-contributed and verified articles for self-improvement.
   - Write and submit your articles for community benefit.

### Notifications
- Receive updates on friend requests, messages, and challenges.

### Dashboard Visualization
- View habit statistics and streak data in charts and visualized summaries.

---

## Project Setup

### Prerequisites
Before getting started, ensure you have the following:
- Python (version 3.8+)
- Django
- Redis (for task management)
- A virtual environment manager (e.g., `venv` or `conda`)

### Installation and Setup

1. **Clone the Repository**:
```bash
$ git clone https://github.com/yourusername/habit-tracker.git
$ cd habit-tracker
```

2. **Create a Virtual Environment**:
```bash
$ python3 -m venv venv
$ source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install Dependencies**:
```bash
$ pip install -r requirements.txt
```

4. **Setup the Database**:
   - Configure the `DATABASES` setting in `settings.py` to your database credentials
   - Apply migrations:
   ```bash
   $ python manage.py migrate
   ```

5. **Collect Static Files**:
```bash
$ python manage.py collectstatic
```

6. **Run the Redis Server** (Required for Celery):
```bash
$ redis-server
```

7. **Start Celery Workers**:
```bash
$ celery -A habit_tracker worker --loglevel=info
```

8. **Start Celery Beat Scheduler** (For periodic tasks):
```bash
$ celery -A habit_tracker beat --loglevel=info
```

9. **Run Daphne** (For ASGI Server):
```bash
$ daphne -b 0.0.0.0 -p 8000 habit_tracker.asgi:application
```

10. **Run Django Development Server** (Optional for WSGI-based routes):
```bash
$ python manage.py runserver
```

11. **Install Frontend Dependencies** (If required):
```bash
$ npm install
```

### Access the Application
Once the server is running, you can access the application at:
```
http://localhost:8000
```

---

## Directory Structure
```
habit-tracker/
├── habit_tracker/           # Main Django app
│   ├── asgi.py              # ASGI configuration
│   ├── settings.py          # Project settings
│   ├── urls.py              # URL configuration
│   ├── wsgi.py              # WSGI configuration
├── static/                  # Static files
├── templates/               # HTML templates
├── requirements.txt         # Dependencies
└── README.md                # Project documentation
```

---

## Available Commands

- **Run Tests**:
```bash
$ python manage.py test
```

- **Create Superuser** (For admin access):
```bash
$ python manage.py createsuperuser
```

- **Run Redis Server** (Background process required for task queue):
```bash
$ redis-server
```

- **Start Celery Worker** (Background worker for tasks):
```bash
$ celery -A habit_tracker worker --loglevel=info
```

- **Start Celery Scheduler** (For periodic tasks):
```bash
$ celery -A habit_tracker beat --loglevel=info
```

---

## Contributing

We welcome contributions! If you'd like to contribute, please fork the repository and submit a pull request.

---

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

---

If you encounter any issues, feel free to reach out or create an issue in the repository.

