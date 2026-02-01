// routes/employeeRoutes.js
import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeType,
  getEmployeePayments,
  addEmployeePayment,
  calculateEmployeeTaxes,
  updateSalary,
  getNotifications,
  getNotificationById,
  addNotification,
  updateNotification,
  deleteNotification,
  
  getNotificationsByStatus,
  addLeave,
  downloadExcelEmployees,
  updateLeave,
  deleteLeave,
  getEmployeeLeaves,
  getEmployeeLeaveById,
  addAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeeAttendances,
  getAttendanceById,
  getEmployeesByCompany,
  getEmployeesByStatus,
  getEmployeeImage,
  getSalaryReport,
  bulkUpdateSalaries,
  downloadEmployeeFile,
  viewEmployeeFile,
  updateEmployeeTaxData,
  uploadEmployeeFile,
  deleteEmployeeFile,
  upload
} from "../controllers/employeeController.js";

import protect from "../middlewares/authMiddleware.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Employees
 *     description: İşçi idarəetmə əməliyyatları
 *   - name: Employee Files
 *     description: İşçi fayl idarəetməsi
 *   - name: Salary & Taxes
 *     description: Maaş və vergi əməliyyatları
 *   - name: Payments
 *     description: Ödəniş əməliyyatları
 *   - name: Notifications
 *     description: Bildiriş idarəetməsi
 *   - name: Leaves
 *     description: Məzuniyyət idarəetməsi
 *   - name: Attendance
 *     description: İş giriş-çıxışı
 *   - name: Reports
 *     description: Hesabat və export əməliyyatları
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 *   schemas:
 *     Employee:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - position
 *         - tin
 *         - idSerialNumber
 *         - phone
 *         - companyId
 *         - hireDate
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         firstName:
 *           type: string
 *           example: "Əli"
 *         lastName:
 *           type: string
 *           example: "Hüseynov"
 *         email:
 *           type: string
 *           format: email
 *           example: "ali.huseynov@example.com"
 *         position:
 *           type: string
 *           example: "Backend Developer"
 *         tin:
 *           type: string
 *           example: "1234567890"
 *         idSerialNumber:
 *           type: string
 *           example: "AZE1234567"
 *         phone:
 *           type: string
 *           example: "+994501234567"
 *         companyId:
 *           type: string
 *           example: "507f1f77bcf86cd799439022"
 *         employeeType:
 *           type: string
 *           enum: [state, private]
 *           default: "private"
 *           example: "private"
 *         gross:
 *           type: number
 *           format: double
 *           example: 2500.00
 *         tax:
 *           type: number
 *           format: double
 *           example: 150.00
 *         social_pay:
 *           type: number
 *           format: double
 *           example: 200.00
 *         Net_salary:
 *           type: number
 *           format: double
 *           example: 2150.00
 *         salary_status:
 *           type: string
 *           enum: [pending, paid, cancelled]
 *           default: "pending"
 *           example: "pending"
 *         Department:
 *           type: string
 *           example: "IT Department"
 *         status:
 *           type: string
 *           enum: [active, on_leave, terminated]
 *           default: "active"
 *           example: "active"
 *         hireDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     EmployeeInput:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - position
 *         - tin
 *         - idSerialNumber
 *         - phone
 *         - companyId
 *         - hireDate
 *       properties:
 *         firstName:
 *           type: string
 *           example: "Əli"
 *         lastName:
 *           type: string
 *           example: "Hüseynov"
 *         email:
 *           type: string
 *           example: "ali.huseynov@example.com"
 *         position:
 *           type: string
 *           example: "Backend Developer"
 *         tin:
 *           type: string
 *           example: "1234567890"
 *         idSerialNumber:
 *           type: string
 *           example: "AZE1234567"
 *         phone:
 *           type: string
 *           example: "+994501234567"
 *         companyId:
 *           type: string
 *           example: "507f1f77bcf86cd799439022"
 *         employeeType:
 *           type: string
 *           enum: [state, private]
 *           example: "private"
 *         gross:
 *           type: number
 *           example: 2500.00
 *         Department:
 *           type: string
 *           example: "IT Department"
 *         hireDate:
 *           type: string
 *           format: date
 *           example: "2024-01-15"
 * 
 *     Payment:
 *       type: object
 *       required:
 *         - paymentType
 *         - amount
 *         - paymentDate
 *         - forMonth
 *       properties:
 *         paymentType:
 *           type: string
 *           enum: [salary, bonus, advance, other]
 *           example: "salary"
 *         amount:
 *           type: number
 *           example: 2150.00
 *         paymentDate:
 *           type: string
 *           format: date-time
 *         forMonth:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           example: "completed"
 *         description:
 *           type: string
 *           example: "Yanvar ayı maaşı"
 * 
 *     Leave:
 *       type: object
 *       properties:
 *         leaveType:
 *           type: string
 *           enum: [annual, sick, unpaid, other]
 *           example: "annual"
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2024-06-01"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2024-06-10"
 *         totalDaysRequested:
 *           type: number
 *           example: 10
 *         status:
 *           type: string
 *           enum: [approved, pending, rejected]
 *           example: "pending"
 *         reason:
 *           type: string
 *           example: "İllik məzuniyyət"
 * 
 *     Attendance:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-05-15"
 *         checkInTime:
 *           type: string
 *           format: date-time
 *         checkOutTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [present, absent, on_leave, remote]
 *           example: "present"
 *         isLate:
 *           type: boolean
 *           example: false
 * 
 *     Notification:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Yeni maaş hesablanmışdır"
 *         type:
 *           type: string
 *           enum: [info, warning, success, error]
 *           example: "info"
 *         isRead:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *   parameters:
 *     idParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: İşçi ID-si
 *       example: "507f1f77bcf86cd799439011"
 * 
 *     employeeIdParam:
 *       in: path
 *       name: employeeId
 *       required: true
 *       schema:
 *         type: string
 *       description: İşçi ID-si
 *       example: "507f1f77bcf86cd799439011"
 * 
 *     companyIdParam:
 *       in: path
 *       name: companyId
 *       required: true
 *       schema:
 *         type: string
 *       description: Şirkət ID-si
 *       example: "507f1f77bcf86cd799439022"
 * 
 *     notificationIdParam:
 *       in: path
 *       name: notificationId
 *       required: true
 *       schema:
 *         type: string
 *       description: Bildiriş ID-si
 * 
 *     leaveIdParam:
 *       in: path
 *       name: leaveId
 *       required: true
 *       schema:
 *         type: string
 *       description: Məzuniyyət ID-si
 * 
 *     attendanceIdParam:
 *       in: path
 *       name: attendanceId
 *       required: true
 *       schema:
 *         type: string
 *       description: İş girişi ID-si
 * 
 *   responses:
 *     Success:
 *       description: Əməliyyat uğurla tamamlandı
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: true
 *               message:
 *                 type: string
 *                 example: "Əməliyyat uğurla tamamlandı"
 * 
 *     NotFound:
 *       description: Məlumat tapılmadı
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Məlumat tapılmadı"
 * 
 *     ValidationError:
 *       description: Validasiya xətası
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Validasiya xətası"
 * 
 *     ServerError:
 *       description: Server xətası
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Server xətası baş verdi"
 */

