import sql from "@/app/api/utils/sql";

// GET /api/users - List all users (admin only)
export async function GET(request) {
  try {
    const users = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.language, 
        u.is_admin, 
        u.created_at,
        COALESCE(
          json_agg(
            p.permission
          ) FILTER (WHERE p.permission IS NOT NULL), 
          '[]'
        ) as permissions
      FROM users u
      LEFT JOIN permissions p ON u.id = p.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;

    return Response.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// POST /api/users - Create new user
export async function POST(request) {
  try {
    const {
      id,
      name,
      permissions = [],
      language = "id",
    } = await request.json();

    if (!id || !name) {
      return Response.json(
        { success: false, error: "ID and name are required" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE id = ${id}`;
    if (existing.length > 0) {
      return Response.json(
        { success: false, error: "User already exists" },
        { status: 400 },
      );
    }

    // Insert user
    await sql`
      INSERT INTO users (id, name, language, is_admin)
      VALUES (${id}, ${name}, ${language}, false)
    `;

    // Insert permissions
    if (permissions.length > 0) {
      for (const perm of permissions) {
        await sql`
          INSERT INTO permissions (user_id, permission)
          VALUES (${id}, ${perm})
          ON CONFLICT (user_id, permission) DO NOTHING
        `;
      }
    }

    return Response.json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
