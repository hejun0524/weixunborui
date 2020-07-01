from django.urls import path
from . import views

app_name = 'exam'

urlpatterns = [
    path('exams/', views.exams, name='exams'),
    path('exams/get/<int:exam_id>/', views.get_exam, name='get_exam'),
    path('exams/delete/<int:exam_id>/', views.delete_exam, name='delete_exam'),
    path('exams/get_list/<int:exam_id>/', views.get_exam_list, name='get_exam_list'),
    path('exams/delete_student_list/<int:list_id>/', views.delete_student_list, name='delete_student_list'),
    path('certification/', views.certification, name='certification'),
    path('certification/get/<int:certification_id>', views.get_certification, name='get_certification'),
    path('certification/delete/<int:certification_id>', views.delete_certification, name='delete_certification'),
    path('grades/', views.grades, name='grades'),
    path('grades/get-sample', views.grades_sample, name='grades_sample'),
    # AJAX urls
    path('check_grades/', views.check_grades),
    path('change_category/<int:category_id>/', views.change_category),
    path('change_subject/<int:category_id>/<int:subject_id>/', views.change_subject),
    path('change_code_category/<int:category_id>/', views.change_code_category),
    path('get_strategy/<int:strategy_id>/', views.get_strategy),
    path('get_picture/<slug:picture_type>/<int:picture_id>/', views.get_picture),
    path('get_code_category/<int:category_id>/', views.get_code_category),
    path('get_code/<int:code_id>/', views.get_code),
    path('get_student_list/<int:list_id>/', views.get_student_list),
    path('get_ad/<int:ad_id>/', views.get_ad),
    path('get_agreement/<int:agreement_id>/', views.get_agreement),
]
