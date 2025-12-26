import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log("Email göndərildi:", to);
  } catch (error) {
    console.error("Email göndərmə xətası:", error.message);
    throw error; // üst səviyyəyə at, controller catch-blokunda handle et
  }
};

export default sendEmail;
