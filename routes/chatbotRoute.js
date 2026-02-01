import { Router } from "express";
import axios from "axios";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { chatInput, userId } = req.body;

    if (!chatInput) {
      return res.status(400).json({ message: "chatInput is required" });
    }

    const n8nUrl = "https://zey2noliya.app.n8n.cloud/webhook/chatbot";

    const n8nResponse = await axios.post(
      n8nUrl,
      { chatInput, userId },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    const data = n8nResponse.data;

    /**
     * 1️⃣ n8n-dən real cavabı çıxar
     */
    let answer =
      data?.answer || data?.output || data?.text || data?.reply || "";

    /**
     * 2️⃣ Əgər answer yenə də object gəlibsə → string et
     */
    if (typeof answer === "object") {
      answer = JSON.stringify(answer);
    }

    /**
     * 3️⃣ FORMAT NORMALİZASİYASI
     * - **bold** → sil
     * - \n → real yeni sətir
     */
    answer = answer.replace(/\*\*/g, "").replace(/\\n/g, "\n").trim();
    console.log(answer);

    return res.json({ answer });
  } catch (error) {
    const status = error.response?.status;
    const details = error.response?.data || error.message;

    console.error("Chatbot error:", status, details);

    return res.status(500).json({
      message: "Chatbot hazırda cavab verə bilmir",
    });
  }
});

export default router;
