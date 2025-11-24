// routes/employees.js
import express from "express";
import multer from "multer";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeImage,
  updateSalary,
  getNotifications,
  getNotificationById,
  addNotification,
  updateNotification,
  deleteNotification,
  clearNotifications,
  getNotificationsByStatus,
  addLeave,
  updateLeave,
  deleteLeave,
  getEmployeeLeaves,
  addAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeeAttendances,
  getEmployeesByCompany,
  getEmployeesByStatus,
  getEmployeeLeaveById,
  getAttendanceById,
  updateEmployeeType,
  getEmployeePayments,
  addEmployeePayment,
  updateEmployeeTaxData,
  calculateEmployeeTaxes,
  downloadEmployeeFile,
  viewEmployeeFile,
} from "../controllers/employeeController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.use(protect);
/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: İşçilərin idarə olunması
 */

/**
 * @swagger

 * tags:
 *   name: Employees
 *   description: İşçi idarəetmə əməliyyatları
 *   name: Notifications
 *   description: Bildiriş idarəetmə əməliyyatları
 *   name: Leaves
 *   description: Məzuniyyət idarəetmə əməliyyatları
 *   name: Attendance
 *   description: İş vaxtı qeydləri
 *   name: Payments
 *   description: Ödəniş və vergi əməliyyatları
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       required:
 *         - name
 *         - surname
 *         - email
 *         - position
 *         - department
 *         - salary
 *       properties:
 *         _id:
 *           type: string
 *           description: İşçinin avtomatik yaranan ID-si
 *         name:
 *           type: string
 *           description: Ad
 *           example: "Əli"
 *         surname:
 *           type: string
 *           description: Soyad
 *           example: "Məmmədov"
 *         email:
 *           type: string
 *           format: email
 *           description: Email ünvanı
 *           example: "eli.mammadov@example.com"
 *         phone:
 *           type: string
 *           description: Telefon nömrəsi
 *           example: "+994501234567"
 *         position:
 *           type: string
 *           description: Vəzifə
 *           example: "Proqramçı"
 *         department:
 *           type: string
 *           description: Şöbə
 *           example: "IT"
 *         salary:
 *           type: number
 *           description: Aylıq maaş
 *           example: 2500
 *         employeeType:
 *           type: string
 *           enum: [full-time, part-time, contract, temporary]
 *           description: İşçi növü
 *           default: "full-time"
 *         hireDate:
 *           type: string
 *           format: date
 *           description: İşə qəbul tarixi
 *           example: "2024-01-15"
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended, terminated]
 *           description: Status
 *           default: "active"
 *         address:
 *           type: string
 *           description: Ünvan
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Doğum tarixi
 *         image:
 *           type: string
 *           description: Şəkil URL-i
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *           example: "Yeni maaş tənzimləməsi"
 *         message:
 *           type: string
 *           example: "Maaşınız 10% artırıldı"
 *         type:
 *           type: string
 *           enum: [info, warning, success, error]
 *           example: "success"
 *         status:
 *           type: string
 *           enum: [unread, read]
 *           default: "unread"
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Leave:
 *       type: object
 *       required:
 *         - startDate
 *         - endDate
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2024-02-01"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2024-02-05"
 *         type:
 *           type: string
 *           enum: [annual, sick, maternity, unpaid, other]
 *           example: "annual"
 *         reason:
 *           type: string
 *           example: "Ailəvi məzuniyyət"
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           default: "pending"
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Attendance:
 *       type: object
 *       required:
 *         - date
 *         - checkIn
 *       properties:
 *         _id:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-01-20"
 *         checkIn:
 *           type: string
 *           format: time
 *           example: "09:00"
 *         checkOut:
 *           type: string
 *           format: time
 *           example: "18:00"
 *         hoursWorked:
 *           type: number
 *           example: 8
 *         status:
 *           type: string
 *           enum: [present, absent, late, half-day]
 *           example: "present"
 *         notes:
 *           type: string
 *
 *     Payment:
 *       type: object
 *       required:
 *         - amount
 *         - paymentDate
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *         amount:
 *           type: number
 *           example: 2500
 *         paymentDate:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *         type:
 *           type: string
 *           enum: [salary, bonus, advance, other]
 *           example: "salary"
 *         description:
 *           type: string
 *           example: "Yanvar ayı maaşı"
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           default: "completed"
 *
 *   parameters:
 *     employeeIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: İşçi ID-si
 *     companyIdParam:
 *       in: path
 *       name: companyId
 *       required: true
 *       schema:
 *         type: string
 *       description: Şirkət ID-si
 *     notificationIdParam:
 *       in: path
 *       name: notificationId
 *       required: true
 *       schema:
 *         type: string
 *       description: Bildiriş ID-si
 *     leaveIdParam:
 *       in: path
 *       name: leaveId
 *       required: true
 *       schema:
 *         type: string
 *       description: Məzuniyyət ID-si
 *     attendanceIdParam:
 *       in: path
 *       name: attendanceId
 *       required: true
 *       schema:
 *         type: string
 *       description: İş vaxtı ID-si
 */

