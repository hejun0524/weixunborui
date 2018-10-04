from django.urls import path
from . import views

app_name = 'exam'

urlpatterns = [
    path('exams/', views.exams, name='exams'),
    path('certification/', views.certification, name='certification'),
    path('certification/get/<int:certification_id>', views.get_certification, name='get_certification'),
    path('certification/delete/<int:certification_id>', views.delete_certification, name='delete_certification'),
    # AJAX urls
    path('change_category/<int:category_id>/', views.change_category),
    path('change_subject/<int:category_id>/<int:subject_id>/', views.change_subject),
    path('get_strategy/<int:strategy_id>/', views.get_strategy),
]
