import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // SSL sertifikat yoxlamasını bypass edir
  },
});
const sendEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Nummix" <${process.env.EMAIL_USER}>`,
    to,
    subject: "OTP kodunuz",
    text: `Sizin OTP kodunuz: ${otp}`,
  });
};

export default sendEmail;
