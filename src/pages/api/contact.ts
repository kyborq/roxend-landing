import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

// Функция для отправки уведомления в Telegram
async function sendTelegramNotification(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const botToken = import.meta.env.BOT_TOKEN;
  const adminId = import.meta.env.BOT_ADMIN_ID;

  if (!botToken || !adminId) {
    console.warn(
      "Telegram bot не настроен (отсутствует BOT_TOKEN или BOT_ADMIN_ID)"
    );
    return;
  }

  try {
    const text = `
🔔 <b>Новая заявка с сайта!</b>

👤 <b>Имя:</b> ${data.name}
📧 <b>Email:</b> ${data.email}
${data.phone ? `📱 <b>Телефон:</b> ${data.phone}` : ""}

💬 <b>Сообщение:</b>
${data.message}

⏰ ${new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}
    `.trim();

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: adminId,
          text: text,
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Ошибка отправки в Telegram:", error);
    } else {
      console.log("Уведомление в Telegram успешно отправлено");
    }
  } catch (error) {
    console.error("Ошибка при отправке в Telegram:", error);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, phone, message } = data;

    // Валидация
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Заполните все обязательные поля",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Email валидация
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, message: "Неверный формат email" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Создание транспорта для отправки email
    const transporter = nodemailer.createTransport({
      host: import.meta.env.SMTP_HOST,
      port: parseInt(import.meta.env.SMTP_PORT || "587"),
      secure: import.meta.env.SMTP_SECURE === "true", // true для 465, false для других портов
      auth: {
        user: import.meta.env.SMTP_USER,
        pass: import.meta.env.SMTP_PASSWORD,
      },
    });

    // Формирование письма
    const mailOptions = {
      from: `"${import.meta.env.SMTP_FROM_NAME}" <${
        import.meta.env.SMTP_FROM_EMAIL
      }>`,
      to: import.meta.env.CONTACT_EMAIL || "info@roxend.ru",
      subject: `Новая заявка с сайта от ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 10px;">Новая заявка с сайта Roxend</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 10px 0;"><strong>Имя:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${
              phone
                ? `<p style="margin: 10px 0;"><strong>Телефон:</strong> ${phone}</p>`
                : ""
            }
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 5px 0 10px 0;"><strong>Сообщение:</strong></p>
              <p style="margin: 0; color: #555; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #999; text-align: center;">
            Это сообщение было отправлено с формы обратной связи на сайте roxend.ru
          </p>
        </div>
      `,
      text: `
Новая заявка с сайта Roxend

Имя: ${name}
Email: ${email}
${phone ? `Телефон: ${phone}` : ""}

Сообщение:
${message}

---
Это сообщение было отправлено с формы обратной связи на сайте roxend.ru
      `,
    };

    // Отправка email и уведомления в Telegram параллельно
    await Promise.all([
      transporter.sendMail(mailOptions),
      sendTelegramNotification({ name, email, phone, message }).catch((err) =>
        console.error("Не удалось отправить уведомление в Telegram:", err)
      ),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Сообщение успешно отправлено",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ошибка при отправке email:", error);

    // Детальное логирование для отладки
    console.error("SMTP настройки:");
    console.error("Host:", import.meta.env.SMTP_HOST);
    console.error("Port:", import.meta.env.SMTP_PORT);
    console.error("User:", import.meta.env.SMTP_USER);
    console.error("From:", import.meta.env.SMTP_FROM_EMAIL);
    console.error("To:", import.meta.env.CONTACT_EMAIL);

    return new Response(
      JSON.stringify({
        success: false,
        message:
          "Ошибка при отправке сообщения. Попробуйте позже или свяжитесь с нами другим способом.",
        // В development показываем детали ошибки
        ...(import.meta.env.DEV && {
          error: error instanceof Error ? error.message : String(error),
        }),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
