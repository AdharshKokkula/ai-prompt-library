from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('prompts/', include('prompts.urls')),
    path('auth/', include('auth_app.urls')),
]
