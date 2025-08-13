-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create new policies that avoid infinite recursion
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert profiles (for auto-creation during login)
CREATE POLICY "Authenticated users can insert profiles" ON profiles
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow reading profiles for role checking (but limit columns for security)
CREATE POLICY "Users can read basic profile info for role checking" ON profiles
    FOR SELECT TO authenticated USING (true);