// 👥 EMPLOYEE CRUD ROUTES

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Bütün işçiləri gətir
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Şöbə üzrə filter
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Vəzifə üzrə filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Status üzrə filter
 *     responses:
 *       200:
 *         description: İşçilər uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 count:
 *                   type: number
 *                   example: 25

 */
router.get("/", getAllEmployees);

/**
 * @swagger
 * /api/employees/company/{companyId}:
 *   get:

 *     summary: Şirkətə aid işçiləri gətir
 *     tags: [Employees]
 *     parameters:
 *       - $ref: '#/components/parameters/companyIdParam'
 *     responses:
 *       200:
 *         description: İşçilər uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 */
router.get("/company/:companyId", getEmployeesByCompany);

/**
 * @swagger
 * /api/employees/status:
 *   get:

 *     summary: Status üzrə işçiləri gətir
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended, terminated]
 *         description: İşçi statusu
 *     responses:
 *       200:
 *         description: İşçilər uğurla gətirildi

 */
router.get("/status", getEmployeesByStatus);

/**
 * @swagger


 * /api/employees:
 *   post:
 *     summary: Yeni işçi yarat
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 required: true
 *                 example: "Əli"
 *               surname:
 *                 type: string
 *                 required: true
 *                 example: "Məmmədov"
 *               email:
 *                 type: string
 *                 format: email
 *                 required: true
 *                 example: "eli.mammadov@example.com"
 *               phone:
 *                 type: string
 *                 example: "+994501234567"
 *               position:
 *                 type: string
 *                 required: true
 *                 example: "Proqramçı"
 *               department:
 *                 type: string
 *                 required: true
 *                 example: "IT"
 *               salary:
 *                 type: number
 *                 required: true
 *                 example: 2500
 *               employeeType:
 *                 type: string
 *                 enum: [full-time, part-time, contract, temporary]
 *                 example: "full-time"
 *               hireDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               address:
 *                 type: string
 *                 example: "Bakı, Azerbaijan"
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: İşçinin şəkli və ya sənədi
 *     responses:
 *       201:
 *         description: İşçi uğurla yaradıldı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *                 message:
 *                   type: string
 *                   example: "İşçi uğurla əlavə edildi"
 */
router.post("/", upload.single("file"), createEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: ID ilə işçini gətir
 *     tags: [Employees]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     responses:
 *       200:
 *         description: İşçi uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: İşçi tapılmadı

 */
router.get("/:id", getEmployeeById);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: İşçi məlumatlarını yenilə
 *     tags: [Employees]

 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Əli"
 *               surname:
 *                 type: string
 *                 example: "Məmmədov"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "eli.mammadov@example.com"
 *               phone:
 *                 type: string
 *                 example: "+994501234567"
 *               position:
 *                 type: string
 *                 example: "Baş Proqramçı"
 *               department:
 *                 type: string
 *                 example: "IT"
 *               salary:
 *                 type: number
 *                 example: 3000
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, terminated]
 *                 example: "active"
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: İşçi uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *                 message:
 *                   type: string
 *                   example: "İşçi məlumatları uğurla yeniləndi"

 */
