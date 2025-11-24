import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import taxCalculationService from "../services/taxCalculationService.js";

// ✅ Yeni işçi yarat
export const createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;
    
    // File upload varsa
    if (req.file) {
      employeeData.filename = req.file.originalname;
      employeeData.contentType = req.file.mimetype;
      employeeData.data = req.file.buffer;
    }

    // Vergi hesablamalarını avtomatik et
    if (employeeData.gross && employeeData.employeeType) {
      const taxResult = taxCalculationService.calculateAllTaxes(
        employeeData.gross, 
        employeeData.employeeType
      );
      
      employeeData.tax = taxResult.employee.taxes.incomeTax;
      employeeData.social_pay = taxResult.employee.taxes.socialInsurance;
      employeeData.Net_salary = taxResult.employee.netSalary;
    }

    const employee = await Employee.create(employeeData);
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Bütün işçiləri getir
export const getAllEmployees = async (req, res) => {
  try {
    const { companyId } = req.query;
    let filter = {};
    
    if (companyId) {
      filter.companyId = companyId;
    }

    const employees = await Employee.find(filter).select("-data"); // Bufferı göndərmə
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ✅ FAYLI YÜKLƏ (download)
export const downloadEmployeeFile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee || !employee.data) {
      return res.status(404).json({ message: "Fayl tapılmadı" });
    }

    // Fayl məlumatlarını set et
    res.set({
      "Content-Type": employee.contentType,
      "Content-Disposition": `attachment; filename="${employee.originalName}"`,
      "Content-Length": employee.fileSize
    });
    
    // Binary datanı göndər
    res.send(employee.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ FAYLI GÖSTƏR (browserdə - şəkillər, pdf-lər üçün)
export const viewEmployeeFile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee || !employee.data) {
      return res.status(404).json({ message: "Fayl tapılmadı" });
    }

    // Content-Type-i set et
    res.set("Content-Type", employee.contentType);
    
    // Binary datanı göndər
    res.send(employee.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ✅ ID ilə işçi getir
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-data");
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçi məlumatlarını yenilə
export const updateEmployee = async (req, res) => {
  try {
    const updateData = req.body;

    // File upload varsa
    if (req.file) {
      updateData.filename = req.file.originalname;
      updateData.contentType = req.file.mimetype;
      updateData.data = req.file.buffer;
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçini sil
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }
    res.json({ message: "İşçi silindi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 💰 YENİ VERGİ VƏ ÖDƏNİŞ FUNKSİYALARI =====================

// ✅ İşçi növünü yenilə (dövlət/özəl)
export const updateEmployeeType = async (req, res) => {
  try {
    const { employeeType } = req.body;

    if (!['state', 'private'].includes(employeeType)) {
      return res.status(400).json({ message: "İşçi növü yalnız 'state' və ya 'private' ola bilər" });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { employeeType },
      { new: true, runValidators: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    // İşçi növü dəyişdikdə vergiləri yenidən hesabla
    if (employee.gross > 0) {
      const taxResult = taxCalculationService.calculateAllTaxes(employee.gross, employeeType);
      
      await Employee.findByIdAndUpdate(req.params.id, {
        tax: taxResult.employee.taxes.incomeTax,
        social_pay: taxResult.employee.taxes.socialInsurance,
        Net_salary: taxResult.employee.netSalary
      });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçi ödənişlərini gətir
export const getEmployeePayments = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select("paymentHistory taxPaymentHistory lastPaymentDate nextPaymentDate");
    
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    res.json({
      payment_history: employee.paymentHistory,
      tax_payment_history: employee.taxPaymentHistory,
      last_payment_date: employee.lastPaymentDate,
      next_payment_date: employee.nextPaymentDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      return res.status(404).json({ message: "İşçi tapılmadı" });
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
    
    // Növbəti ödəniş tarixini hesabla (1 ay sonra)
    const nextPayment = new Date(paymentDate);
    nextPayment.setMonth(nextPayment.getMonth() + 1);
    employee.nextPaymentDate = nextPayment;

    // Maaş statusunu yenilə
    employee.salary_status = 'paid';

    await employee.save();

    res.status(201).json({
      message: "Ödəniş uğurla əlavə edildi",
      payment: newPayment,
      last_payment_date: employee.lastPaymentDate,
      next_payment_date: employee.nextPaymentDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçi vergi məlumatlarını yenilə
export const updateEmployeeTaxData = async (req, res) => {
  try {
    const { gross, employeeType } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    // Vergiləri hesabla
    const taxResult = taxCalculationService.calculateAllTaxes(gross, employeeType || employee.employeeType);

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        gross,
        employeeType: employeeType || employee.employeeType,
        tax: taxResult.employee.taxes.incomeTax,
        social_pay: taxResult.employee.taxes.socialInsurance,
        Net_salary: taxResult.employee.netSalary,
        salary_status: 'pending'
      },
      { new: true, runValidators: true }
    ).select("-data");

    res.json({
      employee: updatedEmployee,
      tax_calculation: taxResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçi vergilərini hesabla
export const calculateEmployeeTaxes = async (req, res) => {
  try {
    const { gross, employeeType } = req.body;

    if (!gross || gross < 400) {
      return res.status(400).json({ message: "Əməkhaqqı 400 AZN-dən aşağı ola bilməz" });
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

// ===================== 💰 MÖVCUD MAAŞ FUNKSİYASI (YENİLƏNİB) =====================

// ✅ Maaş məlumatlarını yenilə
export const updateSalary = async (req, res) => {
  try {
    const { gross, employeeType, salary_status } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    let updateData = { salary_status };

    // Gross maaş verilibsə, vergiləri avtomatik hesabla
    if (gross) {
      const taxResult = taxCalculationService.calculateAllTaxes(
        gross, 
        employeeType || employee.employeeType
      );

      updateData.gross = gross;
      updateData.tax = taxResult.employee.taxes.incomeTax;
      updateData.social_pay = taxResult.employee.taxes.socialInsurance;
      updateData.Net_salary = taxResult.employee.netSalary;
    }

    // İşçi növü dəyişibsə
    if (employeeType) {
      updateData.employeeType = employeeType;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-data");

    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 🔔 MÖVCUD NOTIFICATION FUNKSİYALARI =====================

// ✅ Bütün notificationları getir
export const getNotifications = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("Recent_Notifications");
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    res.json(employee.Recent_Notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Xüsusi notificationu ID ilə getir
export const getNotificationById = async (req, res) => {
  try {
    const { id, notificationId } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    const notification = employee.Recent_Notifications.find(
      notif => notif._id == notificationId
    );

    if (!notification) {
      return res.status(404).json({ message: "Bildiriş tapılmadı" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Notification əlavə et
export const addNotification = async (req, res) => {
  try {
    const { message, type = "info" } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message sahəsi mütləqdir" });
    }

    const validTypes = ["info", "warning", "success", "error"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: "Type yalnız 'info', 'warning', 'success', 'error' ola bilər" 
      });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
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

    res.status(201).json(employee.Recent_Notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Notificationu yenilə
export const updateNotification = async (req, res) => {
  try {
    const { id, notificationId } = req.params;
    const updateData = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    const notificationIndex = employee.Recent_Notifications.findIndex(
      notif => notif._id == notificationId
    );

    if (notificationIndex === -1) {
      return res.status(404).json({ message: "Bildiriş tapılmadı" });
    }

    employee.Recent_Notifications[notificationIndex] = {
      ...employee.Recent_Notifications[notificationIndex],
      ...updateData
    };

    await employee.save();

    res.json(employee.Recent_Notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Xüsusi notificationu sil
export const deleteNotification = async (req, res) => {
  try {
    const { id, notificationId } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    employee.Recent_Notifications = employee.Recent_Notifications.filter(
      notif => notif._id == notificationId
    );

    await employee.save();

    res.json({ 
      message: "Bildiriş silindi", 
      notifications: employee.Recent_Notifications 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { Recent_Notifications: [] },
      { new: true }
    ).select("-data");

    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    res.json({ 
      message: "Bütün bildirişlər təmizləndi", 
      notifications: employee.Recent_Notifications 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Notificationları statusa görə filter et
export const getNotificationsByStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    let filteredNotifications = [];
    if (status === 'read') {
      filteredNotifications = employee.Recent_Notifications.filter(notif => notif.isRead === true);
    } else if (status === 'unread') {
      filteredNotifications = employee.Recent_Notifications.filter(notif => notif.isRead === false);
    } else {
      filteredNotifications = employee.Recent_Notifications;
    }

    res.json(filteredNotifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 📅 MÖVCUD LEAVE FUNKSİYALARI =====================

// ✅ İşçiyə məzuniyyət əlavə et
export const addLeave = async (req, res) => {
  try {
    const leaveData = req.body;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    employee.leaves.push(leaveData);
    await employee.save();

    res.json(employee.leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Məzuniyyəti yenilə
export const updateLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const updateData = req.body;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    const leave = employee.leaves.id(leaveId);
    if (!leave) {
      return res.status(404).json({ message: "Məzuniyyət tapılmadı" });
    }

    Object.assign(leave, updateData);
    await employee.save();

    res.json(employee.leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Məzuniyyəti sil
export const deleteLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    employee.leaves.pull(leaveId);
    await employee.save();

    res.json({ message: "Məzuniyyət silindi", leaves: employee.leaves });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçinin bütün məzuniyyətlərini getir
export const getEmployeeLeaves = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId).select("leaves");
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    res.json(employee.leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeLeaveById = async (req, res) => {
  try {
    const { employeeId, leaveId } = req.params;

    const employee = await Employee.findById(employeeId).select("leaves");
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    const leave = employee.leaves.find(leave => leave._id.toString() === leaveId);

    if (!leave) {
      return res.status(404).json({ message: "Məzuniyyət tapılmadı" });
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== ⏰ MÖVCUD ATTENDANCE FUNKSİYALARI =====================

// ✅ İşçiyə iş girişi əlavə et
export const addAttendance = async (req, res) => {
  try {
    const attendanceData = req.body;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    employee.attendances.push(attendanceData);
    await employee.save();

    res.json(employee.attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İş girişini yenilə
export const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const updateData = req.body;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    const attendance = employee.attendances.id(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "İş girişi tapılmadı" });
    }

    Object.assign(attendance, updateData);
    await employee.save();

    res.json(employee.attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İş girişini sil
export const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    employee.attendances.pull(attendanceId);
    await employee.save();

    res.json({ message: "İş girişi silindi", attendances: employee.attendances });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAttendanceById = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    const attendance = employee.attendances.find(attendance => attendance._id.toString() === attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Məzuniyyət tapılmadı" });
    }
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçinin bütün iş girişlərini getir
export const getEmployeeAttendances = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId).select("attendances");
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    res.json(employee.attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================== 🏢 MÖVCUD ŞİRKƏT FUNKSİYALARI =====================

// ✅ Şirkətə görə işçiləri getir
export const getEmployeesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const employees = await Employee.find({ companyId }).select("-data");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ İşçinin şəklini/getir
export const getEmployeeImage = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee || !employee.data) {
      return res.status(404).json({ message: "Şəkil tapılmadı" });
    }

    res.set("Content-Type", employee.contentType);
    res.send(employee.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};