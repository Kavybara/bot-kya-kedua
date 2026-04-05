import sql from "@/app/api/utils/sql";

// GET /api/pins?user_id=123 - Get user's PINs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return Response.json(
        { success: false, error: "user_id is required" },
        { status: 400 },
      );
    }

    const pins = await sql`
      SELECT id, profile_name, pin, created_at, updated_at
      FROM pins
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return Response.json({ success: true, pins });
  } catch (error) {
    console.error("Error fetching PINs:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/pins - Save/Update PIN
export async function POST(request) {
  try {
    const { user_id, profile_name, pin } = await request.json();

    if (!user_id || !profile_name || !pin) {
      return Response.json(
        {
          success: false,
          error: "user_id, profile_name, and pin are required",
        },
        { status: 400 },
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return Response.json(
        {
          success: false,
          error: "PIN must be 4 digits",
        },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO pins (user_id, profile_name, pin, updated_at)
      VALUES (${user_id}, ${profile_name}, ${pin}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, profile_name)
      DO UPDATE SET pin = ${pin}, updated_at = CURRENT_TIMESTAMP
    `;

    return Response.json({ success: true, message: "PIN saved successfully" });
  } catch (error) {
    console.error("Error saving PIN:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/pins - Delete PIN
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const profileName = searchParams.get("profile_name");

    if (!userId || !profileName) {
      return Response.json(
        {
          success: false,
          error: "user_id and profile_name are required",
        },
        { status: 400 },
      );
    }

    await sql`
      DELETE FROM pins 
      WHERE user_id = ${userId} AND profile_name = ${profileName}
    `;

    return Response.json({
      success: true,
      message: "PIN deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting PIN:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
