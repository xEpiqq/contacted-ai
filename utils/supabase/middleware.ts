import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user } } = await supabase.auth.getUser();

    // If root or other protected routes and user is not authenticated
    if (
      (request.nextUrl.pathname === "/" || 
       request.nextUrl.pathname.startsWith("/protected")) && 
      !user
    ) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Check if the user has completed onboarding
    if (user && 
        request.nextUrl.pathname !== "/onboarding" && 
        !request.nextUrl.pathname.startsWith("/_next") &&
        !request.nextUrl.pathname.startsWith("/auth") &&
        !request.nextUrl.pathname.startsWith("/sign-")) {
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();

      // Redirect to onboarding if not completed
      if (profile && profile.onboarding_completed === false) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }

    // If user is already authenticated and tries to access auth pages
    if (
      (request.nextUrl.pathname === "/sign-in" || 
       request.nextUrl.pathname === "/sign-up" || 
       request.nextUrl.pathname === "/forgot-password") && 
      user
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
