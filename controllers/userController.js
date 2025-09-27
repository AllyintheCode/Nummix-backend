import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

// Yeni user qeydiyyatı
export const registerUser = async (req, res) => {
  try {
    const { fullName, companyName, email, password } = req.body;

    // Email artıq mövcuddursa error qaytar
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "Bu email artıq istifadə olunub" });
    }

    // Yeni user yarat
    const user = await User.create({ fullName, companyName, email, password });

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      companyName: user.companyName,
      email: user.email,
      token: generateToken(user._id), // <- Token əlavə olundu
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Emailə görə user tap
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email və ya şifrə səhvdir" });
    }

    // Şifrəni hash ilə yoxla
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email və ya şifrə səhvdir" });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      companyName: user.companyName,
      email: user.email,
      token: generateToken(user._id), // <- Token əlavə olundu
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Qorunan profil route nümunəsi
export const getProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    fullName: req.user.fullName,
    companyName: req.user.companyName,
    email: req.user.email,
  });
};
