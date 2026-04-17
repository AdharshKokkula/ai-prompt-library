#!/usr/bin/env bash
# Render build script for Django backend
set -e

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Seeding initial data..."
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Admin created.')

from prompts.models import Prompt, Tag
if Prompt.objects.count() == 0:
    data = [
        {'title': 'Cyberpunk City Rain', 'content': 'A cinematic wide-angle shot of a rain-soaked cyberpunk megacity at night, neon signs reflecting on wet asphalt, holographic advertisements floating in volumetric fog, crowds of people with umbrellas, hyper-realistic, 8K, dramatic lighting, blade runner aesthetic', 'complexity': 8, 'tags': ['cyberpunk','city','rain','cinematic']},
        {'title': 'Enchanted Forest Spirit', 'content': 'A glowing ethereal forest spirit standing among ancient towering trees draped in luminescent moss, magical particles drifting through misty air, moonlight filtering through the canopy, fantasy illustration style, soft bokeh, Studio Ghibli inspired', 'complexity': 6, 'tags': ['fantasy','forest','spirit','ghibli']},
        {'title': 'Astronaut on Alien Planet', 'content': 'A lone astronaut in a white space suit standing on the edge of a dramatic alien canyon, two moons in a purple twilight sky, bioluminescent plants glowing below, photorealistic, cinematic composition, epic scale', 'complexity': 7, 'tags': ['space','scifi','cinematic']},
        {'title': 'Dragon Over Medieval Castle', 'content': 'A massive obsidian dragon with glowing amber eyes soaring above a crumbling medieval castle at dusk, storm clouds illuminated by lightning, villagers fleeing below, oil painting style, dramatic chiaroscuro lighting, highly detailed scales', 'complexity': 9, 'tags': ['fantasy','dragon','medieval']},
        {'title': 'Anime Sunset Beach', 'content': 'A peaceful anime-style scene of two friends sitting on a cliff overlooking the ocean at golden hour, warm orange and pink sunset sky, gentle waves, cherry blossoms, soft cel-shading, Makoto Shinkai color palette', 'complexity': 4, 'tags': ['anime','sunset','peaceful']},
        {'title': 'Steampunk Inventor Workshop', 'content': 'An intricate steampunk inventor workshop filled with brass gears, glowing Tesla coils, copper pipes, clockwork automatons, warm gas lamp lighting, blueprints on workbenches, smoke and steam effects, highly detailed environment art', 'complexity': 9, 'tags': ['steampunk','workshop','detailed']},
    ]
    for item in data:
        tags = item.pop('tags')
        p = Prompt.objects.create(**item)
        for t in tags:
            tag, _ = Tag.objects.get_or_create(name=t)
            p.tags.add(tag)
    print(f'Seeded {Prompt.objects.count()} prompts.')
"

echo "Build complete."
