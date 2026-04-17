import json
import redis
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings

from .models import Prompt, Tag
from auth_app.utils import get_user_from_token

redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=getattr(settings, 'REDIS_PASSWORD', None),
    db=0,
    decode_responses=True,
)


@method_decorator(csrf_exempt, name='dispatch')
class PromptListView(View):
    def get(self, request):
        tag_filter = request.GET.get('tag', '').strip()
        prompts = Prompt.objects.prefetch_related('tags').all()
        if tag_filter:
            prompts = prompts.filter(tags__name=tag_filter.lower())

        data = [
            {
                'id': str(p.id),
                'title': p.title,
                'complexity': p.complexity,
                'created_at': p.created_at.isoformat(),
                'tags': [t.name for t in p.tags.all()],
            }
            for p in prompts
        ]
        return JsonResponse({'prompts': data, 'count': len(data)})

    def post(self, request):
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Authentication required.'}, status=401)

        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON body.'}, status=400)

        title = str(body.get('title', '')).strip()
        content = str(body.get('content', '')).strip()
        complexity = body.get('complexity')
        tags_input = body.get('tags', [])

        errors = {}
        if len(title) < 3:
            errors['title'] = 'Title must be at least 3 characters.'
        if len(content) < 20:
            errors['content'] = 'Content must be at least 20 characters.'
        try:
            complexity = int(complexity)
            if not (1 <= complexity <= 10):
                errors['complexity'] = 'Complexity must be between 1 and 10.'
        except (TypeError, ValueError):
            errors['complexity'] = 'Complexity must be an integer between 1 and 10.'

        if errors:
            return JsonResponse({'errors': errors}, status=400)

        prompt = Prompt.objects.create(title=title, content=content, complexity=complexity)
        if isinstance(tags_input, list):
            for tag_name in tags_input:
                if tag_name and isinstance(tag_name, str):
                    tag, _ = Tag.objects.get_or_create(name=tag_name.lower().strip())
                    prompt.tags.add(tag)

        return JsonResponse({
            'id': str(prompt.id),
            'title': prompt.title,
            'content': prompt.content,
            'complexity': prompt.complexity,
            'created_at': prompt.created_at.isoformat(),
            'tags': [t.name for t in prompt.tags.all()],
        }, status=201)


@method_decorator(csrf_exempt, name='dispatch')
class PromptDetailView(View):
    def get(self, request, prompt_id):
        try:
            prompt = Prompt.objects.prefetch_related('tags').get(pk=prompt_id)
        except Prompt.DoesNotExist:
            return JsonResponse({'error': 'Prompt not found.'}, status=404)
        except Exception:
            return JsonResponse({'error': 'Invalid prompt ID.'}, status=400)

        view_key = f'prompt:views:{prompt_id}'
        try:
            view_count = int(redis_client.incr(view_key))
        except Exception:
            view_count = 0

        return JsonResponse({
            'id': str(prompt.id),
            'title': prompt.title,
            'content': prompt.content,
            'complexity': prompt.complexity,
            'created_at': prompt.created_at.isoformat(),
            'tags': [t.name for t in prompt.tags.all()],
            'view_count': view_count,
        })


@method_decorator(csrf_exempt, name='dispatch')
class TagListView(View):
    def get(self, request):
        tags = list(Tag.objects.values_list('name', flat=True))
        return JsonResponse({'tags': tags})
