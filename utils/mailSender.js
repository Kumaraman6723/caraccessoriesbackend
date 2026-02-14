const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
  try {
    // Create Transporter
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Send Mail
    let info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'LostFound'}" <${process.env.MAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = mailSender;
