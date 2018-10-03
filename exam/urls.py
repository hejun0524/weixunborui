from django.urls import path
from . import views

app_name = 'exam'

urlpatterns = [
    path('exams/', views.exams, name='exams'),
    path('certification/', views.certification, name='certification'),
    # AJAX urls
    path('change_category/<int:category_id>/', views.change_category),
    path('change_subject/<int:category_id>/<int:subject_id>/', views.change_subject),
    path('get_strategy/<int:strategy_id>/', views.get_strategy),
]
