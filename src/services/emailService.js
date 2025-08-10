// backend/src/services/emailService.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create reusable transporter object using SMTP transport
const createTransporter = async () => {
  // Prefer explicit SMTP settings if provided
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials missing: set SMTP_USER and SMTP_PASS');
    }
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_PORT) === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Use Resend via SMTP if API key is provided
  if (process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY) {
    const resendApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465, // you can switch to 587 if needed
      secure: true, // 465 uses SSL; for 587 set secure: false
      auth: {
        user: 'resend',
        pass: resendApiKey,
      },
    });
  }

  // Next, support Gmail via app password when configured
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  }

  // In development, automatically create an Ethereal test account
  if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // If we get here in production, credentials are missing
  throw new Error(
    'Email transport not configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_APP_PASSWORD.'
  );
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (user, verificationToken) => {
  try {
    const transporter = await createTransporter();

    const verificationUrl = `${
      process.env.CLIENT_URL || 'http://localhost:3000'
    }/email-verification?token=${verificationToken}`;

    const fromAddress =
      process.env.EMAIL_FROM || `"ByteBasket" <${process.env.EMAIL_USER || 'noreply@bytebasket.com'}>`;

    const mailOptions = {
      from: fromAddress,
      to: user.email,
      subject: 'Welcome to ByteBasket - Please Verify Your Email',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #14b8a6; margin: 0;">ByteBasket</h1>
            <p style="color: #6b7280; margin: 5px 0;">Nourishing Communities, One Byte at a Time</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #111827; margin-top: 0;">Welcome to ByteBasket, ${user.name}!</h2>
            <p style="color: #374151; line-height: 1.6;">
              Thank you for signing up as a <strong>${user.role}</strong> with ByteBasket. We're excited to have you join our community in the fight against hunger.
            </p>
            <p style="color: #374151; line-height: 1.6;">
              To complete your registration and start making a difference, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
              <br>
              <a href="${verificationUrl}" style="color: #14b8a6; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 12px;">
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with ByteBasket, please ignore this email.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV === 'development') {
      console.log('Verification email sent successfully');
      console.log('Message ID:', info.messageId);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL:', previewUrl);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send welcome email after verification
const sendWelcomeEmail = async user => {
  try {
    const transporter = await createTransporter();

    const fromAddress =
      process.env.EMAIL_FROM || `"ByteBasket" <${process.env.EMAIL_USER || 'noreply@bytebasket.com'}>`;

    const mailOptions = {
      from: fromAddress,
      to: user.email,
      subject: 'Welcome to ByteBasket - Your Account is Verified!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #14b8a6; margin: 0;">🎉 Welcome to ByteBasket!</h1>
          </div>
          
          <div style="background-color: #f0fdfa; padding: 30px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #14b8a6;">
            <h2 style="color: #111827; margin-top: 0;">Congratulations, ${user.name}!</h2>
            <p style="color: #374151; line-height: 1.6;">
              Your email has been successfully verified and your ByteBasket account is now active.
            </p>
            
            <div style="margin: 25px 0;">
              <h3 style="color: #111827; margin-bottom: 10px;">What's Next?</h3>
              <ul style="color: #374151; line-height: 1.6;">
                ${
                  user.role === 'volunteer'
                    ? `
                  <li>Browse available volunteer shifts in your area</li>
                  <li>Sign up for shifts that match your availability</li>
                  <li>Connect with other volunteers and make a difference</li>
                `
                    : user.role === 'donor'
                    ? `
                  <li>Start donating food and resources to those in need</li>
                  <li>Track your donations and their impact</li>
                  <li>Connect with local food banks and organizations</li>
                `
                    : `
                  <li>Explore available resources and food banks in your area</li>
                  <li>Access the support and assistance you need</li>
                  <li>Connect with your local community</li>
                `
                }
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
                 style="background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 12px;">
            <p>Thank you for being part of our mission to nourish communities!</p>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV === 'development') {
      console.log('Welcome email sent successfully');
      console.log('Message ID:', info.messageId);
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error here as user verification is complete
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
};
/**
 * Send a confirmation email to the recipient after a food request is created.
 */
const sendFoodRequestConfirmation = async (recipientUser, foodRequest) => {
  try {
    const transporter = await createTransporter();

    const fromAddress =
      process.env.EMAIL_FROM || `"ByteBasket" <${process.env.EMAIL_USER || 'noreply@bytebasket.com'}>`;

    const itemsListHtml = (foodRequest.items || [])
      .map(
        item => `
          <tr>
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${item.item_name}</td>
            <td style="padding: 6px 8px; border: 1px solid #e5e7eb; text-align: right;">${item.quantity_requested}</td>
          </tr>`
      )
      .join('');

    const pickupDate = foodRequest.preferred_pickup_date
      ? new Date(foodRequest.preferred_pickup_date).toLocaleDateString()
      : 'TBD';
    const pickupTime = foodRequest.pickup_time || 'TBD';

    const mailOptions = {
      from: fromAddress,
      to: recipientUser.email,
      subject: 'Your food request has been received',
      html: `
        <div style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #111827;">Hi ${recipientUser.name || 'there'},</h2>
          <p style="color: #374151;">We have received your food request. Here are the details:</p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="text-align: left; padding: 8px; border: 1px solid #e5e7eb;">Item</th>
                  <th style="text-align: right; padding: 8px; border: 1px solid #e5e7eb;">Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${itemsListHtml}
              </tbody>
            </table>
          </div>

          <p style="color: #374151;">Preferred pickup: <strong>${pickupDate}</strong> at <strong>${pickupTime}</strong></p>
          <p style="color: #374151;">Status: <strong>${foodRequest.status}</strong></p>

          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">If you did not make this request, please contact support.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Notify the food bank that a new request has been submitted.
 */
const sendNewFoodRequestNotification = async (foodbank, foodRequest) => {
  try {
    if (!foodbank?.contactEmail) {
      return { success: false, error: 'Food bank contact email not set' };
    }

    const transporter = await createTransporter();

    const fromAddress =
      process.env.EMAIL_FROM || `"ByteBasket" <${process.env.EMAIL_USER || 'noreply@bytebasket.com'}>`;

    const items = (foodRequest.items || [])
      .map(item => `${item.item_name} x ${item.quantity_requested}`)
      .join(', ');

    const pickupDate = foodRequest.preferred_pickup_date
      ? new Date(foodRequest.preferred_pickup_date).toLocaleDateString()
      : 'TBD';
    const pickupTime = foodRequest.pickup_time || 'TBD';

    const mailOptions = {
      from: fromAddress,
      to: foodbank.contactEmail,
      subject: `New food request from ${foodRequest.recipient_id?.name || 'a recipient'}`,
      html: `
        <div style="max-width: 640px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #111827;">New Food Request Submitted</h2>
          <p style="color: #374151;">Recipient: <strong>${foodRequest.recipient_id?.name || foodRequest.recipient_id?.email || ''}</strong></p>
          <p style="color: #374151;">Items: ${items}</p>
          <p style="color: #374151;">Preferred pickup: <strong>${pickupDate}</strong> at <strong>${pickupTime}</strong></p>
          <p style="color: #374151;">Request ID: <code>${String(foodRequest._id)}</code></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports.sendFoodRequestConfirmation = sendFoodRequestConfirmation;
module.exports.sendNewFoodRequestNotification = sendNewFoodRequestNotification;
