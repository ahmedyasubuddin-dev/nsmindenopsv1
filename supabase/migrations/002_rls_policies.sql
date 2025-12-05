-- Enable Row Level Security on all tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tapeheads_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tapehead_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pregger_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gantry_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS films_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS graphics_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS qc_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sail_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is superuser (bypasses RLS)
CREATE OR REPLACE FUNCTION is_superuser(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = check_user_id AND role = 'superuser'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Superusers can view all users" ON users;
DROP POLICY IF EXISTS "Superusers can manage all users" ON users;

-- Users table policies
-- Note: These policies avoid querying users table directly to prevent infinite recursion
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Superuser policies use SECURITY DEFINER function to avoid recursion
CREATE POLICY "Superusers can view all users"
  ON users FOR SELECT
  USING (is_superuser(auth.uid()));

CREATE POLICY "Superusers can manage all users"
  ON users FOR ALL
  USING (is_superuser(auth.uid()));

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone authenticated can view tapeheads submissions" ON tapeheads_submissions;
DROP POLICY IF EXISTS "Users can create tapeheads submissions" ON tapeheads_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions or leads can update any" ON tapeheads_submissions;
DROP POLICY IF EXISTS "Leads and superusers can delete submissions" ON tapeheads_submissions;

-- Tapeheads submissions policies
CREATE POLICY "Anyone authenticated can view tapeheads submissions"
  ON tapeheads_submissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create tapeheads submissions"
  ON tapeheads_submissions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own submissions or leads can update any"
  ON tapeheads_submissions FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('tapehead_lead', 'b2_supervisor', 'superuser')
    )
  );

CREATE POLICY "Leads and superusers can delete submissions"
  ON tapeheads_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('tapehead_lead', 'b2_supervisor', 'superuser')
    )
  );

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone authenticated can view reviews" ON tapehead_reviews;
DROP POLICY IF EXISTS "Leads can create reviews" ON tapehead_reviews;
DROP POLICY IF EXISTS "Leads can update reviews" ON tapehead_reviews;

-- Tapehead reviews policies
CREATE POLICY "Anyone authenticated can view reviews"
  ON tapehead_reviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Leads can create reviews"
  ON tapehead_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('tapehead_lead', 'b2_supervisor', 'superuser')
    )
  );

CREATE POLICY "Leads can update reviews"
  ON tapehead_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('tapehead_lead', 'b2_supervisor', 'superuser')
    )
  );

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone authenticated can view pregger reports" ON pregger_reports;
DROP POLICY IF EXISTS "Leads can manage pregger reports" ON pregger_reports;

-- Pregger reports policies
CREATE POLICY "Anyone authenticated can view pregger reports"
  ON pregger_reports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Leads can manage pregger reports"
  ON pregger_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('pregger_lead', 'b2_supervisor', 'superuser')
    )
  );

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone authenticated can view gantry reports" ON gantry_reports;
DROP POLICY IF EXISTS "Leads can manage gantry reports" ON gantry_reports;
DROP POLICY IF EXISTS "Anyone authenticated can view films reports" ON films_reports;
DROP POLICY IF EXISTS "Leads can manage films reports" ON films_reports;
DROP POLICY IF EXISTS "Anyone authenticated can view graphics tasks" ON graphics_tasks;
DROP POLICY IF EXISTS "Leads can manage graphics tasks" ON graphics_tasks;
DROP POLICY IF EXISTS "Anyone authenticated can view QC inspections" ON qc_inspections;
DROP POLICY IF EXISTS "Quality managers can manage QC inspections" ON qc_inspections;
DROP POLICY IF EXISTS "Anyone authenticated can view jobs" ON jobs;
DROP POLICY IF EXISTS "Superusers and supervisors can manage jobs" ON jobs;
DROP POLICY IF EXISTS "Anyone authenticated can view sail status" ON sail_status;
DROP POLICY IF EXISTS "Authenticated users can manage sail status" ON sail_status;
DROP POLICY IF EXISTS "Anyone authenticated can view analytics" ON analytics_snapshots;
DROP POLICY IF EXISTS "Superusers can manage analytics" ON analytics_snapshots;

-- Gantry reports policies
CREATE POLICY "Anyone authenticated can view gantry reports"
  ON gantry_reports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Leads can manage gantry reports"
  ON gantry_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('gantry_lead', 'b1_supervisor', 'superuser')
    )
  );

-- Films reports policies
CREATE POLICY "Anyone authenticated can view films reports"
  ON films_reports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Leads can manage films reports"
  ON films_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('films_lead', 'b1_supervisor', 'superuser')
    )
  );

-- Graphics tasks policies
CREATE POLICY "Anyone authenticated can view graphics tasks"
  ON graphics_tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Leads can manage graphics tasks"
  ON graphics_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('graphics_lead', 'b1_supervisor', 'superuser')
    )
  );

-- QC inspections policies
CREATE POLICY "Anyone authenticated can view QC inspections"
  ON qc_inspections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Quality managers can manage QC inspections"
  ON qc_inspections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('quality_manager', 'superuser')
    )
  );

-- Jobs policies
CREATE POLICY "Anyone authenticated can view jobs"
  ON jobs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Superusers and supervisors can manage jobs"
  ON jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('superuser', 'b1_supervisor', 'b2_supervisor', 'management')
    )
  );

-- Sail status policies
CREATE POLICY "Anyone authenticated can view sail status"
  ON sail_status FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage sail status"
  ON sail_status FOR ALL
  USING (auth.role() = 'authenticated');

-- Analytics snapshots policies
CREATE POLICY "Anyone authenticated can view analytics"
  ON analytics_snapshots FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Superusers can manage analytics"
  ON analytics_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );



