import { getSecret } from "astro:env/server";
import {
  buildEmailHtml,
  buildEmailText,
  isHoneypotTriggered,
  parseInquiryPayload,
  validateInquiry,
} from "../../../shared/contact-inquiry.js";

export const prerender = false;

const getContactConfig = () => ({
  resendApiKey: getSecret("RESEND_API_KEY"),
  fromEmail: getSecret("CONTACT_FROM_EMAIL"),
  toEmail: getSecret("CONTACT_TO_EMAIL"),
  logoUrl:
    getSecret("CONTACT_LOGO_URL") ?? "https://www.exploreasiatravels.com/favicon.png",
});

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const stripHeaderBreaks = (value) => value.replace(/[\r\n]+/g, " ").trim();

const sendWithResend = async ({
  apiKey,
  from,
  to,
  replyTo,
  subject,
  text,
  html,
}) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject,
      text,
      html,
    }),
  });

  const result = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    result,
  };
};

export async function POST({ request }) {
  let payload;

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    }
  } catch {
    return json(
      {
        ok: false,
        message: "Please submit the contact form again.",
      },
      400,
    );
  }

  if (isHoneypotTriggered(payload)) {
    return json({
      ok: true,
      message: "Thank you. Your inquiry was sent successfully.",
    });
  }

  const fields = parseInquiryPayload(payload);
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

  const { resendApiKey, fromEmail, toEmail, logoUrl } = getContactConfig();

  if (!resendApiKey || !fromEmail || !toEmail) {
    console.error("Contact form Resend environment variables are missing.", {
      hasResendApiKey: Boolean(resendApiKey),
      hasFromEmail: Boolean(fromEmail),
      hasToEmail: Boolean(toEmail),
    });

    return json(
      {
        ok: false,
        message: "Email is not configured yet. Please call or WhatsApp us for urgent help.",
      },
      500,
    );
  }

  const safeName = stripHeaderBreaks(fields.name);
  const safeEmail = stripHeaderBreaks(fields.email);

  try {
    const { ok, result } = await sendWithResend({
      apiKey: resendApiKey,
      from: `Explore Asia Travels <${fromEmail}>`,
      to: toEmail,
      replyTo: `${safeName} <${safeEmail}>`,
      subject: `New travel inquiry from ${safeName}`,
      text: buildEmailText(fields),
      html: buildEmailHtml({ fields, logoUrl }),
    });

    if (!ok) {
      console.error("Resend API failed:", result);

      return json(
        {
          ok: false,
          message: "Message failed. Please contact us on WhatsApp.",
        },
        500,
      );
    }

    return json({
      ok: true,
      message: "Thank you. Your inquiry was sent successfully.",
    });
  } catch (error) {
    console.error("Contact form email failed:", error);

    return json(
      {
        ok: false,
        message: "Message failed. Please contact us on WhatsApp.",
      },
      500,
    );
  }
}
