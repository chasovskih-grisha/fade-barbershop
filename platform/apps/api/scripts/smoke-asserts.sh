#!/usr/bin/env bash
# smoke-asserts.sh — CI-runnable assertions against an ephemeral smoke DB.
# Prerequisite: migrations applied to $SMOKE_DB_URL (or fallback smoke DB on dev stack).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-/Users/grisha/Projects/barbershop/platform}"

# --- DB access ---
if [ -n "${SMOKE_DB_URL:-}" ]; then
  PG_URL="$SMOKE_DB_URL"
else
  # dev-stack smoke DB fallback
  PG_URL="postgresql://barbershop:barbershop@127.0.0.1:15432/smoke"
fi

exec_sql () {
  # host has no psql in PATH — always reach the smoke DB via the dev-stack postgres container.
  /usr/local/bin/docker exec fade-platform-postgres psql -U barbershop -d smoke -tAc "$1" 2>/dev/null
}

exec_sql_raw () {
  # variant that does NOT swallow stderr — used for smoke DB reachability diagnostics.
  /usr/local/bin/docker exec fade-platform-postgres psql -U barbershop -d smoke -tAc "$1"
}

# smoke database may be addressed by name or by a custom env-var-provided name.
SMOKE_DB_NAME="${SMOKE_DB_NAME:-smoke}"
exec_sql () {
  /usr/local/bin/docker exec fade-platform-postgres psql -U barbershop -d "$SMOKE_DB_NAME" -tAc "$1" 2>/dev/null
}

exec_sql_raw () {
  /usr/local/bin/docker exec fade-platform-postgres psql -U barbershop -d "$SMOKE_DB_NAME" -tAc "$1"
}

log () { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

# smoke DB public."User" tablename is the bare identifier User (no quotes in pg_tables).
# The -tAc one-liner below is safe for that because exec_sql meshes with psql -tAc quoting.

assert_eq () {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" != "$actual" ]; then
    echo "FAIL: $label — expected=$expected actual=$actual"
    EXIT=1
  else
    echo "OK:   $label = $actual"
  fi
}

EXIT=0
echo "== smoke DB: $PG_URL =="

echo "--- table row counts ---"
# User
# If the smoke DB is empty here, seed:smoke was either not run or wrote to a different DB.
# Emit a diagnostic so a CI blip is distinguishable from a real assert failure.
USER_TABLE_EXISTS_RAW=$(exec_sql_raw "SELECT count(*)::int FROM pg_tables WHERE schemaname='public' AND tablename='User'")
USER_COUNT=$(exec_sql "SELECT count(*)::int FROM \"User\"")
log "DIAG: smoke DB=$SMOKE_DB_NAME tablename public.User present=$USER_TABLE_EXISTS_RAW user_count=$USER_COUNT"
if [ "$USER_TABLE_EXISTS_RAW" != "1" ]; then
  log "WARN: smoke DB has no public.User table — migrations may not have deployed (USER_TABLE_EXISTS_RAW=$USER_TABLE_EXISTS_RAW)"
fi
# bc is a red herring here: we want a numeric comparison, but `echo "... >= ..." | bc` returns 1/0 strings, not the count.
# Use a direct integer comparison instead.
if [ "$USER_COUNT" -ge 8 ]; then
  assert_eq "User.count >= 8" "$USER_COUNT" "$USER_COUNT"
else
  assert_eq "User.count >= 8" "8" "$USER_COUNT"
fi
# Session (seed-dev creates admin session only; seed-e2e creates more)
SESSION_COUNT=$(exec_sql "SELECT count(*)::int FROM \"Session\"")
echo "INFO: Session.count = $SESSION_COUNT (no hard assertion — fixture-dependent)"
# Booking — seed-appointments creates a handful
BOOKING_COUNT=$(exec_sql "SELECT count(*)::int FROM \"Booking\"")
if [ "$BOOKING_COUNT" -ge 1 ]; then
  assert_eq "Booking.count >= 1" "$BOOKING_COUNT" "$BOOKING_COUNT"
else
  assert_eq "Booking.count >= 1" "1" "$BOOKING_COUNT"
fi
# Location (seed-dev seeds 3 locations)
LOC_COUNT=$(exec_sql "SELECT count(*)::int FROM \"Location\"")
if [ "$LOC_COUNT" -ge 1 ]; then
  assert_eq "Location.count >= 1" "$LOC_COUNT" "$LOC_COUNT"
else
  assert_eq "Location.count >= 1" "1" "$LOC_COUNT"
fi
# Service (seed-dev seeds 3 services)
SVC_COUNT=$(exec_sql "SELECT count(*)::int FROM \"Service\"")
if [ "$SVC_COUNT" -ge 3 ]; then
  assert_eq "Service.count >= 3" "$SVC_COUNT" "$SVC_COUNT"
else
  assert_eq "Service.count >= 3" "3" "$SVC_COUNT"
fi
# ServicePrice (per location)
SVC_PRICE_COUNT=$(exec_sql "SELECT count(*)::int FROM \"ServicePrice\"")
if [ "$SVC_PRICE_COUNT" -ge 1 ]; then
  assert_eq "ServicePrice.count >= 1" "$SVC_PRICE_COUNT" "$SVC_PRICE_COUNT"
else
  assert_eq "ServicePrice.count >= 1" "1" "$SVC_PRICE_COUNT"
fi
# AppointmentParty — seed-appointments.ts writes parties?
PARTY_COUNT=$(exec_sql "SELECT count(*)::int FROM \"AppointmentParty\"")
echo "INFO: AppointmentParty.count = $PARTY_COUNT (fixture-dependent)"
# ClientProfile
PROFILE_COUNT=$(exec_sql "SELECT count(*)::int FROM \"ClientProfile\"")
echo "INFO: ClientProfile.count = $PROFILE_COUNT"
# OtpChallenge (seed may not create any)
OTP_COUNT=$(exec_sql "SELECT count(*)::int FROM \"OtpChallenge\"")
echo "INFO: OtpChallenge.count = $OTP_COUNT"

echo "--- status coverage ---"
# Booking status coverage: seed-appointments seeds all six lifecycle statuses.
for STATUS in booked confirmed in_progress completed cancelled no_show; do
  n=$(exec_sql "SELECT count(*)::int FROM \"Booking\" WHERE status='$STATUS'")
  if [ "$n" -gt 0 ]; then
    echo "OK:   Booking.status '$STATUS' count=$n"
  else
    echo "FAIL: Booking.status '$STATUS' missing"; EXIT=1
  fi
done

echo "--- profile invariants ---"
# Every User.role = 'client' MUST have exactly one ClientProfile
MISSING_PROFILE=$(exec_sql "SELECT count(*)::int FROM \"User\" u LEFT JOIN \"ClientProfile\" p ON p.\"userId\"=u.id WHERE u.role='client' AND p.id IS NULL")
assert_eq "client users with profile" "0" "$MISSING_PROFILE"
EXTRA_PROFILE=$(exec_sql "SELECT count(*)::int FROM \"ClientProfile\" p LEFT JOIN \"User\" u ON u.id=p.\"userId\" WHERE u.id IS NULL")
assert_eq "orphan profiles" "0" "$EXTRA_PROFILE"

echo "--- admin user invariant ---"
ADMIN_COUNT=$(exec_sql "SELECT count(*)::int FROM \"User\" WHERE role='admin'")
assert_eq "admin users" "1" "$ADMIN_COUNT"
ADMIN_HAS_PASSWORD=$(exec_sql "SELECT count(*)::int FROM \"User\" WHERE role='admin' AND \"passwordHash\" IS NOT NULL")
assert_eq "admin has passwordHash" "1" "$ADMIN_HAS_PASSWORD"

echo "--- seed fixtures idempotency hint ---"
# Re-run-safe: seed:smoke does migrate reset + re-seed, so we only assert the post-seed shape.
echo "== asserts done =="
exit "$EXIT"
