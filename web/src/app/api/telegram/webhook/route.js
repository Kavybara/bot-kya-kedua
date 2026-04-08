import sql from "@/app/api/utils/sql";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Helper to get user state from database
async function getUserState(userId) {
  const result = await sql`
    SELECT action, step, data 
    FROM user_states 
    WHERE user_id = ${userId}
  `;

  if (!result || result.length === 0) {
    return null;
  }

  return {
    action: result[0].action,
    step: result[0].step,
    ...result[0].data,
  };
}

// Helper to set user state in database
async function setUserState(userId, state) {
  if (!state) {
    // Clear state
    await sql`DELETE FROM user_states WHERE user_id = ${userId}`;
    return;
  }

  const { action, step, ...data } = state;

  await sql`
    INSERT INTO user_states (user_id, action, step, data, updated_at)
    VALUES (
      ${userId}, 
      ${action || null}, 
      ${step || null}, 
      ${JSON.stringify(data)},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id)
    DO UPDATE SET 
      action = ${action || null},
      step = ${step || null},
      data = ${JSON.stringify(data)},
      updated_at = CURRENT_TIMESTAMP
  `;
}

// Helper to send Telegram message
async function sendMessage(chatId, text, options = {}) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...options,
    }),
  });
  return response.json();
}

// Helper to edit message
async function editMessage(chatId, messageId, text, options = {}) {
  const response = await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      ...options,
    }),
  });
  return response.json();
}

// Helper to answer callback query
async function answerCallback(callbackQueryId, text = "", showAlert = false) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    }),
  });
}

// Helper to check user authorization
async function isUserAuthorized(userId) {
  const users = await sql`SELECT id FROM users WHERE id = ${userId}`;
  return users.length > 0;
}

// Helper to check user permissions
async function hasPermission(userId, permission) {
  const perms = await sql`
    SELECT permission FROM permissions 
    WHERE user_id = ${userId} AND permission = ${permission}
  `;
  return perms.length > 0;
}

// Helper to get user info
async function getUserInfo(userId) {
  const users = await sql`
    SELECT u.*, COALESCE(json_agg(p.permission) FILTER (WHERE p.permission IS NOT NULL), '[]') as permissions
    FROM users u
    LEFT JOIN permissions p ON u.id = p.user_id
    WHERE u.id = ${userId}
    GROUP BY u.id
  `;
  return users[0] || null;
}

