#! /bin/bash
echo "This script will start the service stack and wait for all services to be ready"
chmod +x backend/entrypoint.sh

cp docker-compose.dev.yml docker-compose.yml
docker-compose down
docker-compose up --build -d

##########################################
# Wait for backend (DJANGO) to be ready
##########################################
echo "Waiting for backend to be ready..."
while ! curl -s http://localhost:8005/admin/ > /dev/null; do
    sleep 1
done
echo "Backend is ready!"
echo "You can visit http://localhost:8005/admin/"
echo "Default username: admin password: admin"

##########################################
# Wait for frontend (NEXT.JS) to be ready
##########################################
echo "Waiting for frontend to be ready..."
while ! curl -s http://localhost:3000/ > /dev/null; do
    sleep 1
done
echo "Frontend is ready!"
echo "You can visit http://localhost:3000/ (even if piston is not ready)"

##########################################
# Wait for piston to be ready
##########################################
echo "Waiting for piston to be ready..."
while ! curl -s http://localhost:2000/ > /dev/null; do
    sleep 1
done
echo "Piston is ready!"
echo "Installing python and gcc..."
curl -X POST http://localhost:2000/api/v2/packages  -H 'Content-Type: application/json'  -d '{"language":"python","version":"3.12.0"}'
curl -X POST http://localhost:2000/api/v2/packages  -H 'Content-Type: application/json'  -d '{"language":"gcc","version":"10.2.0"}'
echo "Done! Everything is ready!"
echo "You can visit http://localhost:3000/"




