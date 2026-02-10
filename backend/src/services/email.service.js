import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_GMAIL,
        pass: process.env.GOOGLE_CLIENT_FOR_NODEMAILER,
      },
    });
  }
  return transporter;
}

export const sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.GOOGLE_GMAIL,
    to: email,
    subject: "Welcome to Lost & Found! 🔍",
    html: `
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
  };

  try {
    await getTransporter().sendMail(mailOptions);
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

  const mailOptions = {
    from: process.env.GOOGLE_GMAIL,
    to: email,
    subject: "Verify Your Email - Lost & Found",
    html: `
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
  };

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};
