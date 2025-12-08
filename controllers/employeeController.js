// controllers/employeeController.js
import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import taxCalculationService from "../services/taxCalculationService.js";
import multer from 'multer';
import excel from 'exceljs';


// ✅ Yeni işçi yarat (AVTOMATİK VERGİ İLƏ)
export const createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;
    
    // File upload varsa
    if (req.file) {
      employeeData.filename = req.file.originalname;
      employeeData.contentType = req.file.mimetype;
      employeeData.data = req.file.buffer;
    }

    // Əgər gross varsa, middleware avtomatik hesablayacaq
    if (employeeData.gross && employeeData.gross < 400) {
      return res.status(400).json({ 
        success: false,
        message: "Əməkhaqqı 400 AZN-dən aşağı ola bilməz" 
      });
    }

    const employee = await Employee.create(employeeData);
    
    res.status(201).json({
      success: true,
      data: employee,
      message: employeeData.gross 
        ? 'İşçi yaradıldı. Vergilər avtomatik hesablandı.' 
        : 'İşçi yaradıldı.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
export const uploadEmployeeFile = async (req, res) => {
  try {
    // Fayl yoxlanışı
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Fayl seçilməyib" 
      });
    }

    // İşçini findByIdAndUpdate ilə yenilə (validasiyanı atlamaq üçün)
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
          data: req.file.buffer,
          fileSize: req.file.size,
          originalName: req.file.originalname
        }
      },
      { 
        new: true, // Yenilənmiş versiyanı qaytar
        runValidators: false // Validasiyanı atla
      }
    );

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      message: "Fayl uğurla yükləndi",
      data: {
        filename: employee.filename,
        originalName: employee.originalName,
        contentType: employee.contentType,
        fileSize: employee.fileSize,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
// ✅ Bütün işçiləri getir
export const getAllEmployees = async (req, res) => {
  try {
    const { companyId, employeeType, department, salary_status } = req.query;
    let filter = {};
    
    if (companyId) filter.companyId = companyId;
    if (employeeType) filter.employeeType = employeeType;
    if (department) filter.Department = department;
    if (salary_status) filter.salary_status = salary_status;

    const employees = await Employee.find(filter).select("-data");
    
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Fayl yüklə
export const downloadEmployeeFile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee || !employee.data) {
      return res.status(404).json({ 
        success: false,
        message: "Fayl tapılmadı" 
      });
    }

    res.set({
      "Content-Type": employee.contentType,
      "Content-Disposition": `attachment; filename="${employee.originalName || employee.filename}"`,
      "Content-Length": employee.fileSize || employee.data.length
    });
    
    res.send(employee.data);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Fayl göstər


// Multer konfiqurasiyası (memory storage istifadə edirik)
const storage = multer.memoryStorage();
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Fayl tipini yoxlaya bilərsiniz (isteğe bağlı)
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Destəklənməyən fayl formatı'), false);
    }
  }
});

// ✅ İŞÇİYƏ FAYL YÜKLƏMƏ FUNKSİYASI


// ✅ İŞÇİNİN FAYLINI GÖSTƏRƏN FUNKSİYA (Sizin hazır kodu)
export const viewEmployeeFile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee || !employee.data) {
      return res.status(404).json({ 
        success: false,
        message: "Fayl tapılmadı" 
      });
    }

    res.set("Content-Type", employee.contentType);
    res.send(employee.data);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İŞÇİNİN FAYL MƏLUMATLARINI SİLƏN FUNKSİYA
