import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  // src/utils/email.utils.ts

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST, // Corrected: SMTP server
      port: Number(process.env.MAIL_PORT), // Corrected: SMTP port (ensure it's a number)
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_FROM_ADDRESS, // Your email
        pass: process.env.MAIL_PASSWORD, // Your email password
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM_ADDRESS, // Replace with your email
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Mail sent successfully.');
    } catch (error) {
      console.log('error to send mail', error);
    }
  }

  async sendPasswordResetEmail(
    userName: string,
    userEmail: string,
    otp: number,
  ): Promise<void> {
    const subject = 'Your password-reset OTP (valid 10 min)';
    const text = `
            Hi ${userName},

            You asked to reset your password.

            Your one-time password (OTP) is: ${otp}

            This code is valid for 10 minutes.
            If you didn't request this, just ignore this email.

            – The Example-App Team
        `.trim();

    const html = `
            <div style="font-family:Arial,sans-serif;font-size:15px">
                <p>Hi <strong>${userName}</strong>,</p>
                <p>You asked to reset your password.</p>
                <p style="font-size:20px;font-weight:bold;letter-spacing:3px">${otp}</p>
                <p>This code is valid for <strong>10 minutes</strong>.</p>
                <p>If you didn't request this, simply ignore this email.</p>
                <p style="margin-top:24px">– The Example-App Team</p>
            </div>
        `;

    await this.sendEmail({ to: userEmail, subject, text, html });
  }
}
