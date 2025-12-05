-- Create gantries table for validation
CREATE TABLE IF NOT EXISTS gantries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gantries ENABLE ROW LEVEL SECURITY;

-- Policies for gantries
CREATE POLICY "Anyone authenticated can view gantries"
  ON gantries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Superusers can manage gantries"
  ON gantries FOR ALL
  USING (is_superuser(auth.uid()));

-- Seed default gantries
INSERT INTO gantries (name) VALUES 
  ('Gantry 1'),
  ('Gantry 2'),
  ('Gantry 3')
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraint to films_reports
-- Note: We first need to ensure existing data is valid or update it. 
-- Since this is a fresh setup, we can just add the constraint.
-- However, 'gantry_assignment' in films_reports is TEXT. 
-- We can either change it to UUID references gantries(id) OR keep it TEXT and reference gantries(name).
-- referencing name is easier for readability and existing code that expects strings.

ALTER TABLE films_reports 
ADD CONSTRAINT fk_films_gantry_assignment
FOREIGN KEY (gantry_assignment) 
REFERENCES gantries(name)
ON UPDATE CASCADE;

-- Also add constraint to gantry_number in films_reports if it refers to a Gantry machine
ALTER TABLE films_reports
ADD CONSTRAINT fk_films_gantry_number
FOREIGN KEY (gantry_number)
REFERENCES gantries(name)
ON UPDATE CASCADE;
