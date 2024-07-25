#!/bin/bash

# PostgreSQL superuser credentials
DB_SUPERUSER="$POSTGRES_USER"


create() {
  local DATABASE_NAME="$1"
  local SCHEMA_NAME="$2"
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

  # Connect to the specified database and check if the schema exists
  SCHEMA_EXISTS=$(psql -U "$DB_SUPERUSER" -d "$DATABASE_NAME" -tAc "SELECT schema_name FROM information_schema.schemata WHERE schema_name = '$SCHEMA_NAME'")

  if [ -z "$SCHEMA_EXISTS" ]; then
      # Schema does not exist, perform necessary steps
      echo "Schema '$SCHEMA_NAME' does not exist."

      # Connect to the new database and create the schema
      psql -U "$DB_SUPERUSER" -d "$DATABASE_NAME" -c "CREATE SCHEMA $SCHEMA_NAME;"

      # Create the new user
      psql -U "$DB_SUPERUSER" -d "$DATABASE_NAME" -c "CREATE USER $NEW_USER WITH PASSWORD '$NEW_PASS';"

      # Grant all privileges on the schema to the new user
      psql -U "$DB_SUPERUSER" -d "$DATABASE_NAME" -c "GRANT ALL PRIVILEGES ON SCHEMA $SCHEMA_NAME TO $NEW_USER;"
      psql -U "$DB_SUPERUSER" -d "$DATABASE_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA $SCHEMA_NAME GRANT ALL PRIVILEGES ON TABLES TO $NEW_USER;"
      psql -U "$DB_SUPERUSER" -d "$DATABASE_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA $SCHEMA_NAME GRANT ALL PRIVILEGES ON SEQUENCES TO $NEW_USER;"

      echo "Schema '$SCHEMA_NAME' created, and user '$NEW_USER' with all privileges has been created and granted privileges."
  else
      echo "Schema '$SCHEMA_NAME' already exists."
  fi
}

create "$HOPTIMISTEN_DATABASE_NAME" "$HOPTIMISTEN_SCHEMA_NAME" "$HOPTIMISTEN_SCHEMA_USER_NAME" "$HOPTIMISTEN_SCHEMA_USER_PW"