// Handle /start command - MODERN UI
async function handleStart(chatId, userId, userName, messageId = null) {
  const isAuthorized = await isUserAuthorized(userId);

  if (!isAuthorized) {
    const unauthorizedText =
      `🚫 <b>Akses Ditolak</b>\n\n` +
      `Maaf, kamu belum terdaftar dalam sistem.\n\n` +
      `<b>📱 Telegram ID:</b> <code>${userId}</code>\n` +
      `<b>👤 Username:</b> @${userName || "N/A"}\n\n` +
      `💬 Hubungi admin untuk mendapatkan akses.`;

    if (messageId) {
      await editMessage(chatId, messageId, unauthorizedText);
    } else {
      await sendMessage(chatId, unauthorizedText);
    }
    return;
  }

  const user = await getUserInfo(userId);
  const lang = user.language || "id";

  const welcomeText =
    `🎬 <b>Netflix Bot Dashboard</b>\n\n` +
    `👋 Halo <b>${userName}</b>!\n\n` +
    `📋 Pilih layanan yang kamu butuhkan:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔑 Sign-In Code", callback_data: "action_code" },
        { text: "🔗 Reset Password", callback_data: "action_reset" },
      ],
      [{ text: "🏠 Household Link", callback_data: "action_household" }],
      [
        { text: "📋 My PINs", callback_data: "view_pins" },
        { text: "📊 Statistics", callback_data: "view_stats" },
      ],
      [
        { text: "📜 Activity Logs", callback_data: "view_logs" },
        { text: "⚙️ Settings", callback_data: "settings" },
      ],
    ],
  };

  if (messageId) {
    await editMessage(chatId, messageId, welcomeText, {
      reply_markup: keyboard,
    });
  } else {
    await sendMessage(chatId, welcomeText, { reply_markup: keyboard });
  }
}

// Handle action callbacks (code, reset, household)
async function handleActionCallback(
  chatId,
  userId,
  action,
  messageId,
  callbackQueryId,
) {
  const permissionMap = {
    code: "sign_in_code",
    reset: "reset_password",
    household: "household",
  };

  const hasPerm = await hasPermission(userId, permissionMap[action]);

  if (!hasPerm) {
    await answerCallback(
      callbackQueryId,
      "❌ Kamu tidak memiliki akses ke fitur ini!",
      true,
    );
    return;
  }

  const actionEmoji = {
    code: "🔑",
    reset: "🔗",
    household: "🏠",
  };

  const actionName = {
    code: "Sign-In Code",
    reset: "Reset Password",
    household: "Household Link",
  };

  const promptText =
    `${actionEmoji[action]} <b>${actionName[action]}</b>\n\n` +
    `📧 <b>Masukkan email Netflix:</b>\n\n` +
    `Kirim email yang terdaftar di Netflix untuk mencari data terbaru.\n\n` +
    `💡 <i>Contoh: user@example.com</i>`;

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 Kembali ke Menu", callback_data: "back_main" }],
    ],
  };

  await editMessage(chatId, messageId, promptText, { reply_markup: keyboard });
  await answerCallback(callbackQueryId);

  // Set user state in DATABASE
  await setUserState(userId, { action, step: "waiting_email" });
}

// Handle email search result display
async function displayEmailResult(chatId, userId, email, data, action) {
  let resultText = `✅ <b>Data Ditemukan!</b>\n\n`;
  resultText += `📧 <b>Email:</b> ${email}\n`;
  resultText += `📅 <b>Tanggal:</b> ${data.date}\n\n`;

  if (data.sign_in_code) {
    resultText += `🔑 <b>Sign-In Code:</b>\n<code>${data.sign_in_code}</code>\n\n`;
  }
  if (data.reset_link) {
    resultText += `🔗 <b>Reset Password Link:</b>\n${data.reset_link}\n\n`;
  }
  if (data.household_link) {
    resultText += `🏠 <b>Household Link:</b>\n${data.household_link}\n\n`;
  }

  resultText += `📝 <b>Subject:</b>\n<i>${data.subject}</i>`;

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔄 Cari Email Lain", callback_data: `action_${action}` }],
      [{ text: "🏠 Kembali ke Menu", callback_data: "back_main" }],
    ],
  };

  await sendMessage(chatId, resultText, { reply_markup: keyboard });
}

// View saved PINs
async function viewPins(chatId, userId, messageId, callbackQueryId) {
  const pins = await sql`
    SELECT profile_name, pin, created_at 
    FROM pins 
    WHERE user_id = ${userId}
    ORDER BY profile_name
  `;

  let text = `🔐 <b>PIN Tersimpan</b>\n\n`;

  if (pins.length === 0) {
    text += `<i>Belum ada PIN yang tersimpan.</i>\n\n`;
    text += `💡 Gunakan tombol di bawah untuk menambah PIN baru.`;
  } else {
    pins.forEach((pin, index) => {
      text += `${index + 1}. <b>${pin.profile_name}</b>\n`;
      text += `   🔢 PIN: <code>${pin.pin}</code>\n\n`;
    });
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: "➕ Tambah PIN Baru", callback_data: "add_pin" }],
      [{ text: "🔙 Kembali ke Menu", callback_data: "back_main" }],
    ],
  };

  await editMessage(chatId, messageId, text, { reply_markup: keyboard });
  await answerCallback(callbackQueryId);
}

// View statistics
async function viewStats(chatId, userId, messageId, callbackQueryId) {
  const stats = await sql`
    SELECT action, count, last_used 
    FROM statistics 
    WHERE user_id = ${userId}
    ORDER BY count DESC
  `;

  let text = `📊 <b>Statistik Penggunaan</b>\n\n`;

  if (stats.length === 0) {
    text += `<i>Belum ada aktivitas tercatat.</i>`;
  } else {
    stats.forEach((stat) => {
      const emoji = stat.action === "email_search" ? "📧" : "🔍";
      text += `${emoji} <b>${stat.action}:</b> ${stat.count}x\n`;
    });
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔙 Kembali ke Menu", callback_data: "back_main" }],
    ],
  };

  await editMessage(chatId, messageId, text, { reply_markup: keyboard });
  await answerCallback(callbackQueryId);
}

// View activity logs
async function viewLogs(chatId, userId, messageId, callbackQueryId) {
  const logs = await sql`
    SELECT action, target_email, success, created_at 
    FROM activity_logs 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 10
  `;

  let text = `📜 <b>Activity Logs</b>\n<i>10 aktivitas terakhir</i>\n\n`;

  if (logs.length === 0) {
    text += `<i>Belum ada log aktivitas.</i>`;
  } else {
    logs.forEach((log, index) => {
      const status = log.success ? "✅" : "❌";
      const date = new Date(log.created_at).toLocaleString("id-ID");
      text += `${index + 1}. ${status} <b>${log.action}</b>\n`;
      text += `   📧 ${log.target_email}\n`;
      text += `   🕐 ${date}\n\n`;
    });
  }

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔄 Refresh", callback_data: "view_logs" }],
      [{ text: "🔙 Kembali ke Menu", callback_data: "back_main" }],
    ],
  };

  await editMessage(chatId, messageId, text, { reply_markup: keyboard });
  await answerCallback(callbackQueryId);
}

// Handle callback queries
async function handleCallback(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const userName = callbackQuery.from.first_name || "User";
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const callbackQueryId = callbackQuery.id;

  // Check authorization
  const isAuthorized = await isUserAuthorized(userId);
  if (!isAuthorized && data !== "back_main") {
    await answerCallback(
      callbackQueryId,
      "❌ Kamu tidak memiliki akses!",
      true,
    );
    return;
  }

  switch (data) {
    case "action_code":
      await handleActionCallback(
        chatId,
        userId,
        "code",
        messageId,
        callbackQueryId,
      );
      break;

    case "action_reset":
      await handleActionCallback(
        chatId,
        userId,
        "reset",
        messageId,
        callbackQueryId,
      );
      break;

    case "action_household":
      await handleActionCallback(
        chatId,
        userId,
        "household",
        messageId,
        callbackQueryId,
      );
      break;

    case "view_pins":
      await viewPins(chatId, userId, messageId, callbackQueryId);
      break;

    case "view_stats":
      await viewStats(chatId, userId, messageId, callbackQueryId);
      break;

    case "view_logs":
      await viewLogs(chatId, userId, messageId, callbackQueryId);
      break;

    case "add_pin":
      const promptText =
        `🔐 <b>Tambah PIN Baru</b>\n\n` +
        `📝 <b>Step 1: Nama Profile</b>\n\n` +
        `Masukkan nama profile Netflix:\n` +
        `💡 <i>Contoh: Kids, Bapak, Ibu, dll</i>`;

      const keyboard = {
        inline_keyboard: [[{ text: "❌ Batal", callback_data: "view_pins" }]],
      };

      await editMessage(chatId, messageId, promptText, {
        reply_markup: keyboard,
      });
      await answerCallback(callbackQueryId);

      // Set state in DATABASE
      await setUserState(userId, { action: "add_pin", step: "profile_name" });
      break;

    case "settings":
      const settingsText =
        `⚙️ <b>Pengaturan</b>\n\n` +
        `<b>Bahasa:</b> Indonesia 🇮🇩\n` +
        `<b>Notifikasi:</b> Aktif ✅\n\n` +
        `<i>Fitur pengaturan akan segera hadir!</i>`;

      const settingsKeyboard = {
        inline_keyboard: [
          [{ text: "🔙 Kembali ke Menu", callback_data: "back_main" }],
        ],
      };

      await editMessage(chatId, messageId, settingsText, {
        reply_markup: settingsKeyboard,
      });
      await answerCallback(callbackQueryId);
      break;

    case "back_main":
      await setUserState(userId, null); // Clear state in DATABASE
      await handleStart(chatId, userId, userName, messageId);
      await answerCallback(callbackQueryId);
      break;

    default:
      await answerCallback(callbackQueryId, "⚠️ Aksi tidak dikenali");
  }
}

// Process text messages
async function handleTextMessage(chatId, userId, text, userName) {
  const state = await getUserState(userId); // Get from DATABASE

  // Check if user is in a specific flow
  if (state?.step === "waiting_email") {
    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(text)) {
      await sendMessage(
        chatId,
        `❌ <b>Format email tidak valid!</b>\n\n` +
          `Silakan kirim email yang valid.\n` +
          `💡 <i>Contoh: user@example.com</i>`,
      );
      return;
    }

    // Show loading
    const loadingMsg = await sendMessage(
      chatId,
      `🔍 <b>Mencari email...</b>\n\n` +
        `📧 ${text}\n\n` +
        `⏳ Tunggu sebentar...`,
    );

    // Call Gmail API with 1 hour time window
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CREATE_APP_URL}/api/gmail/parse`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_email: text,
            max_age_seconds: 3600, // Changed from 900 to 3600 (1 hour)
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        await displayEmailResult(
          chatId,
          userId,
          text,
          result.data,
          state.action,
        );

        // Log activity
        await fetch(`${process.env.NEXT_PUBLIC_CREATE_APP_URL}/api/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            user_name: userName,
            action: "email_search",
            target_email: text,
            success: true,
          }),
        });

        // Clear state
        await setUserState(userId, null);
      } else {
        // Fallback: try WITHOUT time filter for newly received emails
        const fallbackResponse = await fetch(
          `${process.env.NEXT_PUBLIC_CREATE_APP_URL}/api/gmail/parse`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target_email: text,
              max_age_seconds: null, // No time filter
            }),
          },
        );

        const fallbackResult = await fallbackResponse.json();

        if (fallbackResult.success) {
          await displayEmailResult(
            chatId,
            userId,
            text,
            fallbackResult.data,
            state.action,
          );

          // Log activity
          await fetch(`${process.env.NEXT_PUBLIC_CREATE_APP_URL}/api/logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              user_name: userName,
              action: "email_search",
              target_email: text,
              success: true,
            }),
          });

          await setUserState(userId, null);
        } else {
          await sendMessage(
            chatId,
            `❌ <b>Email tidak ditemukan</b>\n\n` +
              `Tidak ada email Netflix untuk:\n📧 ${text}\n\n` +
              `💡 <b>Tips:</b>\n` +
              `• Pastikan email sudah dikirim\n` +
              `• Tunggu 1-2 menit untuk Gmail indexing\n` +
              `• Periksa folder spam`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🔄 Coba Lagi",
                      callback_data: `action_${state.action}`,
                    },
                  ],
                  [{ text: "🏠 Kembali ke Menu", callback_data: "back_main" }],
                ],
              },
            },
          );
        }
      }
    } catch (error) {
      console.error("Gmail API error:", error);
      await sendMessage(
        chatId,
        `❌ <b>Terjadi kesalahan</b>\n\n` +
          `Gagal mengambil data email.\n` +
          `Silakan coba lagi nanti.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏠 Kembali ke Menu", callback_data: "back_main" }],
            ],
          },
        },
      );
    }
    return;
  }

  // Handle PIN addition flow
  if (state?.action === "add_pin") {
    if (state.step === "profile_name") {
      // Save profile name and ask for PIN
      await setUserState(userId, {
        action: "add_pin",
        step: "pin",
        profile_name: text,
      });

      await sendMessage(
        chatId,
        `🔐 <b>Tambah PIN Baru</b>\n\n` +
          `✅ Profile: <b>${text}</b>\n\n` +
          `📝 <b>Step 2: PIN</b>\n\n` +
          `Masukkan PIN 4 digit:\n` +
          `💡 <i>Contoh: 1234</i>`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "❌ Batal", callback_data: "view_pins" }],
            ],
          },
        },
      );
      return;
    }

    if (state.step === "pin") {
      // Validate PIN
      if (!/^\d{4}$/.test(text)) {
        await sendMessage(
          chatId,
          `❌ <b>PIN harus 4 digit angka!</b>\n\n` +
            `Silakan masukkan PIN yang valid.\n` +
            `💡 <i>Contoh: 1234</i>`,
        );
        return;
      }

      // Get profile name from state
      const profileName = state.profile_name;

      // Save PIN to database
      try {
        await sql`
          INSERT INTO pins (user_id, profile_name, pin)
          VALUES (${userId}, ${profileName}, ${text})
          ON CONFLICT (user_id, profile_name)
          DO UPDATE SET pin = ${text}, updated_at = CURRENT_TIMESTAMP
        `;

        await sendMessage(
          chatId,
          `✅ <b>PIN Berhasil Disimpan!</b>\n\n` +
            `👤 <b>Profile:</b> ${profileName}\n` +
            `🔢 <b>PIN:</b> <code>${text}</code>\n\n` +
            `💡 PIN ini akan digunakan untuk verifikasi saat kick email.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "📋 Lihat Semua PIN", callback_data: "view_pins" }],
                [{ text: "🏠 Kembali ke Menu", callback_data: "back_main" }],
              ],
            },
          },
        );

        await setUserState(userId, null);
      } catch (error) {
        console.error("PIN save error:", error);
        await sendMessage(
          chatId,
          `❌ <b>Gagal menyimpan PIN</b>\n\n` +
            `Terjadi kesalahan. Silakan coba lagi.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔄 Coba Lagi", callback_data: "add_pin" }],
                [{ text: "🏠 Kembali ke Menu", callback_data: "back_main" }],
              ],
            },
          },
        );
      }
      return;
    }
  }

  // Default: show help
  await sendMessage(
    chatId,
    `❓ <b>Pesan tidak dikenali</b>\n\n` +
      `Gunakan tombol menu di bawah untuk navigasi.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🏠 Buka Menu Utama", callback_data: "back_main" }],
        ],
      },
    },
  );
}

// POST /api/telegram/webhook - Handle Telegram updates
export async function POST(request) {
  try {
    const update = await request.json();

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return Response.json({ success: true });
    }

    // Handle messages
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from.id;
      const userName = message.from.first_name || "User";
      const text = message.text;

      // Handle /start command
      if (text === "/start") {
        await handleStart(chatId, userId, userName);
        return Response.json({ success: true });
      }

      // Handle text messages
      if (text) {
        await handleTextMessage(chatId, userId, text, userName);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
