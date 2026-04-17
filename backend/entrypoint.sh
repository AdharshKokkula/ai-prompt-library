#!/bin/bash
set -e

echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 0.2
done
echo "PostgreSQL is ready!"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Creating superuser if not exists..."
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created — admin / admin123')
"

echo "Seeding sample prompts..."
python manage.py shell -c "
from prompts.models import Prompt, Tag

if Prompt.objects.count() == 0:
    data = [
        {
            'title': 'Cyberpunk City Rain',
            'content': 'A cinematic wide-angle shot of a rain-soaked cyberpunk megacity at night, neon signs reflecting on wet asphalt, holographic advertisements floating in volumetric fog, crowds of people with umbrellas, hyper-realistic, 8K, dramatic lighting, blade runner aesthetic',
            'complexity': 8,
            'tags': ['cyberpunk', 'city', 'rain', 'cinematic'],
        },
        {
            'title': 'Enchanted Forest Spirit',
            'content': 'A glowing ethereal forest spirit standing among ancient towering trees draped in luminescent moss, magical particles drifting through misty air, moonlight filtering through the canopy, fantasy illustration style, soft bokeh background, Studio Ghibli inspired',
            'complexity': 6,
            'tags': ['fantasy', 'forest', 'spirit', 'ghibli'],
        },
        {
            'title': 'Astronaut on Alien Planet',
            'content': 'A lone astronaut in a white space suit standing on the edge of a dramatic alien canyon, two moons visible in a purple twilight sky, bioluminescent plants glowing below, distant star clusters, photorealistic, cinematic composition, epic scale',
            'complexity': 7,
            'tags': ['space', 'scifi', 'cinematic'],
        },
        {
            'title': 'Minimalist Portrait Study',
            'content': 'A minimalist portrait of a young woman with striking eyes, clean white background, soft diffused studio lighting, subtle skin texture, professional photography, shallow depth of field, neutral color palette',
            'complexity': 3,
            'tags': ['portrait', 'minimalist', 'photography'],
        },
        {
            'title': 'Dragon Over Medieval Castle',
            'content': 'A massive obsidian dragon with glowing amber eyes soaring above a crumbling medieval castle at dusk, storm clouds illuminated by lightning behind it, villagers fleeing below, oil painting style, dramatic chiaroscuro lighting, highly detailed scales',
            'complexity': 9,
            'tags': ['fantasy', 'dragon', 'medieval'],
        },
        {
            'title': 'Anime Sunset Beach',
            'content': 'A peaceful anime-style scene of two friends sitting on a cliff overlooking the ocean at golden hour, warm orange and pink sunset sky, gentle waves, cherry blossoms drifting in the breeze, soft cel-shading, Makoto Shinkai color palette',
            'complexity': 4,
            'tags': ['anime', 'sunset', 'peaceful'],
        },
        {
            'title': 'Steampunk Inventor Workshop',
            'content': 'An intricate steampunk inventor workshop filled with brass gears, glowing Tesla coils, copper pipes, clockwork automatons mid-assembly, warm gas lamp lighting, blueprints scattered across workbenches, smoke and steam effects, highly detailed environment art',
            'complexity': 9,
            'tags': ['steampunk', 'workshop', 'detailed'],
        },
        {
            'title': 'Watercolor Koi Pond',
            'content': 'A serene Japanese koi pond rendered in delicate watercolor style, orange and white koi fish swimming among lily pads, reflections of cherry blossoms on the water surface, soft washes of pink and blue, traditional Japanese aesthetics',
            'complexity': 5,
            'tags': ['watercolor', 'japanese', 'peaceful'],
        },
    ]

    for item in data:
        tags = item.pop('tags')
        prompt = Prompt.objects.create(**item)
        for tag_name in tags:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            prompt.tags.add(tag)

    print(f'Seeded {Prompt.objects.count()} prompts and {Tag.objects.count()} tags.')
else:
    print(f'Skipped seeding — {Prompt.objects.count()} prompts already exist.')
"

echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --threads 2 \
  --timeout 60
