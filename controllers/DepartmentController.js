// controllers/departmentController.js
import Department from "../models/department.js";
import Asset from "../models/Asset.js";
import mongoose from "mongoose";

// 📋 Bütün şöbələri gətir
export const getDepartments = async (req, res) => {
  try {
    const userId = req.params.userId;
    const departments = await Department.findByUserId(userId);
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('❌ GET DEPARTMENTS Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ➕ Yeni şöbə yarat
export const createDepartment = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, description, managerName, location, budget } = req.body;

    // Eyni adda şöbə var mı?
    const existing = await Department.findOne({ userId, name });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: "Bu adda şöbə artıq mövcuddur" 
      });
    }

    const newDepartment = await Department.create({
      userId,
      name,
      description,
      managerName,
      location,
      budget: parseFloat(budget) || 0
    });

    res.status(201).json({
      success: true,
      data: newDepartment,
      message: "Şöbə uğurla yaradıldı"
    });
  } catch (error) {
    console.error('❌ CREATE DEPARTMENT Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✏️ Şöbəni yenilə
export const updateDepartment = async (req, res) => {
  try {
    const { userId, departmentId } = req.params;
    const updates = req.body;

    const department = await Department.findOne({ _id: departmentId, userId });
    if (!department) {
      return res.status(404).json({ success: false, message: "Şöbə tapılmadı" });
    }

    // Ad dəyişirsə, unikallığı yoxla
    if (updates.name && updates.name !== department.name) {
      const existing = await Department.findOne({ userId, name: updates.name });
      if (existing) {
        return res.status(400).json({ success: false, message: "Bu adda şöbə artıq mövcuddur" });
      }
    }

    Object.assign(department, updates);
    await department.save();

    res.json({
      success: true,
      data: department,
      message: "Şöbə uğurla yeniləndi"
    });
  } catch (error) {
    console.error('❌ UPDATE DEPARTMENT Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🗑️ Şöbəni sil (və ya deaktiv et)
export const deleteDepartment = async (req, res) => {
  try {
    const { userId, departmentId } = req.params;

    const department = await Department.findOne({ _id: departmentId, userId });
    if (!department) {
      return res.status(404).json({ success: false, message: "Şöbə tapılmadı" });
    }

    // Bu şöbəyə aid asset varmı?
    const assetsInDepartment = await Asset.countDocuments({ 
      department: departmentId, 
      isDeleted: false 
    });

    if (assetsInDepartment > 0) {
      // Əgər asset varsa, silmə, sadəcə deaktiv et
      department.isActive = false;
      await department.save();
      return res.json({
        success: true,
        message: "Şöbə deaktiv edildi (ona aid vəsaitlər olduğu üçün silinmədi)",
        data: department
      });
    }

    // Heç bir asset yoxdursa, tam sil
    await department.deleteOne();
    res.json({
      success: true,
      message: "Şöbə uğurla silindi"
    });
  } catch (error) {
    console.error('❌ DELETE DEPARTMENT Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📊 Şöbələr üzrə statistikalar (branch qrafiki üçün)
export const getDepartmentStatistics = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Bütün assetləri department-ləri ilə birlikdə çək
    const assets = await Asset.find({ 
      userId, 
      isDeleted: false 
    }).populate('department', 'name');

    // Department-lərə görə qruplaşdır
    const branchMap = new Map();

    assets.forEach(asset => {
      // Əgər department varsa, onun adını istifadə et, yoxsa location-u (backup)
      const branchName = asset.department?.name || asset.location || 'Digər';
      
      if (!branchMap.has(branchName)) {
        branchMap.set(branchName, 0);
      }
      branchMap.set(branchName, branchMap.get(branchName) + (asset.currentValue || 0));
    });

    // Frontend-in gözlədiyi formata çevir: { name, value }
    const branchData = Array.from(branchMap.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));

    res.json({
      success: true,
      data: branchData.sort((a, b) => b.value - a.value)
    });
  } catch (error) {
    console.error('❌ GET DEPARTMENT STATISTICS Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};