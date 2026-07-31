import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Transporter configuration helper for Hostinger SMTP
function getSmtpCredentials() {
  return {
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || "admin@transformationcitychurch.org",
    pass: process.env.SMTP_PASS || "jxaiET4!",
    from: process.env.SMTP_FROM || `"Transformation City Church" <admin@transformationcitychurch.org>`,
  };
}

async function createTransporter(customPort?: number) {
  const creds = getSmtpCredentials();
  const port = customPort || creds.port;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: creds.host,
    port: port,
    secure: isSecure, // true for 465, false for 587
    auth: {
      user: creds.user,
      pass: creds.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents certificate verification failures on custom domains
    },
  });
}

// API Health & SMTP Status Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/smtp-status", (req, res) => {
  const creds = getSmtpCredentials();
  res.json({
    configured: true,
    host: creds.host,
    user: creds.user,
    from: creds.from,
    recipients: ["admin@transformationcitychurch.org", "leonandalouw@outlook.com"]
  });
});

// Endpoint to receive form submission and dispatch email to administrator
app.post("/api/submit-form", async (req, res) => {
  try {
    const { formTitle, ownerEmail, answers, destination, createdAt, formId } = req.body;

    // Collect all admin recipients (ensuring admin@transformationcitychurch.org is included)
    const rawRecipients = [
      "admin@transformationcitychurch.org",
      ownerEmail,
      "leonandalouw@outlook.com"
    ];
    const recipientsList = Array.from(new Set(rawRecipients.filter(Boolean)));
    const recipientString = recipientsList.join(", ");

    const title = formTitle || "Transformation City Church Form";
    const submittedTime = createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString();

    // Format fields into clean HTML table and text format
    let fieldsText = "";
    let fieldsHtml = "";

    if (answers && typeof answers === "object") {
      Object.entries(answers).forEach(([key, value]) => {
        const displayVal = Array.isArray(value) ? value.join(", ") : String(value ?? "");
        fieldsText += `- ${key}: ${displayVal}\n`;
        fieldsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-weight: bold; color: #1e293b; background-color: #f8fafc; width: 35%; border-right: 1px solid #e2e8f0;">${key}</td>
            <td style="padding: 10px 14px; color: #334155;">${displayVal || '<em style="color:#94a3b8">N/A</em>'}</td>
          </tr>
        `;
      });
    } else {
      fieldsText = "No response answers provided.";
      fieldsHtml = '<tr><td colspan="2" style="padding: 12px; text-align: center; color: #64748b;">No response answers provided.</td></tr>';
    }

    const emailSubject = `[TCC Form Submission] ${title}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 24px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          <div style="background-color: #a52424; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
              Transformation City Church
            </h1>
            <p style="color: #fecdd3; margin: 4px 0 0 0; font-size: 13px;">Form Submission Notification</p>
          </div>
          <div style="padding: 24px;">
            <div style="margin-bottom: 20px; padding: 12px 16px; background-color: #fff1f2; border-left: 4px solid #a52424; border-radius: 4px;">
              <h2 style="margin: 0 0 4px 0; font-size: 16px; color: #881337;">${title}</h2>
              <p style="margin: 0; font-size: 12px; color: #9f1239;">Submitted on ${submittedTime}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #0f172a; color: #ffffff;">
                  <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase;">Field</th>
                  <th style="padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase;">Submitted Response</th>
                </tr>
              </thead>
              <tbody>
                ${fieldsHtml}
              </tbody>
            </table>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
              Target Admin Recipients: <strong>${recipientString}</strong><br/>
              Transformation City Church Automated Form Notification
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const plainTextBody = `
NEW FORM SUBMISSION: ${title}
Submitted at: ${submittedTime}
Recipients: ${recipientString}

---------------------------------------------------
RESPONSES:
${fieldsText}
---------------------------------------------------
Transformation City Church Form System
    `;

    const creds = getSmtpCredentials();
    const fromAddress = creds.from;

    const mailOptions = {
      from: fromAddress,
      to: recipientString,
      subject: emailSubject,
      text: plainTextBody,
      html: htmlBody,
    };

    let info: any = null;
    try {
      // Try primary port (465 SSL)
      const primaryTransporter = await createTransporter(creds.port);
      info = await primaryTransporter.sendMail(mailOptions);
    } catch (primaryErr: any) {
      console.warn(`[Form Dispatch Warning] Port ${creds.port} failed (${primaryErr.message}). Retrying with STARTTLS on port 587...`);
      // Fallback to port 587 STARTTLS
      const fallbackTransporter = await createTransporter(587);
      info = await fallbackTransporter.sendMail(mailOptions);
    }

    console.log(`[Form Dispatch] Sent email for "${title}" to [${recipientString}]. MessageId:`, info.messageId || "N/A");

    return res.status(200).json({
      success: true,
      message: `Form submitted and email dispatched via Hostinger SMTP to ${recipientString}`,
      recipients: recipientsList,
      smtpConfigured: true,
      messageId: info.messageId || null,
    });
  } catch (err: any) {
    console.error("[Form Submission API Error]:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error submitting form",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
