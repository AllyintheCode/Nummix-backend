import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // SSL portu
  secure: true, // SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // Gmail App Password
  },
});

const sendEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Nummix" <${process.env.GMAIL_USER}>`,
    to,
    subject: "OTP kodunuz",
    text: `Sizin OTP kodunuz: ${otp}`,
  });
};

export default sendEmail;
