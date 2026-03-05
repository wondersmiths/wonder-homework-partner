import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STUDENT_EMAIL_DOMAIN = "students.wondermentorship.local";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase not configured");
  }
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { username, pin } = await req.json();

    if (!username || !pin) {
      return NextResponse.json(
        { error: "Username and PIN are required." },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Look up the student by username
    const { data: student, error: lookupError } = await supabaseAdmin
      .from("students")
      .select("id, name, pin, user_id, parent_id")
      .eq("username", trimmedUsername)
      .single();

    if (lookupError || !student) {
      return NextResponse.json(
        { error: "Invalid username or PIN." },
        { status: 401 }
      );
    }

    // Verify PIN
    if (student.pin !== pin) {
      return NextResponse.json(
        { error: "Invalid username or PIN." },
        { status: 401 }
      );
    }

    const email = `${trimmedUsername}@${STUDENT_EMAIL_DOMAIN}`;
    const password = `pin_${student.id}_${pin}`;

    // If student doesn't have a user_id yet, create the Supabase auth user
    if (!student.user_id) {
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role: "student", full_name: student.name },
        });

      if (createError) {
        console.error("Failed to create student auth user:", createError);
        return NextResponse.json(
          { error: "Failed to set up student account." },
          { status: 500 }
        );
      }

      // Profile is auto-created by the on_auth_user_created trigger.
      // Link student record to the new auth user.
      await supabaseAdmin
        .from("students")
        .update({ user_id: newUser.user.id })
        .eq("id", student.id);
    }

    // Sign in and return session data
    // We use the anon client from the browser side, so return credentials for client-side sign-in
    return NextResponse.json({
      success: true,
      email,
      password,
      studentId: student.id,
    });
  } catch (error) {
    console.error("Student login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
