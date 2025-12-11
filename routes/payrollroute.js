// routes/payroll.js
import express from "express";
import {
  calculateTaxes,
  getCalculationExamples,
  calculateBulkTaxes,
} from "../controllers/payrollController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payroll
 *     description: Əməkhaqqı və vergi hesablamaları
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
 *     TaxCalculationRequest:
 *       type: object
 *       required:
 *         - salary
 *         - employeeType
 *       properties:
 *         salary:
 *           type: number
 *           minimum: 400
 *           description: Ümumi maaş (brüt) - minimum 400 AZN
 *           example: 2500
 *         employeeType:
 *           type: string
 *           enum: [state, private]
 *           description: İşçi növü
 *           example: "private"
 *
 *     TaxCalculationResponse:
 *       type: object
 *       properties:
 *         grossSalary:
 *           type: number
 *           description: Brüt maaş
 *           example: 2500
 *         employee:
 *           type: object
 *           properties:
 *             netSalary:
 *               type: number
 *               description: İşçinin aldığı xalis maaş
 *               example: 2150.50
 *             taxes:
 *               type: object
 *               properties:
 *                 incomeTax:
 *                   type: number
 *                   description: Gəlir vergisi
 *                   example: 150.00
 *                 dsmf:
 *                   type: number
 *                   description: Dövlət Sosial Müdafiə Fondu
 *                   example: 50.00
 *                 its:
 *                   type: number
 *                   description: İcbari Tibbi Sığorta
 *                   example: 12.50
 *                 ish:
 *                   type: number
 *                   description: İcbari Sosial Sığorta
 *                   example: 87.50
 *                 gvTax:
 *                   type: number
 *                   description: Gəlir vergisi (8000+ üçün)
 *                   example: 0.00
 *             totalTaxes:
 *               type: number
 *               description: İşçinin ümumi vergiləri
 *               example: 300.00
 *         employer:
 *           type: object
 *           properties:
 *             totalCost:
 *               type: number
 *               description: İşəgötürənin ümumi xərci
 *               example: 3200.00
 *             taxes:
 *               type: object
 *               properties:
 *                 dsmf:
 *                   type: number
 *                   description: Dövlət Sosial Müdafiə Fondu (işəgötürən)
 *                   example: 550.00
 *                 its:
 *                   type: number
 *                   description: İcbari Tibbi Sığorta (işəgötürən)
 *                   example: 100.00
 *                 ish:
 *                   type: number
 *                   description: İcbari Sosial Sığorta (işəgötürən)
 *                   example: 50.00
 *                 totalTaxes:
 *                   type: number
 *                   description: İşəgötürənin ümumi vergiləri
 *                   example: 700.00
 *         calculationDetails:
 *           type: object
 *           properties:
 *             date:
 *               type: string
 *               format: date-time
 *               example: "2024-05-20T10:30:00Z"
 *             taxYear:
 *               type: number
 *               example: 2024
 *
 *     CalculationExample:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "2500 AZN maaş üçün vergi hesablaması"
 *         salary:
 *           type: number
 *           example: 2500
 *         employeeType:
 *           type: string
 *           example: "private"
 *         result:
 *           $ref: '#/components/schemas/TaxCalculationResponse'
 *         description:
 *           type: string
 *           example: "Standart özəl sektor işçisi üçün vergi hesablaması"
 *
 *     BulkEmployee:
 *       type: object
 *       required:
 *         - salary
 *         - employeeType
 *       properties:
 *         employeeId:
 *           type: string
 *           description: İşçi ID-si
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: İşçi adı
 *           example: "Əli Məmmədov"
 *         salary:
 *           type: number
 *           minimum: 400
 *           example: 2500
 *         employeeType:
 *           type: string
 *           enum: [state, private]
 *           example: "private"
 *
 *     BulkTaxCalculationRequest:
 *       type: object
 *       required:
 *         - employees
 *       properties:
 *         employees:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BulkEmployee'
 *           minItems: 1
 *           description: İşçilər siyahısı
 *
 *     BulkTaxCalculationResult:
 *       type: object
 *       properties:
 *         employee:
 *           $ref: '#/components/schemas/BulkEmployee'
 *         calculation:
 *           $ref: '#/components/schemas/TaxCalculationResponse'
 *         success:
 *           type: boolean
 *           example: true
 *
 *     BulkTaxCalculationResponse:
 *       type: object
 *       properties:
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BulkTaxCalculationResult'
 *         summary:
 *           type: object
 *           properties:
 *             totalEmployees:
 *               type: number
 *               example: 3
 *             totalGrossSalary:
 *               type: number
 *               example: 7500
 *             totalNetSalary:
 *               type: number
 *               example: 6451.50
 *             totalEmployeeTaxes:
 *               type: number
 *               example: 1048.50
 *             totalEmployerTaxes:
 *               type: number
 *               example: 2100
 *             totalCostToCompany:
 *               type: number
 *               example: 9600
 *             averageTaxRate:
 *               type: number
 *               example: 13.98
 *             stateEmployees:
 *               type: number
 *               example: 1
 *             privateEmployees:
 *               type: number
 *               example: 2
 *
 *   responses:
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
 *               error:
 *                 type: string
 *                 example: "ValidationError"
 *               message:
 *                 type: string
 *                 example: "Maaş 400 AZN-dən aşağı ola bilməz"
 *
 *     CalculationError:
 *       description: Hesablama xətası
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "CalculationError"
 *               message:
 *                 type: string
 *                 example: "Vergi hesablanarkən xəta baş verdi"
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
 *               error:
 *                 type: string
 *                 example: "ServerError"
 *               message:
 *                 type: string
 *                 example: "Server xətası baş verdi"
 */

// ===================== VERGİ HESABLAMALARI =====================

