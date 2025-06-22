
-- Initial database schema for TikTok Bot Friday
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  profile_picture VARCHAR(500),
  tiktok_session JSONB,
  settings JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  target_invitations INTEGER NOT NULL,
  daily_limit INTEGER NOT NULL DEFAULT 20,
  invitation_template TEXT NOT NULL,
  human_like_delays BOOLEAN DEFAULT true,
  ai_optimization BOOLEAN DEFAULT true,
  filters JSONB,
  sent_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creators (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  followers INTEGER,
  category TEXT,
  engagement_rate DECIMAL(5,2),
  gmv DECIMAL(12,2),
  profile_picture TEXT,
  is_verified BOOLEAN DEFAULT false,
  bio TEXT,
  profile_data JSONB,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_invitations (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
  creator_id INTEGER NOT NULL REFERENCES creators(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  invitation_text TEXT,
  sent_at TIMESTAMP,
  responded_at TIMESTAMP,
  response_text TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS browser_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  session_data JSONB,
  is_active BOOLEAN DEFAULT false,
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  campaign_id INTEGER REFERENCES campaigns(id),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_campaign_id ON campaign_invitations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invitations_creator_id ON campaign_invitations(creator_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_user_id ON browser_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_campaign_id ON activity_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(username);

-- Create default admin user if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    INSERT INTO users (username, email, password_hash, full_name, settings)
    VALUES (
      'admin',
      'admin@yourdomain.com',
      'change_me_after_deployment',
      'System Administrator',
      '{"theme": "dark", "notifications": true, "autoSave": true}'
    );
  END IF;
END $$;
