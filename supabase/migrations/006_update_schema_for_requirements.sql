-- Update schema to match detailed requirements

-- 1. Pregger Reports: Add tape_id and meters_wasted
ALTER TABLE pregger_reports 
ADD COLUMN IF NOT EXISTS tape_id TEXT,
ADD COLUMN IF NOT EXISTS meters_produced NUMERIC,
ADD COLUMN IF NOT EXISTS meters_wasted NUMERIC;

-- 2. Tapeheads Submissions: Add tape_rolls and issues
-- Note: work_items can store panels, but we'll add specific columns for clarity if needed. 
-- For now, we'll assume work_items JSONB handles the detailed panel/tape logic, 
-- but we'll add a specific 'issues' column for downtime if it's not already in the JSON.
ALTER TABLE tapeheads_submissions
ADD COLUMN IF NOT EXISTS issues JSONB; -- For "Spin-Outs" and downtime

-- 3. Gantry Reports: Add sail_number and override_reason
ALTER TABLE gantry_reports
ADD COLUMN IF NOT EXISTS sail_number TEXT,
ADD COLUMN IF NOT EXISTS override_reason TEXT;

-- 4. Films Reports: Add gantry_assignment
-- This helps link finished sails to specific gantries
ALTER TABLE films_reports
ADD COLUMN IF NOT EXISTS gantry_assignment TEXT;

-- 5. Graphics Tasks: Ensure tag_id and status are sufficient (already present)

-- 6. Jobs: Ensure start/end panel numbers are tracked
-- We'll assume 'sections' JSONB in 'jobs' table holds the sail breakdown (Sail-001, Sail-002) and panel ranges.
