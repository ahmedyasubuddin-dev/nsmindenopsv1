-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (profiles with roles)
-- Username is the login identifier and equals the role
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT, -- Optional, for notifications
  username TEXT UNIQUE NOT NULL, -- Primary login identifier (equals role)
  display_name TEXT,
  role TEXT NOT NULL,
  password_hash TEXT, -- Stored for username-based auth
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
  -- Note: username_equals_role constraint removed to allow flexibility during user creation
  -- Application code enforces this rule instead
);

-- Tapeheads submissions
CREATE TABLE IF NOT EXISTS tapeheads_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_name TEXT NOT NULL,
  shift INTEGER NOT NULL CHECK (shift IN (1, 2, 3)),
  th_number TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Approved', 'Requires Attention')),
  comments TEXT,
  lead_comments TEXT,
  shift_lead_name TEXT,
  shift_start_time TEXT,
  shift_end_time TEXT,
  hours_worked NUMERIC,
  total_meters NUMERIC NOT NULL DEFAULT 0,
  work_items JSONB,
  checklist JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Tapehead reviews
CREATE TABLE IF NOT EXISTS tapehead_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  shift INTEGER NOT NULL CHECK (shift IN (1, 2, 3)),
  shift_lead_name TEXT NOT NULL,
  ai_summary TEXT,
  final_comments TEXT,
  submission_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Pregger reports
CREATE TABLE IF NOT EXISTS pregger_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date TIMESTAMPTZ NOT NULL,
  shift TEXT NOT NULL,
  work_completed JSONB,
  personnel JSONB,
  downtime JSONB,
  briefing_items TEXT,
  current_work TEXT,
  operational_problems TEXT,
  personnel_notes TEXT,
  bonding_complete BOOLEAN,
  epa_report BOOLEAN,
  end_of_shift_checklist BOOLEAN,
  images JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Gantry reports
CREATE TABLE IF NOT EXISTS gantry_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date TIMESTAMPTZ NOT NULL,
  date DATE NOT NULL,
  shift TEXT NOT NULL,
  zone_assignment TEXT,
  zone_leads JSONB,
  personnel JSONB,
  molds JSONB,
  downtime JSONB,
  maintenance JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Films reports
CREATE TABLE IF NOT EXISTS films_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date TIMESTAMPTZ NOT NULL,
  gantry_number TEXT NOT NULL,
  sails_started JSONB,
  sails_finished JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Graphics tasks
CREATE TABLE IF NOT EXISTS graphics_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('cutting', 'inking')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'inProgress', 'done')),
  tag_id TEXT NOT NULL,
  content TEXT,
  tag_type TEXT CHECK (tag_type IN ('Sail', 'Decal')),
  sidedness TEXT CHECK (sidedness IN ('Single-Sided', 'Double-Sided')),
  side_of_work TEXT CHECK (side_of_work IN ('Port', 'Starboard')),
  work_types TEXT[],
  duration_mins INTEGER,
  personnel_count INTEGER,
  tape_used BOOLEAN,
  is_finished BOOLEAN,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- QC inspections
CREATE TABLE IF NOT EXISTS qc_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_date TIMESTAMPTZ NOT NULL,
  oe_number TEXT NOT NULL,
  inspector_name TEXT NOT NULL,
  total_score NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pass', 'Reinspection Required', 'Fail')),
  reinspection JSONB,
  metadata JSONB,
  defect_pictures JSONB,
  defect_scoring JSONB,
  lamination_vacuum_metrics JSONB,
  new_found_defects JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Jobs (OE jobs)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oe_base TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  sections JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Sail status
CREATE TABLE IF NOT EXISTS sail_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sail_id TEXT NOT NULL,
  status TEXT NOT NULL,
  department TEXT,
  current_stage TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Analytics snapshots (optional, for caching)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department TEXT,
  snapshot_date DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist (to allow re-running)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_tapeheads_submissions_updated_at ON tapeheads_submissions;
DROP TRIGGER IF EXISTS update_tapehead_reviews_updated_at ON tapehead_reviews;
DROP TRIGGER IF EXISTS update_pregger_reports_updated_at ON pregger_reports;
DROP TRIGGER IF EXISTS update_gantry_reports_updated_at ON gantry_reports;
DROP TRIGGER IF EXISTS update_films_reports_updated_at ON films_reports;
DROP TRIGGER IF EXISTS update_graphics_tasks_updated_at ON graphics_tasks;
DROP TRIGGER IF EXISTS update_qc_inspections_updated_at ON qc_inspections;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS update_sail_status_updated_at ON sail_status;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tapeheads_submissions_updated_at BEFORE UPDATE ON tapeheads_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tapehead_reviews_updated_at BEFORE UPDATE ON tapehead_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pregger_reports_updated_at BEFORE UPDATE ON pregger_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gantry_reports_updated_at BEFORE UPDATE ON gantry_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_films_reports_updated_at BEFORE UPDATE ON films_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_graphics_tasks_updated_at BEFORE UPDATE ON graphics_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qc_inspections_updated_at BEFORE UPDATE ON qc_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sail_status_updated_at BEFORE UPDATE ON sail_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();