export const deleteEmployeeFile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    // Fayl məlumatlarını təmizlə
    employee.filename = undefined;
    employee.contentType = undefined;
    employee.data = undefined;
    employee.fileSize = undefined;
    employee.originalName = undefined;

    await employee.save();

    res.json({
      success: true,
      message: "Fayl uğurla silindi"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
// ✅ ID ilə işçi getir
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-data");
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi məlumatlarını yenilə (AVTOMATİK VERGİ İLƏ)
export const updateEmployee = async (req, res) => {
  try {
    const updateData = req.body;

    if (req.file) {
      updateData.filename = req.file.originalname;
      updateData.contentType = req.file.mimetype;
      updateData.data = req.file.buffer;
      updateData.originalName = req.file.originalname;
      updateData.fileSize = req.file.size;
    }

    if (updateData.gross && updateData.gross < 400) {
      return res.status(400).json({ 
        success: false,
        message: "Əməkhaqqı 400 AZN-dən aşağı ola bilməz" 
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee,
      message: updateData.gross 
        ? 'İşçi yeniləndi. Vergilər avtomatik hesablandı.' 
        : 'İşçi yeniləndi.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçini sil
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }
    res.json({ 
      success: true,
      message: "İşçi silindi" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 💰 VERGİ VƏ ÖDƏNİŞ FUNKSİYALARI =====================

// ✅ İşçi növünü yenilə (AVTOMATİK VERGİ İLƏ)
export const updateEmployeeType = async (req, res) => {
  try {
    const { employeeType } = req.body;

    if (!['state', 'private'].includes(employeeType)) {
      return res.status(400).json({ 
        success: false,
        message: "İşçi növü yalnız 'state' və ya 'private' ola bilər" 
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { employeeType },
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee,
      message: 'İşçi növü və vergilər yeniləndi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi ödənişlərini gətir
export const getEmployeePayments = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("paymentHistory taxPaymentHistory lastPaymentDate nextPaymentDate");
    
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: {
        payment_history: employee.paymentHistory,
        tax_payment_history: employee.taxPaymentHistory,
        last_payment_date: employee.lastPaymentDate,
        next_payment_date: employee.nextPaymentDate
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi ödənişi əlavə et
export const addEmployeePayment = async (req, res) => {
  try {
    const { 
      paymentType, 
      amount, 
      paymentDate, 
      forMonth, 
      description, 
      taxDetails 
    } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const newPayment = {
      paymentType,
      amount,
      paymentDate: new Date(paymentDate),
      forMonth: new Date(forMonth),
      description,
      taxDetails,
      status: 'completed'
    };

    employee.paymentHistory.push(newPayment);
    employee.lastPaymentDate = new Date(paymentDate);
    employee.salary_status = 'paid';
    
    const nextPayment = new Date(paymentDate);
    nextPayment.setMonth(nextPayment.getMonth() + 1);
    employee.nextPaymentDate = nextPayment;

    await employee.save();

    res.status(201).json({
      success: true,
      data: {
        message: "Ödəniş əlavə edildi",
        payment: newPayment,
        last_payment_date: employee.lastPaymentDate,
        next_payment_date: employee.nextPaymentDate
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi vergi məlumatlarını yenilə (AVTOMATİK)
export const updateEmployeeTaxData = async (req, res) => {
  try {
    const { gross, employeeType } = req.body;

    if (gross && gross < 400) {
      return res.status(400).json({ 
        success: false,
        message: "Əməkhaqqı 400 AZN-dən aşağı ola bilməz" 
      });
    }

    const updateData = {};
    if (gross !== undefined) updateData.gross = gross;
    if (employeeType) updateData.employeeType = employeeType;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee,
      message: 'Vergi məlumatları yeniləndi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçi vergilərini hesabla (demo üçün)
export const calculateEmployeeTaxes = async (req, res) => {
  try {
    const { gross, employeeType } = req.body;

    if (!gross || gross < 400) {
      return res.status(400).json({ 
        success: false,
        message: "Əməkhaqqı 400 AZN-dən aşağı ola bilməz" 
      });
    }

    const taxResult = taxCalculationService.calculateAllTaxes(
      gross, 
      employeeType || 'private'
    );

    res.json({
      success: true,
      data: taxResult
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 💰 MAAŞ FUNKSİYALARI =====================

// ✅ Maaş məlumatlarını yenilə (AVTOMATİK VERGİ İLƏ)
export const updateSalary = async (req, res) => {
  try {
    const { gross, employeeType, salary_status } = req.body;

    if (gross && gross < 400) {
      return res.status(400).json({ 
        success: false,
        message: "Əməkhaqqı 400 AZN-dən aşağı ola bilməz" 
      });
    }

    const updateData = {};
    if (gross !== undefined) updateData.gross = gross;
    if (employeeType) updateData.employeeType = employeeType;
    if (salary_status) updateData.salary_status = salary_status;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee,
      message: 'Maaş məlumatları yeniləndi. Vergilər avtomatik hesablandı.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 🔔 NOTIFICATION FUNKSİYALARI =====================

// ✅ Bütün notificationları getir
export const getNotifications = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("Recent_Notifications");
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee.Recent_Notifications,
      count: employee.Recent_Notifications.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Xüsusi notificationu getir
export const getNotificationById = async (req, res) => {
  try {
    const { id, notificationId } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const notification = employee.Recent_Notifications.find(
      notif => notif._id.toString() === notificationId
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: "Bildiriş tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Notification əlavə et
export const addNotification = async (req, res) => {
  try {
    const { message, type = "info" } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false,
        message: "Message sahəsi mütləqdir" 
      });
    }

    const validTypes = ["info", "warning", "success", "error"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false,
        message: "Type yalnız 'info', 'warning', 'success', 'error' ola bilər" 
      });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const newNotification = {
      _id: new mongoose.Types.ObjectId(),
      message: message,
      type: type,
      isRead: false,
      createdAt: new Date()
    };

    employee.Recent_Notifications.push(newNotification);
    await employee.save();

    res.status(201).json({
      success: true,
      data: employee.Recent_Notifications,
      message: 'Bildiriş əlavə edildi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Notification yenilə
export const updateNotification = async (req, res) => {
  try {
    const { id, notificationId } = req.params;
    const updateData = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const notificationIndex = employee.Recent_Notifications.findIndex(
      notif => notif._id.toString() === notificationId
    );

    if (notificationIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: "Bildiriş tapılmadı" 
      });
    }

    employee.Recent_Notifications[notificationIndex] = {
      ...employee.Recent_Notifications[notificationIndex],
      ...updateData
    };

    await employee.save();

    res.json({
      success: true,
      data: employee.Recent_Notifications,
      message: 'Bildiriş yeniləndi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Notification sil
export const deleteNotification = async (req, res) => {
  try {
    const { id, notificationId } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    employee.Recent_Notifications = employee.Recent_Notifications.filter(
      notif => notif._id.toString() !== notificationId
    );

    await employee.save();

    res.json({ 
      success: true,
      data: employee.Recent_Notifications,
      message: 'Bildiriş silindi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Bütün notificationları təmizlə
export const clearNotifications = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { Recent_Notifications: [] },
      { new: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({ 
      success: true,
      message: "Bütün bildirişlər təmizləndi"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Notification filter et
export const getNotificationsByStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    let filteredNotifications = [];
    if (status === 'read') {
      filteredNotifications = employee.Recent_Notifications.filter(notif => notif.isRead === true);
    } else if (status === 'unread') {
      filteredNotifications = employee.Recent_Notifications.filter(notif => notif.isRead === false);
    } else {
      filteredNotifications = employee.Recent_Notifications;
    }

    res.json({
      success: true,
      data: filteredNotifications,
      count: filteredNotifications.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 📅 LEAVE FUNKSİYALARI =====================

// ✅ Məzuniyyət əlavə et
export const addLeave = async (req, res) => {
  try {
    const leaveData = req.body;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    employee.leaves.push(leaveData);
    await employee.save();

    res.json({
      success: true,
      data: employee.leaves,
      message: 'Məzuniyyət əlavə edildi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Məzuniyyət yenilə
export const updateLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const updateData = req.body;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const leave = employee.leaves.id(leaveId);
    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: "Məzuniyyət tapılmadı" 
      });
    }

    Object.assign(leave, updateData);
    await employee.save();

    res.json({
      success: true,
      data: employee.leaves,
      message: 'Məzuniyyət yeniləndi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Məzuniyyət sil
export const deleteLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    employee.leaves.pull(leaveId);
    await employee.save();

    res.json({ 
      success: true,
      data: employee.leaves,
      message: "Məzuniyyət silindi" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçinin bütün məzuniyyətlərini getir
export const getEmployeeLeaves = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId).select("leaves");
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee.leaves,
      count: employee.leaves.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Xüsusi məzuniyyəti getir
export const getEmployeeLeaveById = async (req, res) => {
  try {
    const { employeeId, leaveId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const leave = employee.leaves.find(leave => leave._id.toString() === leaveId);

    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: "Məzuniyyət tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== ⏰ ATTENDANCE FUNKSİYALARI =====================

// ✅ İş girişi əlavə et
export const addAttendance = async (req, res) => {
  try {
    const attendanceData = req.body;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    employee.attendances.push(attendanceData);
    await employee.save();

    res.json({
      success: true,
      data: employee.attendances,
      message: 'İş girişi əlavə edildi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İş girişi yenilə
export const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const updateData = req.body;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const attendance = employee.attendances.id(attendanceId);
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: "İş girişi tapılmadı" 
      });
    }

    Object.assign(attendance, updateData);
    await employee.save();

    res.json({
      success: true,
      data: employee.attendances,
      message: 'İş girişi yeniləndi'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İş girişi sil
export const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    employee.attendances.pull(attendanceId);
    await employee.save();

    res.json({ 
      success: true,
      data: employee.attendances,
      message: "İş girişi silindi" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Xüsusi iş girişini getir
export const getAttendanceById = async (req, res) => {
  try {
    const { employeeId, attendanceId } = req.params;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    const attendance = employee.attendances.find(
      att => att._id.toString() === attendanceId
    );
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: "İş girişi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçinin bütün iş girişlərini getir
export const getEmployeeAttendances = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId).select("attendances");
    if (!employee) {
      return res.status(404).json({ 
        success: false,
        message: "İşçi tapılmadı" 
      });
    }

    res.json({
      success: true,
      data: employee.attendances,
      count: employee.attendances.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 🏢 ŞİRKƏT FUNKSİYALARI =====================

// ✅ Şirkətə görə işçiləri getir
export const getEmployeesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const employees = await Employee.find({ companyId }).select("-data");
    
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Statusa görə işçiləri getir
export const getEmployeesByStatus = async (req, res) => {
  try {
    const { status, companyId } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (companyId) filter.companyId = companyId;

    const employees = await Employee.find(filter).select("-data");
    
    res.json({
      success: true,
      data: employees,
      count: employees.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ İşçinin şəklini getir
export const getEmployeeImage = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee || !employee.data) {
      return res.status(404).json({ 
        success: false,
        message: "Şəkil tapılmadı" 
      });
    }

    res.set("Content-Type", employee.contentType);
    res.send(employee.data);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 📊 HESABAT FUNKSİYALARI =====================

// ✅ Maaş hesabatı al
export const getSalaryReport = async (req, res) => {
  try {
    const { month, year, companyId, employeeType } = req.query;
    
    let filter = {};
    if (companyId) filter.companyId = companyId;
    if (employeeType) filter.employeeType = employeeType;
    
    const employees = await Employee.find(filter)
      .select("firstName lastName email position employeeType gross tax social_pay Net_salary salary_status Department");
    
    const summary = {
      totalEmployees: employees.length,
      totalGross: employees.reduce((sum, emp) => sum + (emp.gross || 0), 0),
      totalTax: employees.reduce((sum, emp) => sum + (emp.tax || 0), 0),
      totalSocial: employees.reduce((sum, emp) => sum + (emp.social_pay || 0), 0),
      totalNet: employees.reduce((sum, emp) => sum + (emp.Net_salary || 0), 0),
      stateEmployees: employees.filter(e => e.employeeType === 'state').length,
      privateEmployees: employees.filter(e => e.employeeType === 'private').length,
      paidEmployees: employees.filter(e => e.salary_status === 'paid').length,
      pendingEmployees: employees.filter(e => e.salary_status === 'pending').length
    };
    
    res.json({
      success: true,
      data: employees,
      summary,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Toplu maaş yeniləməsi (AVTOMATİK VERGİ İLƏ)
export const bulkUpdateSalaries = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ 
        success: false,
        message: 'Updates array göndərilməlidir' 
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { employeeId, gross, employeeType } = update;
        
        if (gross && gross < 400) {
          errors.push({ 
            employeeId, 
            message: 'Əməkhaqqı 400 AZN-dən aşağı ola bilməz' 
          });
          continue;
        }
        
        const updateData = {};
        if (gross !== undefined) updateData.gross = gross;
        if (employeeType) updateData.employeeType = employeeType;
        
        const employee = await Employee.findByIdAndUpdate(
          employeeId,
          updateData,
          { new: true }
        );
        
        if (!employee) {
          errors.push({ employeeId, message: 'İşçi tapılmadı' });
          continue;
        }

        results.push({
          employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          gross: employee.gross,
          tax: employee.tax,
          social_pay: employee.social_pay,
          Net_salary: employee.Net_salary
        });
      } catch (error) {
        errors.push({ employeeId: update.employeeId, message: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `${results.length} işçinin maaşı yeniləndi`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ===================== 📥 EXCEL DOWNLOAD FUNKSİYALARI =====================

// ✅ Bütün işçiləri Excel faylı olaraq endir
export const downloadExcelEmployees = async (req, res) => {
  try {
    console.log("🔍 Excel download endpoint çağırıldı - DEBUG MODE");
    
    const employees = await Employee.find({})
      .select('-data -contentType -filename -fileSize -originalName -__v')
      .lean();

    console.log(`📊 Excel üçün ${employees.length} işçi tapıldı`);
    
    // DEBUG: İlk 3 işçini göstər
    if (employees.length > 0) {
      console.log("✅ İlk 3 işçi məlumatı:");
      employees.slice(0, 3).forEach((emp, index) => {
        console.log(`İşçi ${index + 1}:`, {
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          gross: emp.gross,
          Net_salary: emp.Net_salary
        });
      });
    } else {
      console.log("⚠️ XƏBƏRDARLIQ: Heç bir işçi tapılmadı!");
      console.log("Verilənlər bazasında işçi var mı?");
    }

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("İşçilər");
    
    // Sütun başlıqları
    console.log("📋 Sütun başlıqları təyin edilir...");
    worksheet.columns = [
      { header: "Ad", key: "firstName", width: 15 },
      { header: "Soyad", key: "lastName", width: 15 },
      { header: "E-poçt", key: "email", width: 25 },
      { header: "Vəzifə", key: "position", width: 20 },
      { header: "VÖEN", key: "tin", width: 15 },
      { header: "Telefon", key: "phone", width: 15 },
      { header: "İşçi Növü", key: "employeeType", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Brüt Maaş", key: "gross", width: 12 },
      { header: "Net Maaş", key: "Net_salary", width: 12 },
      { header: "Maaş Statusu", key: "salary_status", width: 15 },
      { header: "Departament", key: "Department", width: 20 }
    ];
    
    // DEBUG: Worksheet sütunlarını yoxla
    console.log("✅ Worksheet sütunları:", worksheet.columns.length);
    
    // Məlumatları əlavə et
    console.log(`➕ ${employees.length} işçi məlumatı əlavə edilir...`);
    let addedRows = 0;
    
    employees.forEach((employee, index) => {
      const rowData = {
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        position: employee.position || '',
        tin: employee.tin || '',
        phone: employee.phone || '',
        employeeType: employee.employeeType === 'state' ? 'Dövlət' : 'Özəl',
        status: employee.status === 'active' ? 'Aktiv' : 
                employee.status === 'on_leave' ? 'İcazədə' : 'İşdən çıxıb',
        gross: employee.gross || 0,
        Net_salary: employee.Net_salary || 0,
        salary_status: employee.salary_status === 'paid' ? 'Ödənilib' : 
                      employee.salary_status === 'pending' ? 'Gözləmədə' : 'Ləğv edilib',
        Department: employee.Department || ''
      };
      
      console.log(`Row ${index + 1} data:`, rowData);
      worksheet.addRow(rowData);
      addedRows++;
    });
    
    console.log(`✅ Ümumi ${addedRows} sətir əlavə edildi`);
    
    // Əgər heç bir məlumat yoxdursa, test məlumatı əlavə et
    if (addedRows === 0) {
      console.log("🧪 Test məlumatı əlavə edilir...");
      worksheet.addRow({
        firstName: "Test",
        lastName: "İşçi",
        email: "test@example.com",
        position: "Developer",
        tin: "1234567890",
        phone: "0551234567",
        employeeType: "Özəl",
        status: "Aktiv",
        gross: 2500,
        Net_salary: 2000,
        salary_status: "Ödənilib",
        Department: "IT"
      });
      console.log("✅ Test məlumatı əlavə edildi");
    }
    
    // Başlığı qalın et
    console.log("🎨 Başlıq formatlanır...");
    worksheet.getRow(1).font = { bold: true };
    
    // Rəqəm formatı
    worksheet.getColumn('gross').numFmt = '#,##0.00';
    worksheet.getColumn('Net_salary').numFmt = '#,##0.00';
    
    // DEBUG: Worksheet məlumatlarını yoxla
    console.log(`📊 Worksheet-də ${worksheet.rowCount} sətir var`);
    console.log(`📊 Worksheet-də ${worksheet.columnCount} sütun var`);
    
    // Tarix üçün fayl adı
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `isciler_${timestamp}.xlsx`;
    
    console.log(`📁 Fayl adı: ${filename}`);
    
    // Header-ları təyin et
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    
    console.log("📤 Excel faylı göndərilir...");
    
    // Excel faylını Buffer olaraq yaradıb göndərək
    const buffer = await workbook.xlsx.writeBuffer();
    
    console.log(`✅ Excel faylı hazırdır. Ölçü: ${buffer.length} bytes`);
    
    res.send(buffer);
    res.end();
    
    console.log("✅ Excel faylı uğurla göndərildi");
    
  } catch (error) {
    console.error("❌ Excel export xətası:", error);
    res.status(500).json({ 
      success: false,
      message: "Excel faylı yaradılarkən xəta baş verdi: " + error.message,
      stack: error.stack
    });
  }
};