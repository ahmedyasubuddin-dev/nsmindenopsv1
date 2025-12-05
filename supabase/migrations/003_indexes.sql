-- Performance indexes for common queries

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- Tapeheads submissions indexes
CREATE INDEX IF NOT EXISTS idx_tapeheads_date ON tapeheads_submissions(date);
CREATE INDEX IF NOT EXISTS idx_tapeheads_shift ON tapeheads_submissions(shift);
CREATE INDEX IF NOT EXISTS idx_tapeheads_status ON tapeheads_submissions(status);
CREATE INDEX IF NOT EXISTS idx_tapeheads_operator ON tapeheads_submissions(operator_name);
CREATE INDEX IF NOT EXISTS idx_tapeheads_created_by ON tapeheads_submissions(created_by);
CREATE INDEX IF NOT EXISTS idx_tapeheads_date_shift ON tapeheads_submissions(date, shift);

-- Tapehead reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_date ON tapehead_reviews(date);
CREATE INDEX IF NOT EXISTS idx_reviews_shift ON tapehead_reviews(shift);
CREATE INDEX IF NOT EXISTS idx_reviews_date_shift ON tapehead_reviews(date, shift);

-- Pregger reports indexes
CREATE INDEX IF NOT EXISTS idx_pregger_date ON pregger_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_pregger_shift ON pregger_reports(shift);

-- Gantry reports indexes
CREATE INDEX IF NOT EXISTS idx_gantry_date ON gantry_reports(date);
CREATE INDEX IF NOT EXISTS idx_gantry_report_date ON gantry_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_gantry_shift ON gantry_reports(shift);

-- Films reports indexes
CREATE INDEX IF NOT EXISTS idx_films_date ON films_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_films_gantry ON films_reports(gantry_number);

-- Graphics tasks indexes
CREATE INDEX IF NOT EXISTS idx_graphics_status ON graphics_tasks(status);
CREATE INDEX IF NOT EXISTS idx_graphics_type ON graphics_tasks(type);
CREATE INDEX IF NOT EXISTS idx_graphics_tag_id ON graphics_tasks(tag_id);
CREATE INDEX IF NOT EXISTS idx_graphics_created_at ON graphics_tasks(created_at);

-- QC inspections indexes
CREATE INDEX IF NOT EXISTS idx_qc_date ON qc_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_qc_oe_number ON qc_inspections(oe_number);
CREATE INDEX IF NOT EXISTS idx_qc_status ON qc_inspections(status);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_oe_base ON jobs(oe_base);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Sail status indexes
CREATE INDEX IF NOT EXISTS idx_sail_status_sail_id ON sail_status(sail_id);
CREATE INDEX IF NOT EXISTS idx_sail_status_status ON sail_status(status);
CREATE INDEX IF NOT EXISTS idx_sail_status_department ON sail_status(department);

-- Analytics snapshots indexes
CREATE INDEX IF NOT EXISTS idx_analytics_department ON analytics_snapshots(department);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_analytics_department_date ON analytics_snapshots(department, snapshot_date);











