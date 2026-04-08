import sql from "@/app/api/utils/sql";

// GET /api/stats - Get statistics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    let stats;

    if (userId) {
      // Get stats for specific user
      stats = await sql`
        SELECT 
          s.action,
          s.count,
          s.last_used,
          u.name as user_name
        FROM statistics s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ${userId}
        ORDER BY s.last_used DESC
      `;
    } else {
      // Get all stats grouped by user
      stats = await sql`
        SELECT 
          s.user_id,
          u.name as user_name,
          json_agg(
            json_build_object(
              'action', s.action,
              'count', s.count,
              'last_used', s.last_used
            )
          ) as actions
        FROM statistics s
        JOIN users u ON s.user_id = u.id
        GROUP BY s.user_id, u.name
        ORDER BY u.name
      `;
    }

    return Response.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/stats - Increment stat counter
export async function POST(request) {
  try {
    const { user_id, action } = await request.json();

    if (!user_id || !action) {
      return Response.json(
        {
          success: false,
          error: "user_id and action are required",
        },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO statistics (user_id, action, count, last_used)
      VALUES (${user_id}, ${action}, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, action)
      DO UPDATE SET 
        count = statistics.count + 1,
        last_used = CURRENT_TIMESTAMP
    `;

    return Response.json({
      success: true,
      message: "Stat updated successfully",
    });
  } catch (error) {
    console.error("Error updating stats:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
