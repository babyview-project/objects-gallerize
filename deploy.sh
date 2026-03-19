#!/bin/sh
# Build and deploy the frontend to nginx
# Run from the project root: ./deploy.sh

echo "Building frontend..."
npm run build

echo "Done. Reload nginx if the location config changed:"
echo "  sudo systemctl reload nginx"
