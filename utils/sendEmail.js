import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, otp) => {
  return resend.emails.send({
    from: "Nummix <no-reply@nummix.az>", // öz domenin
    to: to, // istifadəçinin email-i
    subject: "OTP kodunuz",
    text: `Sizin təsdiq kodunuz: ${otp}`,
  });
};

export default sendEmail;
