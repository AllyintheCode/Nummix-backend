import jwt from "jsonwebtoken";

// Access token (qısa müddətli)
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1H" });
};

// Refresh token (uzun müddətli)
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
};
