-- Migration: Add trigger/function to sync storage uploads to files and file_workspaces
-- Date: 2025-06-12

-- 1. Remove old trigger/function if they exist
DROP TRIGGER IF EXISTS storage_object_insert_files_trigger ON storage.objects;
DROP FUNCTION IF EXISTS storage_object_insert_files_fn;

-- 2. Create new function to insert into files and file_workspaces
CREATE OR REPLACE FUNCTION storage_object_insert_files_and_workspaces_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_workspace_id uuid;
  v_file_id uuid;
BEGIN
  -- Extract user_id from the file path: files/{user_id}/{filename}
  v_user_id := (regexp_matches(NEW.name, '^files/([^/]+)/'))[1];

  -- Find the user's home workspace
  SELECT id INTO v_workspace_id FROM workspaces WHERE user_id = v_user_id AND is_home = true LIMIT 1;

  -- Insert into files table
  INSERT INTO files (
    user_id, name, file_path, size, type, description, tokens, sharing, created_at
  ) VALUES (
    v_user_id,
    split_part(NEW.name, '/', 3), -- filename
    NEW.name,
    (NEW.metadata->>'size')::int,
    NEW.metadata->>'mimetype',
    '', -- description
    0,  -- tokens
    'private',
    NOW()
  )
  RETURNING id INTO v_file_id;

  -- Insert into file_workspaces table
  INSERT INTO file_workspaces (
    user_id, file_id, workspace_id, created_at
  ) VALUES (
    v_user_id, v_file_id, v_workspace_id, NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
CREATE TRIGGER storage_object_insert_files_trigger
AFTER INSERT ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'files')
EXECUTE FUNCTION storage_object_insert_files_and_workspaces_fn();
