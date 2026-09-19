#!/bin/bash
# Creates one Postgres database per name in POSTGRES_MULTIPLE_DATABASES,
# so a single shared postgres container can serve listmonk + evolution-api
# without either touching the Supabase project (which stays the platform's
# own source of truth for customers/campaigns/messages).
set -e

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
  IFS=',' read -ra DBS <<< "$POSTGRES_MULTIPLE_DATABASES"
  for db in "${DBS[@]}"; do
    echo "Creating database: $db"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
      SELECT 'CREATE DATABASE "$db"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
  done
fi
