import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";

dotenv.config();

const DEFAULT_CATEGORIES = [
  {
    name: "Binalar və struktur komponentləri",
    depreciationRate: 5,
    monthlyRate: 0.42,
    color: "#FF7043",
    description: "Bütün növ istehsalat, təsərrüfat, inzibati binalar, sosial-mədəni obyektlər",
  },
  {
    name: "Qurğular və struktur komponentləri",
    depreciationRate: 7,
    monthlyRate: 0.58,
    color: "#FFA726",
    description: "Vodokaskalar, stadionlar, hovuzlar, yollar, körpülər, heykəllər",
  },
  {
    name: "Ötürücü qurğular və struktur komponentləri",
    depreciationRate: 9,
    monthlyRate: 0.75,
    color: "#FFEE58",
    description: "Elektrik xətləri, transmissiyalar, boru kəmərləri, tunellər, kanalizasiya",
  },
  {
    name: "Maşın və avadanlıqlar",
    depreciationRate: 13,
    monthlyRate: 1.08,
    color: "#66BB6A",
    description: "Güc maşınları, iş maşınları, kompüterlər, tibbi avadanlıqlar, ölçü cihazları",
  },
  {
    name: "Nəqliyyat vasitələri",
    depreciationRate: 15,
    monthlyRate: 1.25,
    color: "#29B6F6",
    description: "Avtomobillər, avtobuslar, təyyarələr, gəmilər, traktorlar",
  },
  {
    name: "İstehsal alətləri və təsərrüfat inventarları",
    depreciationRate: 25,
    monthlyRate: 2.08,
    color: "#AB47BC",
    description: "Əl alətləri, iş stolları, dəftərxana mebelləri, yanğın mühafizə predmetləri",
  },
  {
    name: "Torpaq yaxşılaşdırması, iş heyvanları, çoxillik əkmələr",
    depreciationRate: 25,
    monthlyRate: 2.08,
    color: "#26A69A",
    description: "Torpaq məsrəfləri, iş heyvanları, meyvə bağları, dekorativ əkmələr",
  },
  {
    name: "Qeyri-maddi aktivlər",
    depreciationRate: 10,
    monthlyRate: 0.83,
    color: "#78909C",
    description: "Patentlər, lisenziyalar, proqram təminatı. Müddət bilinmədikdə 10 il üzrə",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB qoşuldu");

    await Category.deleteMany({});
    console.log("Köhnə kateqoriyalar silindi");

    await Category.insertMany(DEFAULT_CATEGORIES);
    console.log("✅ 8 kateqoriya uğurla əlavə edildi");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed xətası:", err.message);
    process.exit(1);
  }
};

seed();