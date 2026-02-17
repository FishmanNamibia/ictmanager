-- Create database and user for I-ICTMS
-- Run as PostgreSQL superuser (e.g. postgres):
--   psql -U postgres -f scripts/create-db.sql
-- On Windows (cmd): psql -U postgres -f backend\scripts\create-db.sql

-- Create user 'root' with password (change 'root' to your desired password in production)
CREATE USER root WITH PASSWORD 'root';

-- Create database owned by root
CREATE DATABASE iictms OWNER root;

-- Allow root to create extensions (needed for uuid-ossp in migrations)
ALTER USER root WITH SUPERUSER;

-- Or, if you prefer not to use SUPERUSER, grant only what's needed:
-- GRANT ALL PRIVILEGES ON DATABASE iictms TO root;
-- \c iictms
-- GRANT ALL ON SCHEMA public TO root;
