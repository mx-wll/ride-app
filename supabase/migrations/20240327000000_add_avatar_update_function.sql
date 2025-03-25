-- Create an RPC function to update a user's avatar URL
-- This function will be called from the client to ensure direct DB updating
CREATE OR REPLACE FUNCTION update_user_avatar(
  user_id uuid,  
  avatar_url_param text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Update the avatar_url for the given user
  UPDATE users
  SET 
    avatar_url = avatar_url_param,
    updated_at = now()
  WHERE id = user_id;
  
  -- Return result indicating success
  SELECT json_build_object(
    'success', true,
    'user_id', user_id,
    'avatar_url', avatar_url_param,
    'updated_at', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_avatar TO authenticated;

-- Make sure the users table has an updated_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$; 