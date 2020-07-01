from django.urls import path
from . import views

app_name = 'home'

urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('courses/', views.courses, name='courses'),
    path('assessment/', views.assessment, name='assessment'),
    path('contact/', views.contact, name='contact'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('grades/', views.grades, name='grades'),
    path('query-grades/', views.query_grades),
]
