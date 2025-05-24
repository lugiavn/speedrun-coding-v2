#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
sleep 5

# Apply database migrations
echo "Applying migrations..."
python manage.py migrate

# Create superuser if not exists
echo "Creating superuser..."
python manage.py shell -c "
from django.contrib.auth.models import User
try:
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin')
        print('Superuser created.')
    else:
        print('Superuser already exists.')
except Exception as e:
    print(f'Error creating superuser: {e}')   
"

# Start server
echo "Starting server..."
exec "$@" 