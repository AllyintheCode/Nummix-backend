import Employee from "../models/Employee.js";
import mongoose from "mongoose";

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

// ✅ Maaş məlumatlarını yenilə
export const updateSalary = async (req, res) => {
  try {
    const { gross, tax, social_pay, Net_salary, salary_status } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { gross, tax, social_pay, Net_salary, salary_status },
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

// ✅ Notification əlavə et
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

    // Adi JavaScript find metodu ilə axtarırıq
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

// ✅ Notification əlavə et (sizin artıq var, ampa yenə yazıram)
// ✅ Notification əlavə et - DÜZƏLDİLDİ
export const addNotification = async (req, res) => {
  try {
    const { message, type = "info" } = req.body;

    // Validation
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

    // DÜZƏLDİLMİŞ Notification object
    const newNotification = {
      _id: new mongoose.Types.ObjectId(),
      message: message, // message birbaşa string kimi
      type: type,       // type birbaşa string kimi
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

// ✅ Notificationu yenilə (məsələn, oxundu kimi qeyd etmək)
export const updateNotification = async (req, res) => {
  try {
    const { id, notificationId } = req.params;
    const updateData = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    // Adi JavaScript find metodu ilə axtarırıq
    const notificationIndex = employee.Recent_Notifications.findIndex(
      notif => notif._id== notificationId
    );

    if (notificationIndex === -1) {
      return res.status(404).json({ message: "Bildiriş tapılmadı" });
    }

    // Notificationu yeniləyirik
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

// ✅ Xüsusi notificationu sil - DÜZƏLDİLDİ
export const deleteNotification = async (req, res) => {
  try {
    const { id, notificationId } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "İşçi tapılmadı" });
    }

    // Adi JavaScript filter metodu ilə silirik
    employee.Recent_Notifications = employee.Recent_Notifications.filter(
      notif => notif._id== notificationId
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

// ✅ Notificationları statusa görə filter et (oxunub/oxunmayıb)
export const getNotificationsByStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query; // 'read' və ya 'unread'

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

// ===================== 📅 LEAVE CONTROLLERS =====================

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

    employee.leaves.get(leaveId);
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

    // `leaves` bir array olduğu için `find` kullanıyoruz.
    const leave = employee.leaves.find(leave => leave._id.toString() === leaveId);

    if (!leave) {
      return res.status(404).json({ message: "Məzuniyyət tapılmadı" });
     
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ===================== ⏰ ATTENDANCE CONTROLLERS =====================

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

    const attendance=employee.attendances.find(attendance=>attendance._id.toString()===attendanceId);
  if (!attendance) {
      return res.status(404).json({ message: "Məzuniyyət tapılmadı" });
     
    }
    res.json(attendance)

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