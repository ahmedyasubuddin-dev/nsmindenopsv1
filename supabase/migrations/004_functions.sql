-- Database functions for complex operations

-- Function to sync user from auth.users to public.users
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_role TEXT;
BEGIN
  -- Extract username and role from metadata
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tapehead_operator');
  
  -- Ensure username equals role (normalize both)
  IF v_username != v_role THEN
    v_username := v_role;
  END IF;
  
  INSERT INTO public.users (id, email, username, display_name, role, active, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    v_role,
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (to allow re-running)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to sync user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile();

-- Function to update last_login_at
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get analytics data for a department
CREATE OR REPLACE FUNCTION get_department_analytics(
  dept_name TEXT,
  start_date DATE,
  end_date DATE
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  CASE dept_name
    WHEN 'Tapeheads' THEN
      SELECT jsonb_build_object(
        'total_meters', COALESCE(SUM(total_meters), 0),
        'total_submissions', COUNT(*),
        'by_shift', jsonb_agg(
          jsonb_build_object(
            'shift', shift,
            'total_meters', SUM(total_meters),
            'count', COUNT(*)
          )
        )
      )
      INTO result
      FROM tapeheads_submissions
      WHERE date BETWEEN start_date AND end_date;
    
    WHEN 'Pregger' THEN
      SELECT jsonb_build_object(
        'total_reports', COUNT(*),
        'by_shift', jsonb_agg(
          jsonb_build_object(
            'shift', shift,
            'count', COUNT(*)
          )
        )
      )
      INTO result
      FROM pregger_reports
      WHERE report_date::date BETWEEN start_date AND end_date;
    
    WHEN 'Gantry' THEN
      SELECT jsonb_build_object(
        'total_reports', COUNT(*),
        'by_shift', jsonb_agg(
          jsonb_build_object(
            'shift', shift,
            'count', COUNT(*)
          )
        )
      )
      INTO result
      FROM gantry_reports
      WHERE date BETWEEN start_date AND end_date;
    
    ELSE
      result := '{}'::jsonb;
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



