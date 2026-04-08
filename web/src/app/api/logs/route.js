import sql from "@/app/api/utils/sql";

// GET /api/logs - Get activity logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let logs;
    let total;

    if (userId) {
      logs = await sql`
        SELECT *
        FROM activity_logs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countResult = await sql`
        SELECT COUNT(*) as total FROM activity_logs WHERE user_id = ${userId}
      `;
      total = parseInt(countResult[0].total);
    } else {
      logs = await sql`
        SELECT *
        FROM activity_logs
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countResult =
        await sql`SELECT COUNT(*) as total FROM activity_logs`;
      total = parseInt(countResult[0].total);
    }

    return Response.json({
      success: true,
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/logs - Create activity log
export async function POST(request) {
  try {
    const { user_id, user_name, action, target_email, success } =
      await request.json();

    if (!user_id || !user_name || !action || !target_email) {
      return Response.json(
        {
          success: false,
          error: "user_id, user_name, action, and target_email are required",
        },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO activity_logs (user_id, user_name, action, target_email, success)
      VALUES (${user_id}, ${user_name}, ${action}, ${target_email}, ${success || false})
    `;

    return Response.json({
      success: true,
      message: "Log created successfully",
    });
  } catch (error) {
    console.error("Error creating log:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
