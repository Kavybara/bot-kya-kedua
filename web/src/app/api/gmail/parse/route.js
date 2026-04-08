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

// Parse Netflix email content
function parseNetflixEmail(emailBody) {
  const result = {
    sign_in_code: null,
    reset_link: null,
    household_link: null,
    temporary_access_link: null, // NEW: for travel/temporary access
    subject: null,
    from: null,
    date: null,
  };

  // Extract sign-in code - PRIORITIZE NUMERIC CODES (Netflix uses 4-8 digits)

  // Pattern 1: Digits after "Enter this code" or "code to sign in"
  let codeMatch = emailBody.match(
    /(?:Enter\s+this\s+code|code\s+to\s+sign\s*in)[^\d]*(\d{4,8})/i,
  );
  if (codeMatch) {
    result.sign_in_code = codeMatch[1];
  }

  // Pattern 2: Standalone digits on their own line
  if (!result.sign_in_code) {
    codeMatch = emailBody.match(/\n\s*(\d{4,8})\s*\n/);
    if (codeMatch) {
      result.sign_in_code = codeMatch[1];
    }
  }

  // Pattern 3: Digits after "code" or "kode" keyword
  if (!result.sign_in_code) {
    codeMatch = emailBody.match(/(?:code|kode)[\s:]*(\d{4,8})/i);
    if (codeMatch) {
      result.sign_in_code = codeMatch[1];
    }
  }

  // Pattern 4: Alphanumeric code (fallback for other Netflix emails)
  if (!result.sign_in_code) {
    codeMatch = emailBody.match(/(?:code|kode)[\s:]*([A-Z0-9]{6,8})/i);
    if (codeMatch && /\d/.test(codeMatch[1])) {
      // Only accept if it contains at least one digit
      result.sign_in_code = codeMatch[1];
    }
  }

  // Extract reset password link
  const resetMatch = emailBody.match(
    /(https:\/\/www\.netflix\.com\/password-reset[^\s<>"')\]]+)/i,
  );
  if (resetMatch) {
    result.reset_link = resetMatch[1];
  }

  // Extract household link
  const householdMatch = emailBody.match(
    /(https:\/\/www\.netflix\.com\/account\/household[^\s<>"')\]]+)/i,
  );
  if (householdMatch) {
    result.household_link = householdMatch[1];
  }

  // Extract temporary access link (for travel/temporary access outside household)
  const tempAccessMatch = emailBody.match(
    /(https:\/\/www\.netflix\.com\/account\/travel\/verify[^\s<>"')\]]+)/i,
  );
  if (tempAccessMatch) {
    result.temporary_access_link = tempAccessMatch[1];
  }

  return result;
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

// POST /api/gmail/parse - Get latest Netflix email
export async function POST(request) {
  try {
    const {
      target_email,
      max_age_seconds = 900,
      required_field,
    } = await request.json();

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
    const headers = message.data.payload.headers;
    const subject =
      headers.find((h) => h.name.toLowerCase() === "subject")?.value || "";
    const from =
      headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
    const date =
      headers.find((h) => h.name.toLowerCase() === "date")?.value || "";

    // Decode and parse email body
    const emailBody = decodeEmailBody(message.data.payload);
    // Log for debugging
    console.log("📧 Email found:", {
      subject,
      from,
      date,
      bodyLength: emailBody.length,
      preview: emailBody.substring(0, 300),
    });
    const parsed = parseNetflixEmail(emailBody);
    // Log for debugging
    console.log("🔍 Parsed result:", {
      hasCode: !!parsed.sign_in_code,
      hasResetLink: !!parsed.reset_link,
      hasHouseholdLink: !!parsed.household_link,
    });

    parsed.subject = subject;
    parsed.from = from;
    parsed.date = date;

    // Check if required field is present
    if (required_field && !parsed[required_field]) {
      return Response.json(
        {
          success: false,
          error: `Required field '${required_field}' not found in email`,
        },
        { status: 404 },
      );
    }

    return Response.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Error parsing Gmail:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
