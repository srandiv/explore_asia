import nodemailer from "nodemailer";

export const prerender = false;

const packageOptions = new Set([
  "Purely Ceylon",
  "Island Treasures",
  "Best of Ceylon",
  "Pearl Island Journey",
  "Hidden Sri Lanka",
  "Adventure & Explore",
  "Custom trip",
]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const getEnv = (key) => import.meta.env[key] ?? process.env[key];

const readField = (formData, field) =>
  String(formData.get(field) ?? "")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const stripHeaderBreaks = (value) => value.replace(/[\r\n]+/g, " ").trim();

const getSmtpErrorDetails = (error, config) => {
  const code = error?.code;
  const command = error?.command;
  const responseCode = error?.responseCode;
  const response = error?.response;
  const smtpTarget = `${config.host}:${config.port}`;

  if (code === "EAUTH" || responseCode === 535 || responseCode === 534) {
    return {
      type: "smtp_auth",
      reason: `Connected to the SMTP server, but authentication was rejected${response ? ` (${response})` : ""}. Check SMTP_USER and SMTP_PASS.`,
    };
  }

  if (code === "EENVELOPE" || command === "RCPT TO" || responseCode === 550 || responseCode === 553) {
    return {
      type: "smtp_recipient",
      reason: "The SMTP server rejected the sender or recipient address. Check CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL.",
    };
  }

  if (
    code === "ECONNECTION" ||
    code === "ESOCKET" ||
    code === "ETIMEDOUT" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    responseCode === 421
  ) {
    return {
      type: "smtp_connection",
      reason: `Could not connect to the SMTP server at ${smtpTarget}. This is a mail server, DNS, firewall, port, or SSL setting issue, not a contact form validation issue.`,
    };
  }

  return {
    type: "smtp_unknown",
    reason: `The SMTP server returned an unexpected error${response ? `: ${response}` : "."}`,
  };
};

const validateInquiry = (fields) => {
  const errors = {};

  if (fields.name.length < 2 || fields.name.length > 100) {
    errors.name = "Please enter a name between 2 and 100 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(fields.email) || fields.email.length > 160) {
    errors.email = "Please enter a valid email address.";
  }

  if (fields.phone && !/^[+()\d\s.-]{7,30}$/.test(fields.phone)) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!packageOptions.has(fields.packageName)) {
    errors.package = "Please select a valid package.";
  }

  if (fields.message.length < 10 || fields.message.length > 1500) {
    errors.message = "Please enter trip details between 10 and 1500 characters.";
  }

  return errors;
};

export async function POST({ request }) {
  let formData;

  try {
    formData = await request.formData();
  } catch {
    return json(
      {
        ok: false,
        message: "Please submit the contact form again.",
      },
      400,
    );
  }

  const fields = {
    name: readField(formData, "name"),
    email: readField(formData, "email"),
    phone: readField(formData, "phone"),
    packageName: readField(formData, "package"),
    message: String(formData.get("message") ?? "").trim(),
  };

  const errors = validateInquiry(fields);

  if (Object.keys(errors).length > 0) {
    return json(
      {
        ok: false,
        message: Object.values(errors)[0],
        errors,
      },
      400,
    );
  }

  const smtpHost = getEnv("SMTP_HOST");
  const smtpPort = Number(getEnv("SMTP_PORT") ?? 465);
  const smtpUser = getEnv("SMTP_USER");
  const smtpPass = getEnv("SMTP_PASS");
  const smtpSecure = String(getEnv("SMTP_SECURE") ?? "true") === "true";
  const smtpFamily = Number(getEnv("SMTP_FAMILY") ?? 4);
  const fromEmail = getEnv("CONTACT_FROM_EMAIL") ?? smtpUser;
  const toEmail = getEnv("CONTACT_TO_EMAIL");

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail || !toEmail) {
    console.error("Contact form SMTP environment variables are missing.");

    return json(
      {
        ok: false,
        message: "Email is not configured yet. Please call or WhatsApp us for urgent help.",
      },
      500,
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    family: smtpFamily,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const safeName = stripHeaderBreaks(fields.name);
  const safeEmail = stripHeaderBreaks(fields.email);
  const subject = `New travel inquiry from ${safeName}`;
  const htmlRows = [
    ["Name", fields.name],
    ["Email", fields.email],
    ["Phone", fields.phone || "Not provided"],
    ["Package", fields.packageName],
    ["Trip details", fields.message],
  ];

  try {
    await transporter.sendMail({
      from: `"Explore Asia Travels" <${fromEmail}>`,
      to: toEmail,
      replyTo: `"${safeName}" <${safeEmail}>`,
      subject,
      text: [
        `Name: ${fields.name}`,
        `Email: ${fields.email}`,
        `Phone: ${fields.phone || "Not provided"}`,
        `Package: ${fields.packageName}`,
        "",
        "Trip details:",
        fields.message,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">New travel inquiry</h2>
          <table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            ${htmlRows
              .map(
                ([label, value]) => `
                  <tr>
                    <th align="left" style="border: 1px solid #e2e8f0; background: #f8fafc; width: 150px;">${escapeHtml(label)}</th>
                    <td style="border: 1px solid #e2e8f0;">${escapeHtml(value).replace(/\n/g, "<br>")}</td>
                  </tr>
                `,
              )
              .join("")}
          </table>
        </div>
      `,
    });

    return json({
      ok: true,
      message: "Thank you. Your inquiry was sent successfully.",
    });
  } catch (error) {
    const smtpError = getSmtpErrorDetails(error, {
      host: smtpHost,
      port: smtpPort,
    });

    console.error("Contact form email failed:", {
      type: smtpError.type,
      reason: smtpError.reason,
      code: error?.code,
      command: error?.command,
      responseCode: error?.responseCode,
      response: error?.response,
      address: error?.address,
      port: error?.port,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpFamily,
    });

    return json(
      {
        ok: false,
        type: smtpError.type,
        message: "Message failed. Please contact us on WhatsApp.",
      },
      500,
    );
  }
}
