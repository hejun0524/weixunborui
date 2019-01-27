from django.urls import path
from . import views

app_name = 'control'

urlpatterns = [
    path('download/', views.download, name='download'),
    path('download/get/<int:file_id>/', views.get_download, name='get_download'),
    path('download/delete/<int:file_id>/', views.delete_download, name='delete_download'),
    path('account/', views.account, name='account'),
    path('inferior/', views.inferior, name='inferior'),
]
