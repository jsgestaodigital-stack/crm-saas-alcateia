-- Create trigger to auto-grant super admin for João's second email
CREATE OR REPLACE FUNCTION public.auto_grant_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('jsgestaodigital@gmail.com') THEN
    INSERT INTO user_permissions (user_id, is_super_admin)
    VALUES (NEW.id, true)
    ON CONFLICT (user_id) DO UPDATE SET is_super_admin = true;
    
    -- Also add to Rankeia agency as admin
    INSERT INTO agency_members (user_id, agency_id, role)
    VALUES (NEW.id, 'abfbad17-8cf0-445f-8c0e-aca6ca64c606', 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_super_admin_signup ON auth.users;
CREATE TRIGGER on_super_admin_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_grant_super_admin();