# Secrets Rotation Runbook

This runbook rotates backend secrets after migration to Supabase/Postgres.

## Secrets to rotate (priority order)

1. `DATABASE_URL` (Supabase DB password/connection string)
2. `JWT_SECRET`
3. `SMTP_PASS` (and `SMTP_USER`/`SMTP_FROM` if changing sender)
4. `PAYSTACK_SECRET_KEY`
5. `USDA_API_KEY`
6. `OTEL_API_KEY`
7. Any old Railway MySQL credentials (disable/revoke/delete)

## Where to rotate

- Render backend service env vars
- Local backend `.env.development`
- Any CI/CD secret store (if used)

## Safe rollout sequence

1. Generate all new secrets in provider dashboards.
2. Set new secrets in Render first.
3. Deploy/restart Render service.
4. Smoke-test critical endpoints:
   - Auth signup/signin
   - Forgot/reset password
   - Meals/workouts/metrics reads and writes
   - Payments route(s)
5. Update local `.env.development`.
6. Revoke old secrets in provider dashboards.
7. Remove any old Railway DB users/resources.

## Render checklist

Set/update these vars on Render:

- `DATABASE_URL`
- `PGSSL=true`
- `JWT_SECRET`
- `SMTP_*`
- `PAYSTACK_*`
- `USDA_API_KEY`
- `OTEL_*`
- `ALLOWED_ORIGINS`
- `FRONTEND_URL`

Remove these old vars from Render if still present:

- `MYSQLPORT`
- `MYSQL_URL`
- `MYSQLUSER`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- any `MYSQL*`

## Mapping old -> new (DB)

- `MYSQL_URL` -> no direct equivalent (use `DATABASE_URL`)
- `MYSQLUSER` -> inside `DATABASE_URL`
- `MYSQL_ROOT_PASSWORD` -> inside `DATABASE_URL`
- `MYSQL_DATABASE` -> inside `DATABASE_URL`
- `MYSQLPORT` -> inside `DATABASE_URL` (or `PGPORT` if discrete vars used)

## Notes

- Keep `PGSSL=true` for Supabase.
- Prefer Supabase Transaction Pooler URL for server runtimes.
- Never commit real secrets. Use `.env.example` placeholders only.
