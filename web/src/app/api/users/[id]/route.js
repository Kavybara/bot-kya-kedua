import sql from "@/app/api/utils/sql";

// GET /api/users/[id] - Get single user
export async function GET(request, { params }) {
  try {
    const { id } = params;

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
      WHERE u.id = ${id}
      GROUP BY u.id
    `;

    if (users.length === 0) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, user: users[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name, language, permissions } = await request.json();

    // Update user info
    if (name || language) {
      const updates = [];
      const values = [];

      if (name) {
        updates.push(`name = $${updates.length + 1}`);
        values.push(name);
      }
      if (language) {
        updates.push(`language = $${updates.length + 1}`);
        values.push(language);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      await sql(
        `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length}`,
        values,
      );
    }

    // Update permissions if provided
    if (permissions !== undefined) {
      // Delete existing permissions
      await sql`DELETE FROM permissions WHERE user_id = ${id}`;

      // Insert new permissions
      if (permissions.length > 0) {
        for (const perm of permissions) {
          await sql`
            INSERT INTO permissions (user_id, permission)
            VALUES (${id}, ${perm})
            ON CONFLICT (user_id, permission) DO NOTHING
          `;
        }
      }
    }

    return Response.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const result = await sql`DELETE FROM users WHERE id = ${id}`;

    if (result.count === 0) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
