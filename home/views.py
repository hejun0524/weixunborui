from django.shortcuts import render, redirect
from django.contrib import auth
from django.contrib.auth.decorators import login_required


# Create your views here.


def index(request):
    context = {'n_bar': 'index'}
    return render(request, 'home/index.html', context)


def login(request):
    if request.user.is_authenticated:
        return redirect('home:dashboard')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = auth.authenticate(request, username=username, password=password)
        if (user is not None) and user.is_active:
            auth.login(request, user)
            return redirect('home:dashboard')
        else:
            pass
    context = {'n_bar': 'login'}
    return render(request, 'home/login.html', context)


@login_required()
def logout(request):
    auth.logout(request)
    return redirect('home:login')


@login_required()
def dashboard(request):
    return render(request, 'home/dashboard.html')
