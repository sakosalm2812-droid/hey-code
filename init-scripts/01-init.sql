-- HEY Database Initialization Script
-- This runs on first container startup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAUSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('FREE', 'PRO', 'TEAM', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE chat_model AS ENUM ('GPT_4O', 'GPT_4O_MINI', 'GPT_4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'CLAUDE_3_HAIKU');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE team_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
-- These will be created by Prisma migrations, but we can add some here

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE hey TO hey;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hey;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hey;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hey;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hey;