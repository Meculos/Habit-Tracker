from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Set default Django settings for the Celery program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project.settings')

app = Celery('final_project')

# Use Django's settings for Celery configuration.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically discover tasks in all installed apps.
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
