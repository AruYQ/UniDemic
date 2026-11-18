#!/bin/sh
set -e

echo "🚀 Starting UniDemic API container..."

# Create .env if not present
if [ ! -f /var/www/html/.env ]; then
    echo "Creating .env from .env.example..."
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Ensure composer dependencies are installed
if [ ! -f /var/www/html/vendor/autoload.php ]; then
    echo "Installing Composer dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Generate app key if not set
php artisan key:generate --force --no-interaction

# Wait for PostgreSQL
echo "Waiting for PostgreSQL ($DB_HOST:$DB_PORT)..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Run database migrations
echo "Running migrations..."
php artisan migrate --force --no-interaction

echo "UniDemic API is ready to serve!"
exec "$@"