/**
 * @swagger
 * /api/payroll/calculate:
 *   post:
 *     summary: Fərdi vergi hesablaması
 *     tags: [Payroll]
 *     description: |
 *       Tək işçi üçün vergi hesablaması aparır.
 *
 *       **Hesablama qaydaları:**
 *       - Minimum maaş: 400 AZN
 *       - İşçi növləri: state (dövlət) və private (özəl)
 *       - Vergi dərəcələri:
 *         - Gəlir vergisi: 14%
 *         - DSMF (işçi): 3%, (işəgötürən): 22%
 *         - İTS: 2%
 *         - İŞS: 0.5%
 *
 *       **Nümunə hesablama (2500 AZN, özəl sektor):**
 *       - Brüt maaş: 2500 AZN
 *       - DSMF (3%): 75 AZN
 *       - İTS (2%): 50 AZN
 *       - İŞS (0.5%): 12.5 AZN
 *       - Gəlir vergisi (14%): (2500 - 200) × 14% = 322 AZN
 *       - Ümumi vergi: 75 + 50 + 12.5 + 322 = 459.5 AZN
 *       - Xalis maaş: 2500 - 459.5 = 2040.5 AZN
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaxCalculationRequest'
 *           examples:
 *             privateEmployee:
 *               summary: Özəl sektor işçisi
 *               value:
 *                 salary: 2500
 *                 employeeType: "private"
 *             stateEmployee:
 *               summary: Dövlət sektor işçisi
 *               value:
 *                 salary: 1800
 *                 employeeType: "state"
 *             highSalary:
 *               summary: Yüksək maaşlı işçi
 *               value:
 *                 salary: 10000
 *                 employeeType: "private"
 *     responses:
 *       200:
 *         description: Vergi hesablaması uğurla tamamlandı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TaxCalculationResponse'
 *       400:
 *         description: Validasiya xətası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "ValidationError"
 *                 message:
 *                   type: string
 *                   example: "Maaş 400 AZN-dən aşağı ola bilməz"
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/calculate", protect, calculateTaxes);

/**
 * @swagger
 * /api/payroll/examples:
 *   get:
 *     summary: Hesablama nümunələrini gətir
 *     tags: [Payroll]
 *     description: |
 *       Müxtəlif maaş aralıqları və işçi növləri üçün hazır hesablama nümunələri.
 *       Bu nümunələr vergi hesablamalarının necə işlədiyini başa düşməyə kömək edir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeType
 *         schema:
 *           type: string
 *           enum: [state, private, all]
 *           default: all
 *         description: İşçi növü üzrə filtr
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: number
 *           minimum: 400
 *         description: Minimum maaş filteri
 *         example: 1000
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: number
 *         description: Maksimum maaş filteri
 *         example: 5000
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *           maximum: 50
 *         description: Nəticə sayı limiti
 *     responses:
 *       200:
 *         description: Hesablama nümunələri uğurla gətirildi
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
 *                     $ref: '#/components/schemas/CalculationExample'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalExamples:
 *                       type: number
 *                       example: 8
 *                     salaryRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                           example: 600
 *                         max:
 *                           type: number
 *                           example: 15000
 *                         average:
 *                           type: number
 *                           example: 3850
 *                     employeeTypeBreakdown:
 *                       type: object
 *                       properties:
 *                         state:
 *                           type: number
 *                           example: 3
 *                         private:
 *                           type: number
 *                           example: 5
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/examples", protect, getCalculationExamples);

/**
 * @swagger
 * /api/payroll/calculate-bulk:
 *   post:
 *     summary: Toplu vergi hesablaması
 *     tags: [Payroll]
 *     description: |
 *       Birdən çox işçi üçün eyni vaxtda vergi hesablaması aparır.
 *       İdeal olaraq bütün şirkət işçiləri üçün aylıq hesablamalarda istifadə edilə bilər.
 *
 *       **Toplu hesablamanın faydaları:**
 *       - Bir dəfəyə çoxlu işçi hesablanır
 *       - Ümumi xərclər və vergilər görünür
 *       - Excel export üçün hazır məlumat
 *       - Müqayisəli analiz imkanı
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkTaxCalculationRequest'
 *           examples:
 *             smallCompany:
 *               summary: Kiçik şirkət nümunəsi
 *               value:
 *                 employees: [
 *                   {
 *                     employeeId: "507f1f77bcf86cd799439011",
 *                     name: "Əli Məmmədov",
 *                     salary: 2500,
 *                     employeeType: "private"
 *                   },
 *                   {
 *                     employeeId: "507f1f77bcf86cd799439012",
 *                     name: "Aygün Həsənova",
 *                     salary: 1800,
 *                     employeeType: "private"
 *                   }
 *                 ]
 *             mixedEmployees:
 *               summary: Qarışıq işçi növləri
 *               value:
 *                 employees: [
 *                   {
 *                     employeeId: "507f1f77bcf86cd799439013",
 *                     name: "Rəşid Əliyev",
 *                     salary: 3200,
 *                     employeeType: "private"
 *                   },
 *                   {
 *                     employeeId: "507f1f77bcf86cd799439014",
 *                     name: "Leyla Məmmədova",
 *                     salary: 1500,
 *                     employeeType: "state"
 *                   },
 *                   {
 *                     employeeId: "507f1f77bcf86cd799439015",
 *                     name: "Nərmin Əliyeva",
 *                     salary: 4500,
 *                     employeeType: "private"
 *                   }
 *                 ]
 *     responses:
 *       200:
 *         description: Toplu hesablama uğurla tamamlandı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BulkTaxCalculationResponse'
 *       400:
 *         description: Validasiya xətası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Yetkisiz giriş
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/calculate-bulk", protect, calculateBulkTaxes);

export default router;
