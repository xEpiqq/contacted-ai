import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  // Create a Supabase server client.
  const supabase = await createClient();

  // Authenticate the user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    // If the user is not authenticated, redirect to the sign-in page.
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Update the user's profile: set trial_pending to false.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ trial_pending: false })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Error updating trial_pending for user", user.id, updateError);
    // Optionally, redirect to an error page if updating fails.
    return NextResponse.redirect(new URL("/error", request.url));
  }

  // After updating the profile, redirect the user to the /protected/usa page.
  return NextResponse.redirect(new URL("/protected/usa", request.url));
}
