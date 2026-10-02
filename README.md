# POS System

A Laravel 12 and Inertia React point-of-sale and inventory application. MySQL is the default database.

## Local setup with XAMPP

Requirements: PHP 8.2+, Composer, Node.js/npm, and MySQL with the `pos` database created.

1. Copy `.env.example` to `.env`. With XAMPP's default `htdocs` layout, this project includes an Apache front controller so the app opens at `http://localhost/pos-system` (for example, `http://localhost/pos-system/login`) without `/public` in the URL. The configured `APP_URL` should be `http://localhost/pos-system`.
2. Set `DB_HOST`, `DB_PORT`, `DB_DATABASE=pos`, `DB_USERNAME`, and `DB_PASSWORD` to match your MySQL account. XAMPP commonly uses `root` with an empty password; change this if yours differs.
3. Install PHP dependencies with `composer install` and JavaScript dependencies with `npm ci`.
4. Generate the application key and migrate the database:

   ```sh
   php artisan key:generate
   php artisan migrate
   php artisan app:create-admin
   ```

5. Build frontend assets with `npm run build`.
6. In Apache, enable `mod_rewrite` and allow `.htaccess` overrides. For production, configure a virtual host whose `DocumentRoot` is this repository's `public` directory; the root wrapper is intended for local XAMPP subdirectory use. Do not expose the repository root as a public directory.

Do not use `php artisan serve` as the production web server. Apache/Nginx should serve only `public/` and forward requests to `public/index.php`.

## Production deployment

Use a dedicated MySQL account with only the privileges the application needs. Set `APP_ENV=production`, `APP_DEBUG=false`, a secure `APP_KEY`, the public `APP_URL`, and production database credentials in the server's private `.env` file. Keep `.env` out of source control and outside the web document root. Create the first administrator from the server CLI with `php artisan app:create-admin`; public registration is disabled.

```sh
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

Ensure `storage/` and `bootstrap/cache/` are writable by the web process. Rebuild Laravel's cached configuration after changing `.env` (`php artisan optimize:clear`, then `php artisan optimize`). Back up the MySQL database and `storage/` data as part of deployment operations.

## Tests

Run the test suite with `php artisan test`. The test configuration uses an in-memory SQLite database; the application itself defaults to MySQL.
