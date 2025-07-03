-- AI Logo Generator Database Schema
-- Database: PostgreSQL via Vercel Postgres

-- Users table for session management
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table for tracking user sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logo generations table for storing generation history
CREATE TABLE logo_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  brief TEXT NOT NULL,
  design_spec JSONB,
  final_svg TEXT,
  variants JSONB,
  guidelines_url TEXT,
  package_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- User feedback table
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES logo_generations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'logo', 'issue', 'suggestion'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System metrics table
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value FLOAT NOT NULL,
  tags JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_logo_generations_user_id ON logo_generations(user_id);
CREATE INDEX idx_logo_generations_status ON logo_generations(status);
CREATE INDEX idx_user_feedback_generation_id ON user_feedback(generation_id);
CREATE INDEX idx_system_metrics_name_timestamp ON system_metrics(metric_name, timestamp);