// ===================== FAYL ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/employees/{id}/upload:
 *   post:
 *     summary: İşçiyə fayl yüklə
 *     tags: [Employee Files]
 *     description: İşçiyə sənəd yükləmək üçün
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF, JPEG, PNG, DOC, DOCX faylları (max 10MB)
 *     responses:
 *       200:
 *         description: Fayl uğurla yükləndi
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
 *                   example: "Fayl uğurla yükləndi"
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     originalName:
 *                       type: string
 *                     contentType:
 *                       type: string
 *                     fileSize:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/:id/upload',
  upload.single('file'),protect,
  uploadEmployeeFile
);
/**
 * @swagger
 * /api/employees/by-status:
 *   get:
 *     summary: Status-a görə işçiləri gətir
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, on_leave, terminated]
 *         description: İşçi statusu
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *     responses:
 *       200:
 *         description: İşçi siyahısı
 */
router.get('/by-status', getEmployeesByStatus);
/**
 * @swagger
 * /api/employees/{id}/file:
 *   get:
 *     summary: İşçi faylını göstər
 *     tags: [Employee Files]
 *     description: İşçinin yüklədiyi faylı göstərir (browser-də açır)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Fayl uğurla göstərildi
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/file',protect, viewEmployeeFile);

/**
 * @swagger
 * /api/employees/{id}/file:
 *   delete:
 *     summary: İşçi faylını sil
 *     tags: [Employee Files]
 *     description: İşçinin yüklədiyi faylı silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id/file',protect, deleteEmployeeFile);

// ===================== ƏSAS İŞÇİ ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/employees/company/{companyid}/download-excel:
 *   get:
 *     summary: Şirkət işçilərini Excel formatında endir
 *     tags: [Reports]
 *     description: Şirkətin bütün işçilərini Excel faylı kimi endirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyid
 *         required: true
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *     responses:
 *       200:
 *         description: Excel faylı uğurla yaradıldı
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/company/:companyid/download-excel",protect, downloadExcelEmployees);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Yeni işçi yarat
 *     tags: [Employees]
 *     description: Yeni işçi yaradır və vergiləri avtomatik hesablayır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
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
 *                   example: "İşçi yaradıldı. Vergilər avtomatik hesablandı."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/",protect, createEmployee);

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Bütün işçiləri getir
 *     tags: [Employees]
 *     description: Filtirlənmiş işçilər siyahısını gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Şirkət ID-si üzrə filtr
 *       - in: query
 *         name: employeeType
 *         schema:
 *           type: string
 *           enum: [state, private]
 *         description: İşçi növü üzrə filtr
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Departament üzrə filtr
 *       - in: query
 *         name: salary_status
 *         schema:
 *           type: string
 *           enum: [pending, paid, cancelled]
 *         description: Maaş statusu üzrə filtr
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
 *                   example: 10
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/",protect, getAllEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: ID ilə işçi getir
 *     tags: [Employees]
 *     description: Müəyyən edilmiş ID-yə sahib işçini gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
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
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id",protect, getEmployeeById);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: İşçi məlumatlarını yenilə
 *     tags: [Employees]
 *     description: İşçi məlumatlarını yeniləyir və vergiləri avtomatik hesablayır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
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
 *                   example: "İşçi yeniləndi. Vergilər avtomatik hesablandı."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:id",protect, updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: İşçini sil
 *     tags: [Employees]
 *     description: İşçini sistemdən silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:id",protect, deleteEmployee);

// ===================== MAAŞ VƏ VERGİ ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/employees/{id}/employee-type:
 *   put:
 *     summary: İşçi növünü yenilə
 *     tags: [Salary & Taxes]
 *     description: İşçi növünü (dövlət/özəl) yeniləyir və vergiləri avtomatik hesablayır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeType
 *             properties:
 *               employeeType:
 *                 type: string
 *                 enum: [state, private]
 *                 example: "private"
 *     responses:
 *       200:
 *         description: İşçi növü uğurla yeniləndi
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
 *                   example: "İşçi növü və vergilər yeniləndi"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:id/employee-type",protect, updateEmployeeType);

/**
 * @swagger
 * /api/employees/{id}/salary:
 *   put:
 *     summary: Maaş məlumatlarını yenilə
 *     tags: [Salary & Taxes]
 *     description: İşçinin maaş məlumatlarını yeniləyir və vergiləri avtomatik hesablayır
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gross:
 *                 type: number
 *                 minimum: 400
 *                 example: 2500
 *               employeeType:
 *                 type: string
 *                 enum: [state, private]
 *                 example: "private"
 *               salary_status:
 *                 type: string
 *                 enum: [pending, paid, cancelled]
 *                 example: "pending"
 *     responses:
 *       200:
 *         description: Maaş məlumatları uğurla yeniləndi
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
 *                   example: "Maaş məlumatları yeniləndi. Vergilər avtomatik hesablandı."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:id/salary",protect, updateSalary);

/**
 * @swagger
 * /api/employees/{id}/tax-data:
 *   put:
 *     summary: Vergi məlumatlarını yenilə
 *     tags: [Salary & Taxes]
 *     description: İşçinin vergi məlumatlarını yeniləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gross:
 *                 type: number
 *                 minimum: 400
 *                 example: 2500
 *               employeeType:
 *                 type: string
 *                 enum: [state, private]
 *                 example: "private"
 *     responses:
 *       200:
 *         description: Vergi məlumatları uğurla yeniləndi
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
 *                   example: "Vergi məlumatları yeniləndi"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:id/tax-data",protect, updateEmployeeTaxData);

/**
 * @swagger
 * /api/employees/calculate-taxes:
 *   post:
 *     summary: Vergiləri hesabla (demo üçün)
 *     tags: [Salary & Taxes]
 *     description: Verilən məlumatlara əsasən vergiləri hesablayır
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gross
 *             properties:
 *               gross:
 *                 type: number
 *                 minimum: 400
 *                 example: 2500
 *               employeeType:
 *                 type: string
 *                 enum: [state, private]
 *                 example: "private"
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     gross:
 *                       type: number
 *                     employeeType:
 *                       type: string
 *                     taxes:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/calculate-taxes",protect, calculateEmployeeTaxes);

// ===================== ÖDƏNİŞ ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/employees/{id}/payments:
 *   get:
 *     summary: İşçi ödənişlərini getir
 *     tags: [Payments]
 *     description: İşçinin bütün ödəniş tarixçəsini gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment_history:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payment'
 *                     tax_payment_history:
 *                       type: array
 *                     last_payment_date:
 *                       type: string
 *                       format: date-time
 *                     next_payment_date:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/payments",protect, getEmployeePayments);

/**
 * @swagger
 * /api/employees/{id}/payments:
 *   post:
 *     summary: İşçi ödənişi əlavə et
 *     tags: [Payments]
 *     description: İşçiyə yeni ödəniş əlavə edir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentType
 *               - amount
 *               - paymentDate
 *               - forMonth
 *             properties:
 *               paymentType:
 *                 type: string
 *                 enum: [salary, bonus, advance, other]
 *                 example: "salary"
 *               amount:
 *                 type: number
 *                 example: 2150.00
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-05-15"
 *               forMonth:
 *                 type: string
 *                 format: date
 *                 example: "2024-05-01"
 *               description:
 *                 type: string
 *                 example: "Yanvar ayı maaşı"
 *               taxDetails:
 *                 type: object
 *     responses:
 *       201:
 *         description: Ödəniş uğurla əlavə edildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Ödəniş əlavə edildi"
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *                     last_payment_date:
 *                       type: string
 *                       format: date-time
 *                     next_payment_date:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:id/payments",protect, addEmployeePayment);

// ===================== NOTIFICATION ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/employees/{id}/notifications:
 *   get:
 *     summary: İşçi bildirişlərini getir
 *     tags: [Notifications]
 *     description: İşçinin bütün bildirişlərini gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 count:
 *                   type: number
 *                   example: 5
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/notifications",protect, getNotifications);

/**
 * @swagger
 * /api/employees/{id}/notifications/{notificationId}:
 *   get:
 *     summary: Bildirişi ID ilə getir
 *     tags: [Notifications]
 *     description: Müəyyən edilmiş ID-yə sahib bildirişi gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - $ref: '#/components/parameters/notificationIdParam'
 *     responses:
 *       200:
 *         description: Bildiriş uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/notifications/:notificationId",protect, getNotificationById);

/**
 * @swagger
 * /api/employees/{id}/notifications:
 *   post:
 *     summary: Bildiriş əlavə et
 *     tags: [Notifications]
 *     description: İşçiyə yeni bildiriş əlavə edir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Yeni maaş hesablanmışdır"
 *               type:
 *                 type: string
 *                 enum: [info, warning, success, error]
 *                 example: "info"
 *     responses:
 *       201:
 *         description: Bildiriş uğurla əlavə edildi
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
 *                     $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "Bildiriş əlavə edildi"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:id/notifications",protect, addNotification);

/**
 * @swagger
 * /api/employees/{id}/notifications/{notificationId}:
 *   put:
 *     summary: Bildirişi yenilə
 *     tags: [Notifications]
 *     description: Mövcud bildirişi yeniləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - $ref: '#/components/parameters/notificationIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [info, warning, success, error]
 *               isRead:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bildiriş uğurla yeniləndi
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
 *                     $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "Bildiriş yeniləndi"
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:id/notifications/:notificationId",protect, updateNotification);

/**
 * @swagger
 * /api/employees/{id}/notifications/{notificationId}:
 *   delete:
 *     summary: Bildirişi sil
 *     tags: [Notifications]
 *     description: Bildirişi sistemdən silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - $ref: '#/components/parameters/notificationIdParam'
 *     responses:
 *       200:
 *         description: Bildiriş uğurla silindi
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
 *                     $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "Bildiriş silindi"
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:id/notifications/:notificationId",protect, deleteNotification);

/**
 * @swagger
 * /api/employees/{id}/notifications:
 *   delete:
 *     summary: Bütün bildirişləri təmizlə
 *     tags: [Notifications]
 *     description: İşçinin bütün bildirişlərini təmizləyir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/employees/{id}/notifications-filter:
 *   get:
 *     summary: Bildirişləri statusa görə filter et
 *     tags: [Notifications]
 *     description: Bildirişləri oxunub-oxunmama statusuna görə filter edir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [read, unread]
 *         description: Bildiriş statusu
 *     responses:
 *       200:
 *         description: Bildirişlər uğurla filter edildi
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
 *                     $ref: '#/components/schemas/Notification'
 *                 count:
 *                   type: number
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/notifications-filter",protect, getNotificationsByStatus);

// ===================== MƏZUNİYYƏT ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/employees/{employeeId}/leaves:
 *   get:
 *     summary: İşçinin bütün məzuniyyətlərini getir
 *     tags: [Leaves]
 *     description: İşçinin bütün məzuniyyət tarixçəsini gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Leave'
 *                 count:
 *                   type: number
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:employeeId/leaves",protect, getEmployeeLeaves);

/**
 * @swagger
 * /api/employees/{employeeId}/leaves/{leaveId}:
 *   get:
 *     summary: Xüsusi məzuniyyəti getir
 *     tags: [Leaves]
 *     description: Müəyyən edilmiş ID-yə sahib məzuniyyəti gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/leaveIdParam'
 *     responses:
 *       200:
 *         description: Məzuniyyət uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Leave'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:employeeId/leaves/:leaveId",protect, getEmployeeLeaveById);

/**
 * @swagger
 * /api/employees/{employeeId}/leaves:
 *   post:
 *     summary: Məzuniyyət əlavə et
 *     tags: [Leaves]
 *     description: İşçiyə yeni məzuniyyət əlavə edir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Leave'
 *     responses:
 *       200:
 *         description: Məzuniyyət uğurla əlavə edildi
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
 *                     $ref: '#/components/schemas/Leave'
 *                 message:
 *                   type: string
 *                   example: "Məzuniyyət əlavə edildi"
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:employeeId/leaves",protect, addLeave);

/**
 * @swagger
 * /api/employees/{employeeId}/leaves/{leaveId}:
 *   put:
 *     summary: Məzuniyyət yenilə
 *     tags: [Leaves]
 *     description: Mövcud məzuniyyəti yeniləyir
 *     security:
 *       - bearerAuth: []
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
 *                     $ref: '#/components/schemas/Leave'
 *                 message:
 *                   type: string
 *                   example: "Məzuniyyət yeniləndi"
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:employeeId/leaves/:leaveId",protect, updateLeave);

/**
 * @swagger
 * /api/employees/{employeeId}/leaves/{leaveId}:
 *   delete:
 *     summary: Məzuniyyət sil
 *     tags: [Leaves]
 *     description: Məzuniyyəti sistemdən silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/leaveIdParam'
 *     responses:
 *       200:
 *         description: Məzuniyyət uğurla silindi
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
 *                     $ref: '#/components/schemas/Leave'
 *                 message:
 *                   type: string
 *                   example: "Məzuniyyət silindi"
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:employeeId/leaves/:leaveId",protect, deleteLeave);

// ===================== İŞ GİRİŞİ ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/employees/{employeeId}/attendances:
 *   get:
 *     summary: İşçinin bütün iş girişlərini getir
 *     tags: [Attendance]
 *     description: İşçinin bütün iş giriş tarixçəsini gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     responses:
 *       200:
 *         description: İş girişləri uğurla gətirildi
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
 *                     $ref: '#/components/schemas/Attendance'
 *                 count:
 *                   type: number
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:employeeId/attendances",protect, getEmployeeAttendances);

/**
 * @swagger
 * /api/employees/{employeeId}/attendances/{attendanceId}:
 *   get:
 *     summary: Xüsusi iş girişini getir
 *     tags: [Attendance]
 *     description: Müəyyən edilmiş ID-yə sahib iş girişini gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/attendanceIdParam'
 *     responses:
 *       200:
 *         description: İş girişi uğurla gətirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:employeeId/attendances/:attendanceId",protect, getAttendanceById);

/**
 * @swagger
 * /api/employees/{employeeId}/attendances:
 *   post:
 *     summary: İş girişi əlavə et
 *     tags: [Attendance]
 *     description: İşçiyə yeni iş girişi əlavə edir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attendance'
 *     responses:
 *       200:
 *         description: İş girişi uğurla əlavə edildi
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
 *                     $ref: '#/components/schemas/Attendance'
 *                 message:
 *                   type: string
 *                   example: "İş girişi əlavə edildi"
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:employeeId/attendances",protect, addAttendance);

/**
 * @swagger
 * /api/employees/{employeeId}/attendances/{attendanceId}:
 *   put:
 *     summary: İş girişi yenilə
 *     tags: [Attendance]
 *     description: Mövcud iş girişini yeniləyir
 *     security:
 *       - bearerAuth: []
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
 *         description: İş girişi uğurla yeniləndi
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
 *                     $ref: '#/components/schemas/Attendance'
 *                 message:
 *                   type: string
 *                   example: "İş girişi yeniləndi"
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:employeeId/attendances/:attendanceId",protect, updateAttendance);

/**
 * @swagger
 * /api/employees/{employeeId}/attendances/{attendanceId}:
 *   delete:
 *     summary: İş girişi sil
 *     tags: [Attendance]
 *     description: İş girişini sistemdən silir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/employeeIdParam'
 *       - $ref: '#/components/parameters/attendanceIdParam'
 *     responses:
 *       200:
 *         description: İş girişi uğurla silindi
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
 *                     $ref: '#/components/schemas/Attendance'
 *                 message:
 *                   type: string
 *                   example: "İş girişi silindi"
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:employeeId/attendances/:attendanceId",protect, deleteAttendance);

// ===================== ŞİRKƏT ƏMƏLİYYATLARI =====================

/**
 * @swagger
 * /api/employees/company/{companyId}:
 *   get:
 *     summary: Şirkətə görə işçiləri getir
 *     tags: [Employees]
 *     description: Müəyyən edilmiş şirkətə aid işçiləri gətirir
 *     security:
 *       - bearerAuth: []
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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 count:
 *                   type: number
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/company/:companyId",protect, getEmployeesByCompany);


// ===================== DİGƏR ƏMƏLİYYATLAR =====================

/**
 * @swagger
 * /api/employees/{id}/download:
 *   get:
 *     summary: İşçi faylını endir
 *     tags: [Employee Files]
 *     description: İşçinin yüklədiyi faylı endirir (download)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Fayl uğurla endirildi
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/download",protect, downloadEmployeeFile);

/**
 * @swagger
 * /api/employees/{id}/view:
 *   get:
 *     summary: İşçi faylını göstər
 *     tags: [Employee Files]
 *     description: İşçinin yüklədiyi faylı göstərir (view)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Fayl uğurla göstərildi
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/view",protect, viewEmployeeFile);

/**
 * @swagger
 * /api/employees/{id}/image:
 *   get:
 *     summary: İşçinin şəklini getir
 *     tags: [Employee Files]
 *     description: İşçinin profil şəklini gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Şəkil uğurla gətirildi
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkisiz giriş
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id/image",protect, getEmployeeImage);

/**
 * @swagger
 * /api/employees/reports/salaries:
 *   get:
 *     summary: Maaş hesabatı al
 *     tags: [Reports]
 *     description: Maaş hesabatını gətirir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Ay (format: YYYY-MM)
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: İl
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Şirkət ID-si
 *       - in: query
 *         name: employeeType
 *         schema:
 *           type: string
 *           enum: [state, private]
 *         description: İşçi növü
 *     responses:
 *       200:
 *         description: Maaş hesabatı uğurla gətirildi
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
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalEmployees:
 *                       type: number
 *                     totalGross:
 *                       type: number
 *                     totalTax:
 *                       type: number
 *                     totalSocial:
 *                       type: number
 *                     totalNet:
 *                       type: number
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/reports/salaries",protect, getSalaryReport);

/**
 * @swagger
 * /api/employees/salaries/bulk:
 *   put:
 *     summary: Toplu maaş yeniləməsi
 *     tags: [Salary & Taxes]
 *     description: Birdən çox işçinin maaşını yeniləyir
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - employeeId
 *                   properties:
 *                     employeeId:
 *                       type: string
 *                     gross:
 *                       type: number
 *                     employeeType:
 *                       type: string
 *                       enum: [state, private]
 *     responses:
 *       200:
 *         description: Maaşlar uğurla yeniləndi
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
 *                 errors:
 *                   type: array
 *                 message:
 *                   type: string
 *                   example: "10 işçinin maaşı yeniləndi"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/salaries/bulk",protect, bulkUpdateSalaries);

export default router;