// Debug endpoint to check Gmail OAuth setup step by step
export async function GET(request) {
  try {
    const debug = {
      step1_env_vars: {
        client_id: process.env.GMAIL_CLIENT_ID ? "✅ Set" : "❌ Not set",
        client_id_value: process.env.GMAIL_CLIENT_ID || "NOT SET",
        client_secret: process.env.GMAIL_CLIENT_SECRET
          ? "✅ Set"
          : "❌ Not set",
        client_secret_prefix: process.env.GMAIL_CLIENT_SECRET
          ? process.env.GMAIL_CLIENT_SECRET.substring(0, 15) + "..."
          : "NOT SET",
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
          ? "✅ Set"
          : "❌ Not set",
        refresh_token_prefix: process.env.GMAIL_REFRESH_TOKEN
          ? process.env.GMAIL_REFRESH_TOKEN.substring(0, 30) + "..."
          : "NOT SET",
      },
    };

    // Check if all required env vars are set
    if (
      !process.env.GMAIL_CLIENT_ID ||
      !process.env.GMAIL_CLIENT_SECRET ||
      !process.env.GMAIL_REFRESH_TOKEN
    ) {
      return Response.json({
        success: false,
        error: "Missing environment variables",
        debug,
        next_step:
          "Set all 3 environment variables: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, then restart the app",
      });
    }

    // Try to get access token
    debug.step2_token_exchange = "Attempting...";

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      debug.step2_token_exchange = "❌ Failed";
      debug.error_from_google = {
        error: tokenData.error,
        error_description: tokenData.error_description,
        status: tokenResponse.status,
      };

      let nextStep = "Unknown error";
      if (tokenData.error === "invalid_grant") {
        nextStep =
          "Refresh token is INVALID or EXPIRED. Generate a NEW refresh token at /oauth2callback";
      } else if (tokenData.error === "invalid_client") {
        nextStep =
          "Client ID or Secret is WRONG. Make sure they match the credentials used to generate the refresh token";
      } else if (tokenData.error === "unauthorized_client") {
        nextStep =
          "OAuth client not authorized. Check Google Cloud Console settings";
      }

      return Response.json({
        success: false,
        error: "Failed to exchange refresh token for access token",
        debug,
        google_error: tokenData.error_description || tokenData.error,
        next_step: nextStep,
      });
    }

    debug.step2_token_exchange = "✅ Success";
    debug.access_token_obtained = tokenData.access_token
      ? "✅ Yes (length: " + tokenData.access_token.length + ")"
      : "❌ No";

    // Try to access Gmail API
    debug.step3_gmail_api = "Attempting...";

    const gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=from:info@account.netflix.com",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    const gmailData = await gmailResponse.json();

    if (!gmailResponse.ok) {
      debug.step3_gmail_api = "❌ Failed";
      debug.gmail_api_error = {
        error: gmailData.error,
        status: gmailResponse.status,
        message: gmailData.error?.message,
        code: gmailData.error?.code,
      };

      let nextStep = "Unknown Gmail API error";
      if (gmailData.error?.code === 403) {
        nextStep =
          "Gmail API is not enabled OR the scope is wrong. Make sure: 1) Gmail API is enabled in Google Cloud Console, 2) When generating refresh token, you used scope: https://www.googleapis.com/auth/gmail.readonly";
      } else if (gmailData.error?.code === 401) {
        nextStep =
          "Access token is invalid. This should not happen if step 2 succeeded.";
      }

      return Response.json({
        success: false,
        error: "Gmail API access denied",
        debug,
        gmail_error: gmailData.error?.message || "Unknown error",
        next_step: nextStep,
      });
    }

    debug.step3_gmail_api = "✅ Success";
    debug.gmail_data = {
      has_netflix_emails: gmailData.messages && gmailData.messages.length > 0,
      netflix_email_count: gmailData.messages?.length || 0,
      total_estimate: gmailData.resultSizeEstimate || 0,
      sample_message_ids:
        gmailData.messages?.slice(0, 2).map((m) => m.id) || [],
    };

    return Response.json({
      success: true,
      message: "🎉 Everything is working perfectly!",
      debug,
      summary: {
        env_vars: "✅ All set",
        token_exchange: "✅ Working",
        gmail_api: "✅ Working",
        netflix_emails:
          gmailData.messages && gmailData.messages.length > 0
            ? "✅ Found"
            : "⚠️ None found (but API is working)",
      },
      next_step: "Gmail is ready! Now set up Telegram bot at /setup",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        next_step: "Unexpected error occurred. Check the error details above.",
      },
      { status: 500 },
    );
  }
}
