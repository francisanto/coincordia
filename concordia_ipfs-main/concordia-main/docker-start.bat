@echo off
echo Starting Concordia Docker environment...

:: Build and start the containers
docker-compose up --build -d

:: Wait for services to be healthy
echo Waiting for services to be healthy...
timeout /t 10 /nobreak > nul

:: Check container health
echo Container Health Status:
echo Frontend: 
docker inspect --format="{{.State.Health.Status}}" concordia-main_frontend_1 2>nul || echo container not found
echo Backend: 
docker inspect --format="{{.State.Health.Status}}" concordia-main_backend_1 2>nul || echo container not found
echo MongoDB: 
docker inspect --format="{{.State.Health.Status}}" concordia-main_mongodb_1 2>nul || echo container not found

echo.
echo Concordia is now running!
echo Frontend: http://localhost:5000
echo Backend API: http://localhost:3002
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down