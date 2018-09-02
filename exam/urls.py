from django.urls import path
from . import views

app_name = 'exam'

urlpatterns = [
    path('exams/', views.exams, name='exams'),
    # AJAX urls
]
