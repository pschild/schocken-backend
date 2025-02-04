#!/bin/bash

# PostgreSQL superuser credentials
DB_SUPERUSER="$POSTGRES_USER"


create() {
  local DATABASE_NAME="$1"
  local NEW_USER="$3"
  local NEW_PASS="$4"

  # Check if the schema exists
  DATABASE_EXISTS=$(psql -U "$DB_SUPERUSER" -tAc "SELECT datname FROM pg_database WHERE datname = '$DATABASE_NAME'")

  if [ -z "$DATABASE_EXISTS" ]; then
      # Database does not exist, perform necessary steps
      echo "Database '$DATABASE_NAME' does not exist."

      # Create the database
      psql -U "$DB_SUPERUSER" -c "CREATE DATABASE $DATABASE_NAME;"
  else
      echo "Database '$DATABASE_NAME' already exists."
  fi
}

create "$HOPTIMISTEN_DATABASE_NAME"
