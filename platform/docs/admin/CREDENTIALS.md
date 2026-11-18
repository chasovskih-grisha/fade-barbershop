# Development Environment - Admin Login Credentials

For the FADE Barbershop Admin Panel running at `http://localhost:13002`:

## Admin Login Page
**URL:** http://localhost:13002/login

## Credentials
- **Username:** `owner`
- **Password:** `FadeSecret2026`

## How to Use
1. Navigate to `http://localhost:13002/login`
2. Enter username: `owner`
3. Enter password: `FadeSecret2026`
4. Click "Login"
5. You'll be redirected to the dashboard at `http://localhost:13002/`

## Notes
- These are test credentials used in the E2E test suite (`admin-login.e2e.spec.ts`)
- The password `FadeSecret2026` is hashed via scrypt in the test setup
- Credentials validate against the in-memory test user store
- After login, a cookie `admin` domain `.fade.com.ua` is set for session management

## API Context (for reference)
- Login endpoint: `POST /admin/auth/login`
- Me endpoint: `GET /admin/auth/me` (validates session, returns user `{id, phone, role}`)
- All admin routes require authentication via session cookie