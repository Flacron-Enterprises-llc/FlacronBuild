# Docker Setup for FlacronBuild

This guide explains how to build and run FlacronBuild using Docker.

## Prerequisites

- Docker installed on your system
- Environment variables configured (see below)

## Building the Docker Image

**IMPORTANT:** Firebase environment variables (`VITE_FIREBASE_*`) must be available during the build process because Vite replaces them at build time, not runtime.

### Option 1: Using the Build Script (Recommended)

Use the provided build script which automatically reads Firebase variables from `.env`:

```powershell
.\build-docker.ps1
```

Or on Linux/Mac:
```bash
chmod +x build-docker.sh
./build-docker.sh
```

### Option 2: Manual Build with Build Args

```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY="your_firebase_api_key" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com" \
  --build-arg VITE_FIREBASE_PROJECT_ID="your_project_id" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id" \
  --build-arg VITE_FIREBASE_APP_ID="your_app_id" \
  --build-arg VITE_FIREBASE_MEASUREMENT_ID="your_measurement_id" \
  -t flacronbuild:latest .
```

### Option 3: Simple Build (Firebase won't work)

If you build without Firebase variables, the app will show a white page because Firebase initialization will fail:

```bash
docker build -t flacronbuild:latest .
```

## Running the Container

### Using Docker Run

```bash
docker run -d \
  --name flacronbuild \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e DATABASE_URL="your_database_url_here" \
  -e STRIPE_SECRET_KEY="your_stripe_secret_key" \
  -e STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key" \
  -e GEMINI_API_KEY="your_gemini_api_key" \
  -e GEMINI_KEY="your_gemini_api_key" \
  -e VITE_FIREBASE_API_KEY="your_firebase_api_key" \
  -e VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com" \
  -e VITE_FIREBASE_PROJECT_ID="your_project_id" \
  -e VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com" \
  -e VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id" \
  -e VITE_FIREBASE_APP_ID="your_app_id" \
  -e VITE_FIREBASE_MEASUREMENT_ID="your_measurement_id" \
  flacronbuild:latest
```

### Using Environment File

Create a `.env` file in the project root:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=your_database_url_here
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Then run:

```bash
docker run -d \
  --name flacronbuild \
  -p 5000:5000 \
  --env-file .env \
  flacronbuild:latest
```

### Using Docker Compose

1. Copy `docker-compose.example.yml` to `docker-compose.yml`
2. Fill in your environment variables in `docker-compose.yml` or use a `.env` file
3. Run:

```bash
docker-compose up -d
```

## Accessing the Application

Once the container is running, access the application at:
- http://localhost:5000

## Useful Docker Commands

### View logs
```bash
docker logs flacronbuild
```

### Follow logs
```bash
docker logs -f flacronbuild
```

### Stop the container
```bash
docker stop flacronbuild
```

### Start the container
```bash
docker start flacronbuild
```

### Remove the container
```bash
docker rm flacronbuild
```

### Remove the image
```bash
docker rmi flacronbuild:latest
```

### Execute commands in running container
```bash
docker exec -it flacronbuild sh
```

## Health Check

The Dockerfile includes a health check that verifies the API is responding. Check container health:

```bash
docker ps
```

The STATUS column will show "healthy" or "unhealthy".

## Troubleshooting

### Container exits immediately
- Check logs: `docker logs flacronbuild`
- Verify all required environment variables are set
- Ensure DATABASE_URL is correct and accessible

### Port already in use
- Change the host port: `-p 8080:5000` (maps host port 8080 to container port 5000)
- Or stop the service using port 5000

### Build fails
- Ensure you have sufficient disk space
- Check that all source files are present
- Verify Node.js version compatibility (requires Node 20+)

## Security Notes

- Never commit `.env` files or `docker-compose.yml` with real secrets to version control
- Use Docker secrets or environment variable management tools in production
- The container runs as a non-root user for security
- Regularly update the base image and dependencies

