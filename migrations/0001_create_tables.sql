-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  target_audience JSONB,
  budget DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create creators table
CREATE TABLE IF NOT EXISTS creators (
  id SERIAL PRIMARY KEY,
  tiktok_username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  follower_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4),
  profile_data JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create browser_sessions table
CREATE TABLE IF NOT EXISTS browser_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_data JSONB,
  cookies JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Create automation_logs table
CREATE TABLE IF NOT EXISTS automation_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  action_type VARCHAR(100),
  target_user VARCHAR(255),
  status VARCHAR(50),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create campaign_creators table (junction table)
CREATE TABLE IF NOT EXISTS campaign_creators (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id INTEGER REFERENCES creators(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  message_sent_at TIMESTAMP,
  response_received_at TIMESTAMP,
  conversion_value DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, creator_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(tiktok_username);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_active ON browser_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_logs_session ON automation_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_campaign ON campaign_creators(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_creator ON campaign_creators(creator_id);

-- Add browser_sessions table for Puppeteer session management
CREATE TABLE IF NOT EXISTS "browser_sessions" (
  "id" SERIAL PRIMARY KEY,
  "session_id" VARCHAR(255) UNIQUE NOT NULL,
  "user_agent" TEXT,
  "cookies" TEXT,
  "local_storage" TEXT,
  "session_storage" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP
);

-- Add index for faster session lookups
CREATE INDEX IF NOT EXISTS "idx_browser_sessions_session_id" ON "browser_sessions" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_browser_sessions_is_active" ON "browser_sessions" ("is_active");