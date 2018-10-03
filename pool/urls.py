from django.urls import path
from . import views

app_name = 'pool'

urlpatterns = [
    path('problems/', views.problems, name='problems'),
    # AJAX urls
    path('change_category/<int:category_id>/', views.change_category),
    path('change_subject/<int:category_id>/<int:subject_id>/', views.change_subject),
    path('get_category/<int:category_id>/', views.get_category),
    path('get_subject/<int:subject_id>/', views.get_subject),
    path('get_chapter/<int:chapter_id>/', views.get_chapter),
    path('get_problem_set/<int:category_id>/<int:subject_id>/<int:chapter_id>/', views.get_problem_set),
    path('get_problem/<slug:problem_type>/<int:problem_id>/', views.get_problem),
    path('delete_problem/<slug:problem_type>/<int:problem_id>/', views.delete_problem),
    path('delete_problem/cp/<int:problem_id>/<int:order>/', views.delete_sub_problem),
]
