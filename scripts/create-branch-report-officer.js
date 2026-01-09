/**
 * Migration Script: Create Branch Report Officer User
 *
 * This script permanently adds the branchreportofficer@gmail.com user to:
 * 1. Supabase Auth (for login)
 * 2. profiles table (for role and permissions)
 *
 * Run with: node scripts/create-branch-report-officer.js
 */

const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createBranchReportOfficer() {
  try {
    console.log("Creating branch report officer user...")

    const email = "branchreportofficer@gmail.com"
    const password = "BranchReportOfficer@2024!" // Secure default password
    const fullName = "Branch Report Officer"

    // Step 1: Create auth user
    console.log(`Step 1: Creating auth user for ${email}...`)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      // Check if user already exists
      if (authError.message.includes("already exists")) {
        console.log(`User ${email} already exists in Auth. Skipping auth creation.`)
      } else {
        console.error("Error creating auth user:", authError)
        process.exit(1)
      }
    } else {
      console.log(`Auth user created successfully: ${authUser.user.id}`)
    }

    // Get the user ID (either new or existing)
    let userId
    if (authUser?.user?.id) {
      userId = authUser.user.id
    } else {
      // User already exists, fetch their ID
      const { data: existingUser, error: fetchError } = await supabase.auth.admin.listUsers()
      if (fetchError) {
        console.error("Error fetching existing user:", fetchError)
        process.exit(1)
      }
      const user = existingUser?.users?.find((u) => u.email === email)
      if (!user) {
        console.error(`Could not find user ${email} in Auth`)
        process.exit(1)
      }
      userId = user.id
      console.log(`Found existing user: ${userId}`)
    }

    // Step 2: Create profile
    console.log("Step 2: Creating user profile...")
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          role: "branch_report_officer",
          status: "active",
        },
        { onConflict: "id" },
      )
      .select()
      .single()

    if (profileError) {
      console.error("Error creating profile:", profileError)
      process.exit(1)
    }

    console.log("Profile created successfully:", profile)

    // Step 3: Verify login works
    console.log("\nStep 3: Verifying login credentials...")
    const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      console.error("Error testing login:", loginError)
    } else {
      console.log("Login test successful!")
      console.log(`\nUser Details:`)
      console.log(`  Email: ${email}`)
      console.log(`  Role: branch_report_officer`)
      console.log(`  Status: active`)
      console.log(`  User ID: ${userId}`)
    }

    console.log("\n✅ Branch Report Officer user created/verified successfully!")
    console.log(`\nYou can now login with:`)
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
  } catch (error) {
    console.error("Unexpected error:", error)
    process.exit(1)
  }
}

// Run the script
createBranchReportOfficer()
