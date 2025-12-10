import rateLimit from "express-rate-limit";

// 5 sorğu / 1 dəqiqə (IP başına)
export const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dəqiqə
  max: 5,
  message: {
    message: "Çox sorğu göndərdiniz. 1 dəqiqə gözləyin və yenidən cəhd edin.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// login endpoint üçün fərqli limit
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dəqiqə
  max: 10,
  message: {
    message: "Çox yanlış login cəhdi. 15 dəqiqə gözləyin.",
  },
});
