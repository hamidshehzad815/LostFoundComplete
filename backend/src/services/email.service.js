const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_SENDER_EMAIL = "hamidshehzad815@gmail.com";
const DEFAULT_SENDER_NAME = "Lost & Found";

function getSender() {
  return {
    name: process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME,
    email: process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL,
  };
}

async function sendViaBrevo({ to, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error(
      "BREVO_API_KEY is not set. Add it in your Render environment variables.",
    );
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: getSender(),
      to: Array.isArray(to) ? to : [to],
      subject,
      htmlContent,
    }),
  });

  const rawBody = await response.text();
  let data = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = { message: rawBody };
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Brevo API error (${response.status} ${response.statusText})`;
    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }

  return data;
}

export const sendWelcomeEmail = async (email, username) => {
  try {
    await sendViaBrevo({
      to: { email, name: username },
      subject: "Welcome to Lost & Found! 🔍",
      htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0ea5e9; font-size: 2.5em;">🔍</h1>
          <h2 style="color: #0f172a;">Welcome to Lost & Found!</h2>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">
            Hi <strong>${username}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">
            Thank you for joining our Lost & Found community! We're excited to help you reunite lost items with their owners.
          </p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #e0f2fe; border-left: 4px solid #0ea5e9; border-radius: 4px;">
            <h3 style="color: #0284c7; margin-top: 0;">What's Next?</h3>
            <ul style="color: #334155; line-height: 1.8;">
              <li>Complete your profile</li>
              <li>Report lost or found items</li>
              <li>Connect with your community</li>
              <li>Help others find their belongings</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">
            If you have any questions or need assistance, feel free to reach out to our support team.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="display: inline-block; padding: 12px 30px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Get Started
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
          <p>© 2026 Lost & Found. All rights reserved.</p>
        </div>
      </div>
    `,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (
  email,
  username,
  verificationToken,
) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  try {
    await sendViaBrevo({
      to: { email, name: username },
      subject: "Verify Your Email - Lost & Found",
      htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0ea5e9; font-size: 2.5em;">🔍</h1>
          <h2 style="color: #0f172a;">Verify Your Email</h2>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">
            Hi <strong>${username}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">
            Please verify your email address to complete your registration.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; padding: 12px 30px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Verify Email
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
            Or copy and paste this link in your browser:<br>
            <a href="${verificationUrl}" style="color: #0ea5e9; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
            This link will expire in 1 hour.
          </p>
        </div>
      </div>
    `,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};
