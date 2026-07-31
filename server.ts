import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Transporter configuration helper
async function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test Ethereal SMTP service for development/testing if no custom SMTP is provided
    try {
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn("Could not create Ethereal test account, using fallback transporter:", err);
      return nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint to receive form submission and dispatch email to administrator
app.post("/api/submit-form", async (req, res) => {
  try {
    const { formTitle, ownerEmail, answers, destination, createdAt, formId } = req.body;

    const recipient = ownerEmail || "leonandalouw@outlook.com";
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
              Sent automatically to form administrator: <strong>${recipient}</strong><br/>
              Transformation City Church Admin System
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const plainTextBody = `
NEW FORM SUBMISSION: ${title}
Submitted at: ${submittedTime}
Destination: ${recipient}

---------------------------------------------------
RESPONSES:
${fieldsText}
---------------------------------------------------
Transformation City Church Form System
    `;

    const transporter = await createTransporter();
    const fromAddress = process.env.SMTP_FROM || `"Transformation City Church" <noreply@tccchurch.org>`;

    const mailOptions = {
      from: fromAddress,
      to: recipient,
      subject: emailSubject,
      text: plainTextBody,
      html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Form Dispatch] Sent email for "${title}" to ${recipient}. MessageId:`, info.messageId || "N/A");

    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`[Form Dispatch Preview URL]:`, testUrl);
    }

    return res.status(200).json({
      success: true,
      message: `Form submitted and email dispatched to ${recipient}`,
      recipient,
      messageId: info.messageId || null,
      previewUrl: testUrl || null,
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
