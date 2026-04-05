// Helper to get access token from refresh token
async function getAccessToken() {
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
    throw new Error(`Failed to get access token: ${data.error}`);
  }

  return data.access_token;
}

// Helper to list Gmail messages
async function listMessages(accessToken, query, maxResults = 5) {
  const url = new URL(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
  );
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", maxResults.toString());

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to list messages: ${response.statusText}`);
  }

  return response.json();
}

// Helper to get a specific message
async function getMessage(accessToken, messageId) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to get message: ${response.statusText}`);
  }

  return response.json();
}

// Decode email body
function decodeEmailBody(payload) {
  let emailBody = "";

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
        if (part.body && part.body.data) {
          emailBody += Buffer.from(part.body.data, "base64").toString("utf-8");
        }
      }
      if (part.parts) {
        for (const subPart of part.parts) {
          if (subPart.body && subPart.body.data) {
            emailBody += Buffer.from(subPart.body.data, "base64").toString(
              "utf-8",
            );
          }
        }
      }
    }
  } else if (payload.body && payload.body.data) {
    emailBody = Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  return emailBody;
}

// GET /api/gmail/debug - Debug email content
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get("email");

    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
      return Response.json(
        {
          success: false,
          error: "Gmail credentials not configured",
        },
        { status: 500 },
      );
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Build search query
    let query = "from:info@account.netflix.com";
    if (targetEmail) {
      query += ` to:${targetEmail}`;
    }

    // Search for emails
    const listResponse = await listMessages(accessToken, query, 5);

    if (!listResponse.messages || listResponse.messages.length === 0) {
      return Response.json(
        {
          success: false,
          error: "No Netflix email found",
        },
        { status: 404 },
      );
    }

    // Get the latest message
    const messageId = listResponse.messages[0].id;
    const message = await getMessage(accessToken, messageId);

    // Extract headers
    const headers = message.payload.headers;
    const subject =
      headers.find((h) => h.name.toLowerCase() === "subject")?.value || "";
    const from =
      headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
    const date =
      headers.find((h) => h.name.toLowerCase() === "date")?.value || "";

    // Decode email body
    const emailBody = decodeEmailBody(message.payload);

    // Test all patterns
    const patterns = {
      pattern1:
        emailBody.match(/(?:code|kode)[\s:]+([A-Z0-9]{4,8})/i)?.[1] || null,
      pattern2:
        emailBody.match(/(?:^|\n|\>)\s*([A-Z0-9]{6,8})\s*(?:\n|\<|$)/im)?.[1] ||
        null,
      pattern3:
        emailBody.match(
          /verification\s+code\s+(?:is|:)?\s*([A-Z0-9]{4,8})/i,
        )?.[1] || null,
      pattern4:
        emailBody.match(
          /<(?:b|strong)[^>]*>([A-Z0-9]{6,8})<\/(?:b|strong)>/i,
        )?.[1] || null,
      pattern5:
        emailBody.match(
          /(?:here'?s?\s+(?:your\s+)?code|your\s+code\s+is)[\s:]+([A-Z0-9]{4,8})/i,
        )?.[1] || null,
    };

    return Response.json({
      success: true,
      debug: {
        subject,
        from,
        date,
        bodyLength: emailBody.length,
        fullBody: emailBody,
        patterns,
      },
    });
  } catch (error) {
    console.error("Error debugging Gmail:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// POST /api/gmail/debug - Debug email content (for UI)
export async function POST(request) {
  try {
    const { target_email, max_age_seconds = 1800 } = await request.json();

    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_REFRESH_TOKEN) {
      return Response.json(
        {
          success: false,
          error: "Gmail credentials not configured",
        },
        { status: 500 },
      );
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Build search query
    let query = "from:info@account.netflix.com";
    if (target_email) {
      query += ` to:${target_email}`;
    }

    // Add time filter
    if (max_age_seconds) {
      const afterDate = new Date(Date.now() - max_age_seconds * 1000);
      const afterTimestamp = Math.floor(afterDate.getTime() / 1000);
      query += ` after:${afterTimestamp}`;
    }

    console.log("🔍 Search query:", query);

    // Search for emails
    const listResponse = await listMessages(accessToken, query, 5);

    if (!listResponse.messages || listResponse.messages.length === 0) {
      return Response.json(
        {
          success: false,
          error: `No Netflix email found for ${target_email} in the last ${Math.floor(max_age_seconds / 60)} minutes`,
          query: query,
        },
        { status: 404 },
      );
    }

    // Get the latest message
    const messageId = listResponse.messages[0].id;
    const message = await getMessage(accessToken, messageId);

    // Extract headers
    const headers = message.payload.headers;
    const subject =
      headers.find((h) => h.name.toLowerCase() === "subject")?.value || "";
    const from =
      headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
    const date =
      headers.find((h) => h.name.toLowerCase() === "date")?.value || "";

    // Decode email body
    const emailBody = decodeEmailBody(message.payload);

    // Test all patterns - PRIORITIZE NUMERIC CODES
    const debugMatches = {
      pattern1_enter_this_code:
        emailBody.match(
          /(?:Enter\s+this\s+code|code\s+to\s+sign\s*in)[^\d]*(\d{4,8})/i,
        )?.[1] || null,
      pattern2_standalone_digits:
        emailBody.match(/\n\s*(\d{4,8})\s*\n/)?.[1] || null,
      pattern3_code_keyword_digits:
        emailBody.match(/(?:code|kode)[\s:]*(\d{4,8})/i)?.[1] || null,
      pattern4_code_keyword_alphanumeric:
        emailBody.match(/(?:code|kode)[\s:]*([A-Z0-9]{6,8})/i)?.[1] || null,
      pattern5_newline_alphanumeric:
        emailBody.match(/(?:^|\n|\>)\s*([A-Z0-9]{6,8})\s*(?:\n|\<|$)/im)?.[1] ||
        null,
      pattern6_any_alphanumeric:
        emailBody.match(/\b([A-Z0-9]{6,8})\b/)?.[1] || null,
    };

    // Pick the first NUMERIC match, then fallback to alphanumeric
    let sign_in_code =
      debugMatches.pattern1_enter_this_code ||
      debugMatches.pattern2_standalone_digits ||
      debugMatches.pattern3_code_keyword_digits;

    // Fallback to alphanumeric if no numeric code found
    if (!sign_in_code) {
      sign_in_code =
        debugMatches.pattern4_code_keyword_alphanumeric ||
        debugMatches.pattern5_newline_alphanumeric ||
        debugMatches.pattern6_any_alphanumeric;

      // Only accept alphanumeric if it contains at least one digit
      if (sign_in_code && !/\d/.test(sign_in_code)) {
        sign_in_code = null;
      }
    }

    return Response.json({
      success: true,
      data: {
        subject,
        from,
        date,
        sign_in_code,
        reset_link:
          emailBody.match(
            /(https:\/\/www\.netflix\.com\/password-reset[^\s<>"']+)/i,
          )?.[1] || null,
        household_link:
          emailBody.match(
            /(https:\/\/www\.netflix\.com\/account\/household[^\s<>"']+)/i,
          )?.[1] || null,
      },
      raw_body: emailBody,
      debug_matches: debugMatches,
      total_emails_found: listResponse.messages.length,
    });
  } catch (error) {
    console.error("Error debugging Gmail:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
