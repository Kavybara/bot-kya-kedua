// GET /api/telegram/setup - Setup webhook
export async function GET(request) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!TELEGRAM_BOT_TOKEN) {
      return Response.json(
        {
          success: false,
          error: "TELEGRAM_BOT_TOKEN not configured",
        },
        { status: 500 },
      );
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_CREATE_APP_URL}/api/telegram/webhook`;

    // Set webhook
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      },
    );

    const data = await response.json();

    if (data.ok) {
      return Response.json({
        success: true,
        message: "Webhook configured successfully",
        webhook_url: webhookUrl,
      });
    } else {
      return Response.json(
        {
          success: false,
          error: data.description,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error setting up webhook:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// DELETE /api/telegram/setup - Remove webhook
export async function DELETE(request) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!TELEGRAM_BOT_TOKEN) {
      return Response.json(
        {
          success: false,
          error: "TELEGRAM_BOT_TOKEN not configured",
        },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`,
      { method: "POST" },
    );

    const data = await response.json();

    if (data.ok) {
      return Response.json({
        success: true,
        message: "Webhook removed successfully",
      });
    } else {
      return Response.json(
        {
          success: false,
          error: data.description,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error removing webhook:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
