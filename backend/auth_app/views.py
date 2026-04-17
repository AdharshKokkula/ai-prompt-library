import json
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .utils import generate_token


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    def post(self, request):
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)

        username = str(body.get('username', '')).strip()
        password = str(body.get('password', '')).strip()

        if not username or not password:
            return JsonResponse({'error': 'Username and password are required.'}, status=400)

        user = authenticate(username=username, password=password)
        if not user:
            return JsonResponse({'error': 'Invalid credentials.'}, status=401)

        return JsonResponse({'token': generate_token(user), 'username': user.username})


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(View):
    def post(self, request):
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)

        username = str(body.get('username', '')).strip()
        password = str(body.get('password', '')).strip()
        email = str(body.get('email', '')).strip()

        errors = {}
        if len(username) < 3:
            errors['username'] = 'Username must be at least 3 characters.'
        if len(password) < 8:
            errors['password'] = 'Password must be at least 8 characters.'
        if errors:
            return JsonResponse({'errors': errors}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already taken.'}, status=400)

        user = User.objects.create_user(username=username, password=password, email=email)
        return JsonResponse({'token': generate_token(user), 'username': user.username}, status=201)
