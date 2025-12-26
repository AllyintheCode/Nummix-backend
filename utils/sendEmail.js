// utils/sendEmail.js
import nodemailer from "nodemailer";

// ✅ Transporter bir dəfə yaradılır (connection reuse)
const transporter = nodemailer.createTransport({
  service: "gmail", // Gmail istifadə edirsə
  auth: {
    user: process.env.EMAIL_USER, // Gmail hesabın
    pass: process.env.EMAIL_PASS, // Gmail App Password (16 simvol)
  },
  tls: {
    rejectUnauthorized: false, // deploy server üçün lazım ola bilər
  },
});

// ✅ Email göndərmə funksiyası
const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: `"Nummix" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email göndərildi:", to);
  } catch (error) {
    console.error("Email göndərmə xətası:", error.message);
    throw error; // Controller tərəfindən catch olunacaq
  }
};

// ✅ Nodemailer connection test funksiyası (isteğe bağlı)
export const verifySMTP = async () => {
  try {
    await transporter.verify();
    console.log("SMTP connection OK ✅");
  } catch (err) {
    console.error("SMTP connection xətası ❌", err);
  }
};

export default sendEmail;