router.put("/:id", upload.single("file"), updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: İşçini sil
 *     tags: [Employees]

 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     responses:
 *       200:
 *         description: İşçi uğurla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "İşçi uğurla silindi"
 *       404:
 *         description: İşçi tapılmadı
 */
router.delete("/:id", deleteEmployee);

// 🖼️ IMAGE ROUTES

/**
 * @swagger
 * /api/employees/{id}/image:
 *   get:

 *     summary: İşçi şəklini gətir
 *     tags: [Employees]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     responses:
 *       200:
 *         description: Şəkil uğurla gətirildi
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Şəkil tapılmadı
 */
router.get("/:id/image", getEmployeeImage);

// 💰 SALARY & TAX ROUTES

/**
 * @swagger
 * /api/employees/{id}/salary:
 *   put:
 *     summary: İşçinin maaşını yenilə
 *     tags: [Employees]

 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               salary:
 *                 type: number
 *                 required: true
 *                 example: 3000
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-02-01"
 *               reason:
 *                 type: string
 *                 example: "Təşəkkür bonusu"
 *     responses:
 *       200:
 *         description: Maaş uğurla yeniləndi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Maaş uğurla yeniləndi"
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 */
router.put("/:id/salary", updateSalary);

/**
 * @swagger
 * /api/employees/{id}/employee-type:
 *   put:
 *     summary: İşçi növünü yenilə
 *     tags: [Employees]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeType:
 *                 type: string
 *                 required: true
 *                 enum: [full-time, part-time, contract, temporary]
 *                 example: "full-time"
 *     responses:
 *       200:
 *         description: İşçi növü uğurla yeniləndi
 */
router.put("/:id/employee-type", updateEmployeeType);

/**
 * @swagger
 * /api/employees/{id}/payments:
 *   get:
 *     summary: İşçi ödənişlərini gətir
 *     tags: [Payments]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: date
 *         description: Ay üzrə filter (YYYY-MM)
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: İl üzrə filter
 *     responses:
 *       200:
 *         description: Ödənişlər uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 */
router.get("/:id/payments", getEmployeePayments);

/**
 * @swagger
 * /api/employees/{id}/payments:
 *   post:
 *     summary: İşçi üçün ödəniş əlavə et
 *     tags: [Payments]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 required: true
 *                 example: 2500
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 required: true
 *                 example: "2024-01-31"
 *               type:
 *                 type: string
 *                 required: true
 *                 enum: [salary, bonus, advance, other]
 *                 example: "salary"
 *               description:
 *                 type: string
 *                 example: "Yanvar ayı maaşı"
 *     responses:
 *       201:
 *         description: Ödəniş uğurla əlavə edildi
 */
router.post("/:id/payments", addEmployeePayment);

/**
 * @swagger
 * /api/employees/{id}/tax-data:
 *   put:
 *     summary: İşçinin vergi məlumatlarını yenilə
 *     tags: [Payments]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taxId:
 *                 type: string
 *                 example: "1234567890"
 *               socialSecurityNumber:
 *                 type: string
 *                 example: "12345678901"
 *               taxRate:
 *                 type: number
 *                 example: 14
 *               exemptions:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Vergi məlumatları uğurla yeniləndi
 */
router.put("/:id/tax-data", updateEmployeeTaxData);

/**
 * @swagger
 * /api/employees/{id}/calculate-taxes:
 *   post:
 *     summary: İşçi üçün vergiləri hesabla
 *     tags: [Payments]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 format: date
 *                 required: true
 *                 example: "2024-01"
 *               year:
 *                 type: string
 *                 required: true
 *                 example: "2024"
 *     responses:
 *       200:
 *         description: Vergilər uğurla hesablandı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     grossSalary:
 *                       type: number
 *                     incomeTax:
 *                       type: number
 *                     socialSecurity:
 *                       type: number
 *                     netSalary:
 *                       type: number
 */
router.post("/:id/calculate-taxes", calculateEmployeeTaxes);

// 🔔 NOTIFICATION ROUTES

/**
 * @swagger
 * /api/employees/{id}/notifications:
 *   get:
 *     summary: İşçinin bildirişlərini gətir
 *     tags: [Notifications]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     responses:
 *       200:
 *         description: Bildirişlər uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 */
router.get("/:id/notifications", getNotifications);

/**
 * @swagger
 * /api/employees/{id}/notifications/filter:
 *   get:
 *     summary: Status üzrə bildirişləri gətir
 *     tags: [Notifications]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [unread, read]
 *         description: Bildiriş statusu
 *     responses:
 *       200:
 *         description: Bildirişlər uğurla gətirildi

 */
router.get("/:id/notifications/filter", getNotificationsByStatus);

/**
 * @swagger

 * /api/employees/{id}/notifications:
 *   post:
 *     summary: İşçi üçün bildiriş əlavə et
 *     tags: [Notifications]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 required: true
 *                 example: "Yeni maaş tənzimləməsi"
 *               message:
 *                 type: string
 *                 required: true
 *                 example: "Maaşınız 10% artırıldı"
 *               type:
 *                 type: string
 *                 enum: [info, warning, success, error]
 *                 example: "success"
 *     responses:
 *       201:
 *         description: Bildiriş uğurla əlavə edildi

 */
router.post("/:id/notifications", addNotification);

/**
 * @swagger
 * /api/employees/{id}/notifications/{notificationId}:

 *   get:
 *     summary: ID ilə bildirişi gətir
 *     tags: [Notifications]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/notificationIdParam'
 *     responses:
 *       200:
 *         description: Bildiriş uğurla gətirildi
 */
router.get("/:id/notifications/:notificationId", getNotificationById);

/**
 * @swagger
 * /api/employees/{id}/notifications/{notificationId}:
 *   put:
 *     summary: Bildirişi yenilə
 *     tags: [Notifications]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/notificationIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       200:
 *         description: Bildiriş uğurla yeniləndi

 */
router.put("/:id/notifications/:notificationId", updateNotification);

/**
 * @swagger
 * /api/employees/{id}/notifications/{notificationId}:
 *   delete:

 *     summary: Bildirişi sil
 *     tags: [Notifications]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/notificationIdParam'
 *     responses:
 *       200:
 *         description: Bildiriş uğurla silindi

 */
router.delete("/:id/notifications/:notificationId", deleteNotification);

/**
 * @swagger
 * /api/employees/{id}/notifications:
 *   delete:

 *     summary: Bütün bildirişləri təmizlə
 *     tags: [Notifications]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     responses:
 *       200:
 *         description: Bildirişlər uğurla təmizləndi
 */
router.delete("/:id/notifications", clearNotifications);

// 📅 LEAVE ROUTES

/**
 * @swagger
 * /api/employees/{employeeId}/leaves:
 *   get:

 *     summary: İşçinin məzuniyyətlərini gətir
 *     tags: [Leaves]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Məzuniyyət statusu
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: İl üzrə filter
 *     responses:
 *       200:
 *         description: Məzuniyyətlər uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Leave'

 */
router.get("/:employeeId/leaves", getEmployeeLeaves);

/**
 * @swagger
 * /api/employees/{employeeId}/leaves:
 *   post:
 *     summary: İşçi üçün məzuniyyət əlavə et
 *     tags: [Leaves]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 required: true
 *                 example: "2024-02-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 required: true
 *                 example: "2024-02-05"
 *               type:
 *                 type: string
 *                 required: true
 *                 enum: [annual, sick, maternity, unpaid, other]
 *                 example: "annual"
 *               reason:
 *                 type: string
 *                 example: "Ailəvi məzuniyyət"
 *     responses:
 *       201:
 *         description: Məzuniyyət uğurla əlavə edildi

 */
router.post("/:employeeId/leaves", addLeave);

/**
 * @swagger
 * /api/employees/{employeeId}/leaves/{leaveId}:

 *   get:
 *     summary: ID ilə məzuniyyəti gətir
 *     tags: [Leaves]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/leaveIdParam'
 *     responses:
 *       200:
 *         description: Məzuniyyət uğurla gətirildi
 */
router.get("/:employeeId/leaves/:leaveId", getEmployeeLeaveById);

/**
 * @swagger
 * /api/employees/{employeeId}/leaves/{leaveId}:
 *   put:
 *     summary: Məzuniyyəti yenilə
 *     tags: [Leaves]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/leaveIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Leave'
 *     responses:
 *       200:
 *         description: Məzuniyyət uğurla yeniləndi

 */
router.put("/:employeeId/leaves/:leaveId", updateLeave);

/**
 * @swagger
 * /api/employees/{employeeId}/leaves/{leaveId}:
 *   delete:

 *     summary: Məzuniyyəti sil
 *     tags: [Leaves]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/leaveIdParam'
 *     responses:
 *       200:
 *         description: Məzuniyyət uğurla silindi
 */
router.delete("/:employeeId/leaves/:leaveId", deleteLeave);

// ⏰ ATTENDANCE ROUTES

/**
 * @swagger
 * /api/employees/{employeeId}/attendances:
 *   get:

 *     summary: İşçinin iş vaxtı qeydlərini gətir
 *     tags: [Attendance]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: date
 *         description: Ay üzrə filter (YYYY-MM)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Xüsusi tarix üzrə filter
 *     responses:
 *       200:
 *         description: İş vaxtı qeydləri uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attendance'

 */
router.get("/:employeeId/attendances", getEmployeeAttendances);

/**
 * @swagger
 * /api/employees/{employeeId}/attendances:
 *   post:

 *     summary: İş vaxtı qeydi əlavə et
 *     tags: [Attendance]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 required: true
 *                 example: "2024-01-20"
 *               checkIn:
 *                 type: string
 *                 format: time
 *                 required: true
 *                 example: "09:00"
 *               checkOut:
 *                 type: string
 *                 format: time
 *                 example: "18:00"
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, half-day]
 *                 example: "present"
 *               notes:
 *                 type: string
 *                 example: "Normal iş günü"
 *     responses:
 *       201:
 *         description: İş vaxtı qeydi uğurla əlavə edildi

 */
router.post("/:employeeId/attendances", addAttendance);

/**
 * @swagger
 * /api/employees/{employeeId}/attendances/{attendanceId}:

 *   get:
 *     summary: ID ilə iş vaxtı qeydini gətir
 *     tags: [Attendance]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/attendanceIdParam'
 *     responses:
 *       200:
 *         description: İş vaxtı qeydi uğurla gətirildi

 */
router.get("/:employeeId/attendances/:attendanceId", getAttendanceById);

/**
 * @swagger
 * /api/employees/{employeeId}/attendances/{attendanceId}:

 *   put:
 *     summary: İş vaxtı qeydini yenilə
 *     tags: [Attendance]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/attendanceIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attendance'
 *     responses:
 *       200:
 *         description: İş vaxtı qeydi uğurla yeniləndi
 */
router.put("/:employeeId/attendances/:attendanceId", updateAttendance);

/**
 * @swagger
 * /api/employees/{employeeId}/attendances/{attendanceId}:
 *   delete:
 *     summary: İş vaxtı qeydini sil
 *     tags: [Attendance]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/attendanceIdParam'
 *     responses:
 *       200:
 *         description: İş vaxtı qeydi uğurla silindi
 */
router.delete("/:employeeId/attendances/:attendanceId", deleteAttendance);

// 📁 FILE ROUTES

/**
 * @swagger
 * /api/employees/{id}/download:
 *   get:
 *     summary: İşçi faylını yüklə
 *     tags: [Employees]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     responses:
 *       200:
 *         description: Fayl uğurla yükləndi
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Fayl tapılmadı
 */
router.get("/:id/download", downloadEmployeeFile);

/**
 * @swagger
 * /api/employees/{id}/view:
 *   get:
 *     summary: İşçi faylını göstər
 *     tags: [Employees]
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     responses:
 *       200:
 *         description: Fayl uğurla göstərildi
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Fayl tapılmadı
 */
router.get("/:id/view", viewEmployeeFile);

export default router;
