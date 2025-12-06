import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth-client";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@gitpad/api/routers/index";

/**
 * GitHub App Installation Setup URL Handler
 * 
 * This is the "Setup URL" for GitHub App installations (not the user authorization callback URL).
 * 
 * GitHub redirects here AFTER a user installs the app with these query parameters:
 * - installation_id: The ID of the installation
 * - setup_action: Either "install" or "update" (optional)
 * - state: Optional state parameter
 * 
 * IMPORTANT: According to GitHub docs, we should NOT trust the installation_id directly.
 * We must generate a user access token and verify the installation belongs to this user.
 * 
 * Flow:
 * 1. User installs GitHub App on GitHub
 * 2. GitHub redirects to this Setup URL with installation_id
 * 3. We verify user session
 * 4. We fetch installation details from GitHub API to verify it exists
 * 5. We store the installation in database
 * 6. Redirect to integrations page
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session using authClient
    const session = await authClient.getSession({
      fetchOptions: {
        headers: request.headers,
      },
    });

    if (!session) {
      // User is not logged in - redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", "/dashboard/integrations");
      console.error("[GitHub Setup] User not authenticated");
      return NextResponse.redirect(loginUrl);
    }

    // Extract query parameters from GitHub
    const searchParams = request.nextUrl.searchParams;
    const installationId = searchParams.get("installation_id");
    const setupAction = searchParams.get("setup_action") || "install"; // Default to "install"

    console.log("[GitHub Setup] Received callback:", {
      userId: session.data?.user.id,
      installationId,
      setupAction,
    });

    // Validate required parameters
    if (!installationId) {
      console.error("[GitHub Setup] Missing installation_id parameter");
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=missing_installation_id", request.url)
      );
    }

    // Create a server-side TRPC client with the current request's cookies
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      console.error("[GitHub Setup] NEXT_PUBLIC_SERVER_URL not configured");
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=server_misconfigured", request.url)
      );
    }

    // Get cookies from the request to pass to TRPC
    const cookieHeader = request.headers.get("cookie") || "";

    const apiClient = createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${serverUrl}/trpc`,
          headers: {
            cookie: cookieHeader,
          },
        }),
      ],
    });

    // Call TRPC mutation to verify and store the installation
    try {
      const result = await apiClient.github.handleInstallation.mutate({
        installationId,
        setupAction: setupAction as "install" | "update",
      });

      console.log("[GitHub Setup] Installation saved successfully:", {
        userId: session.data?.user.id,
        installationId,
        accountLogin: result.installation.accountLogin,
      });

      // Success - redirect to integrations page with success message
      return NextResponse.redirect(
        new URL("/dashboard/integrations?success=github_connected", request.url)
      );
    } catch (error) {
      console.error("[GitHub Setup] Failed to handle installation:", error);
      
      // Redirect with error
      return NextResponse.redirect(
        new URL("/dashboard/integrations?error=installation_failed", request.url)
      );
    }
  } catch (error) {
    console.error("[GitHub Setup] Callback error:", error);
    
    // Redirect with generic error
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=callback_failed", request.url)
    );
  }
}
