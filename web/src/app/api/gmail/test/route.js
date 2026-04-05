// Test Gmail OAuth connection
export async function GET(request) {
  try {
    // Check if credentials exist
    if (!process.env.GMAIL_CLIENT_ID) {
      return Response.json(
        {
          success: false,
          error: "GMAIL_CLIENT_ID not set",
          step: "Add GMAIL_CLIENT_ID to your environment variables",
        },
        { status: 500 },
      );
    }

    if (!process.env.GMAIL_CLIENT_SECRET) {
      return Response.json(
        {
          success: false,
          error: "GMAIL_CLIENT_SECRET not set",
          step: "Add GMAIL_CLIENT_SECRET to your environment variables",
        },
        { status: 500 },
      );
    }

    if (!process.env.GMAIL_REFRESH_TOKEN) {
      return Response.json(
        {
          success: false,
          error: "GMAIL_REFRESH_TOKEN not set",
          step: "Add GMAIL_REFRESH_TOKEN to your environment variables",
        },
        { status: 500 },
      );
    }

    // Try to get access token
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: "Failed to get access token",
          details: data,
          step: "Check if your GMAIL_REFRESH_TOKEN is valid. You may need to generate a new one.",
        },
        { status: 401 },
      );
    }

    // Try to access Gmail API
    const gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1&q=from:info@account.netflix.com",
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      },
    );

    const gmailData = await gmailResponse.json();

    if (!gmailResponse.ok) {
      return Response.json(
        {
          success: false,
          error: "Gmail API access failed",
          details: gmailData,
          step: "Make sure your OAuth app has the correct Gmail scopes (https://www.googleapis.com/auth/gmail.readonly)",
        },
        { status: 403 },
      );
    }

    return Response.json({
      success: true,
      message: "Gmail OAuth is working correctly!",
      info: {
        hasMessages: gmailData.messages && gmailData.messages.length > 0,
        messageCount: gmailData.resultSizeEstimate || 0,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
