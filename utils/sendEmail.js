import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  return resend.emails.send({
    from: "Nummix <onboarding@resend.dev>",
    to,
    subject,
    text,
  });
};

export default sendEmail;
