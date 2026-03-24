// server/seed.js
// İlk dəfə çalışdıranda DB-yə kateqoriyalar və lokasiyalar əlavə edir
// İstifadə: node seed.js

require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./models/Category.model");
const Location = require("./models/Location.model");
const Asset = require("./models/Asset.model");

const categories = [
  { name: "Kompüter avadanlığı",   color: "#64B5F6", depreciationRate: 25 },
  { name: "Nəqliyyat vasitələri",  color: "#4DB6AC", depreciationRate: 20 },
  { name: "Ofis avadanlığı",       color: "#FFB74D", depreciationRate: 15 },
  { name: "Əmlak",                 color: "#FF8A65", depreciationRate: 5  },
  { name: "Mebel",                 color: "#BA68C8", depreciationRate: 10 },
];

const locations = [
  { name: "Bakı Ofisi",       city: "Bakı",      branch: "Mərkəzi Ofis" },
  { name: "Sumqayıt filialı", city: "Sumqayıt",  branch: "Filial"       },
  { name: "Gəncə filialı",    city: "Gəncə",     branch: "Filial"       },
  { name: "28 May",           city: "Bakı",      branch: "Anbar"        },
];

const sampleAssets = [
  {
    invNo: "INV-2024-001",
    name: "Dell Kompüter",
    category: "Kompüter avadanlığı",
    account: "111",
    purchaseDate: new Date("2024-01-15"),
    initialValue: 2500,
    residualValue: 250,
    depreciationMethod: "straightLine",
    usefulLifeMonths: 48,
    location: "Bakı Ofisi",
    branch: "IT Şöbəsi",
    supplier: "Dell Azerbaijan",
    serialNo: "DL2024XYZ",
    status: "active",
  },
  {
    invNo: "INV-2023-045",
    name: "Toyota Camry",
    category: "Nəqliyyat vasitələri",
    account: "112",
    purchaseDate: new Date("2023-03-10"),
    initialValue: 45000,
    residualValue: 5000,
    depreciationMethod: "decliningBalance",
    usefulLifeMonths: 60,
    location: "Bakı Ofisi",
    branch: "İnzibati Şöbə",
    supplier: "Toyota Baku",
    status: "active",
  },
  {
    invNo: "INV-2024-012",
    name: "HP Printer LaserJet",
    category: "Ofis avadanlığı",
    account: "111",
    purchaseDate: new Date("2024-02-20"),
    initialValue: 1200,
    residualValue: 100,
    depreciationMethod: "straightLine",
    usefulLifeMonths: 60,
    location: "Bakı Ofisi",
    branch: "Mühasibatlıq",
    status: "active",
  },
  {
    invNo: "INV-2020-001",
    name: "Əmlak - 28 May",
    category: "Əmlak",
    account: "113",
    purchaseDate: new Date("2020-06-01"),
    initialValue: 500000,
    residualValue: 100000,
    depreciationMethod: "straightLine",
    usefulLifeMonths: 480,
    location: "28 May",
    branch: "Anbar",
    status: "active",
  },
  {
    invNo: "INV-2023-089",
    name: 'Samsung Monitor 27"',
    category: "Kompüter avadanlığı",
    account: "111",
    purchaseDate: new Date("2023-09-05"),
    initialValue: 450,
    residualValue: 50,
    depreciationMethod: "straightLine",
    usefulLifeMonths: 48,
    location: "Bakı Ofisi",
    branch: "IT Şöbəsi",
    status: "active",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB bağlandı");

    // Mövcud məlumatları təmizlə
    await Category.deleteMany({});
    await Location.deleteMany({});
    await Asset.deleteMany({});
    console.log("Köhnə məlumatlar silindi");

    await Category.insertMany(categories);
    console.log(`${categories.length} kateqoriya əlavə edildi`);

    await Location.insertMany(locations);
    console.log(`${locations.length} lokasiya əlavə edildi`);

    await Asset.insertMany(sampleAssets);
    console.log(`${sampleAssets.length} aktiv əlavə edildi`);

    console.log("✓ Seed tamamlandı");
    process.exit(0);
  } catch (err) {
    console.error("Seed xətası:", err.message);
    process.exit(1);
  }
};

seed();