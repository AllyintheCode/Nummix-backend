// routes/payroll.js
import express from "express";
import {
  calculateTaxes,
  getCalculationExamples,
  calculateBulkTaxes
} from "../controllers/payrollController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payroll
 *   description: Əməkhaqqı və vergi hesablamaları
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TaxCalculation:
 *       type: object
 *       required:
 *         - grossSalary
 *       properties:
 *         grossSalary:
 *           type: number
 *           description: Ümumi maaş (brüt)
 *           example: 2500
 *         incomeTax:
 *           type: number
 *           description: Gəlir vergisi
 *           example: 350
 *         socialSecurity:
 *           type: number
 *           description: Sosial sığorta haqqı
 *           example: 200
 *         unemploymentInsurance:
 *           type: number
 *           description: İşsizlik sığortası
 *           example: 12.5
 *         netSalary:
 *           type: number
 *           description: Xalis maaş
 *           example: 1937.5
 *         totalDeductions:
 *           type: number
 *           description: Ümumi tutulmalar
 *           example: 562.5
 *         calculationDate:
 *           type: string
 *           format: date-time
 *           description: Hesablama tarixi
 * 
 *     TaxCalculationRequest:
 *       type: object
 *       required:
 *         - grossSalary
 *       properties:
 *         grossSalary:
 *           type: number
 *           description: Ümumi maaş (brüt)
 *           example: 2500
 *         includeSocialSecurity:
 *           type: boolean
 *           description: Sosial sığorta daxil edilsin?
 *           default: true
 *         includeUnemployment:
 *           type: boolean
 *           description: İşsizlik sığortası daxil edilsin?
 *           default: true
 *         taxYear:
 *           type: number
 *           description: Vergi ili
 *           example: 2024
 *         exemptions:
 *           type: number
 *           description: Vergi güzəştləri sayı
 *           example: 1
 *         additionalDeductions:
 *           type: number
 *           description: Əlavə tutulmalar
 *           example: 0
 * 
 *     BulkTaxCalculation:
 *       type: object
 *       properties:
 *         employees:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: İşçi ID-si
 *               name:
 *                 type: string
 *                 description: İşçi adı
 *               grossSalary:
 *                 type: number
 *                 description: Ümumi maaş
 *               exemptions:
 *                 type: number
 *                 description: Vergi güzəştləri
 * 
 *     CalculationExample:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "2500 AZN maaş üçün hesablama"
 *         grossSalary:
 *           type: number
 *           example: 2500
 *         calculation:
 *           $ref: '#/components/schemas/TaxCalculation'
 *         description:
 *           type: string
 *           example: "Standart 14% gəlir vergisi ilə hesablama"
 * 
 *   responses:
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
 *                 example: "Maaş məbləği etibarsızdır"
 *               message:
 *                 type: string
 *                 example: "Maaş 0-dan böyük olmalıdır"
 */

// 💰 VERGİ HESABLAMALARI ROUTES

/**
 * @swagger
 * /api/payroll/calculate:
 *   post:
 *     summary: Fərdi vergi hesablaması
 *     tags: [Payroll]
 *     description: |
 *       Tək işçi üçün vergi hesablaması aparır.
 *       
 *       **Hesablama düsturları:**
 *       - Gəlir vergisi = (Brüt maaş - Güzəşt) × 14%
 *       - Sosial sığorta = Brüt maaş × 3% (işçi hissəsi) + Brüt maaş × 22% (işəgötürən hissəsi)
 *       - İşsizlik sığortası = Brüt maaş × 0.5%
 *       - Xalis maaş = Brüt maaş - (Gəlir vergisi + Sosial sığorta + İşsizlik sığortası)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TaxCalculationRequest'
 *           examples:
 *             basic:
 *               summary: Əsas hesablama
 *               value:
 *                 grossSalary: 2500
 *                 includeSocialSecurity: true
 *                 includeUnemployment: true
 *                 taxYear: 2024
 *                 exemptions: 1
 *             advanced:
 *               summary: Ətraflı hesablama
 *               value:
 *                 grossSalary: 3500
 *                 includeSocialSecurity: true
 *                 includeUnemployment: false
 *                 taxYear: 2024
 *                 exemptions: 2
 *                 additionalDeductions: 100
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
 *                   $ref: '#/components/schemas/TaxCalculation'
 *                 calculationDetails:
 *                   type: object
 *                   properties:
 *                     taxRate:
 *                       type: number
 *                       example: 14
 *                     socialSecurityRate:
 *                       type: number
 *                       example: 3
 *                     unemploymentRate:
 *                       type: number
 *                       example: 0.5
 *                     exemptionAmount:
 *                       type: number
 *                       example: 200
 *       400:
 *         $ref: '#/components/responses/CalculationError'
 */
router.post("/calculate", calculateTaxes);

/**
 * @swagger
 * /api/payroll/examples:
 *   get:
 *     summary: Hesablama nümunələrini gətir
 *     tags: [Payroll]
 *     description: |
 *       Müxtəlif maaş aralıqları üçün hazır hesablama nümunələri.
 *       Bu nümunələr vergi hesablamalarının necə işlədiyini başa düşməyə kömək edir.
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [basic, advanced, all]
 *           default: all
 *         description: Nümunə növü
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: number
 *         description: Minimum maaş filteri
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: number
 *         description: Maksimum maaş filteri
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
 *                       example: 5
 *                     salaryRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                           example: 600
 *                         max:
 *                           type: number
 *                           example: 10000
 *                         average:
 *                           type: number
 *                           example: 2800
 */
router.get("/examples", getCalculationExamples);

/**
 * @swagger
 * /api/payroll/calculate-bulk:
 *   post:
 *     summary: Toplu vergi hesablaması
 *     tags: [Payroll]
 *     description: |
 *       Birdən çox işçi üçün eyni vaxtda vergi hesablaması aparır.
 *       İdeal olaraq bütün şirkət işçiləri üçün aylıq hesablamalarda istifadə edilə bilər.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkTaxCalculation'
 *           examples:
 *             monthlyPayroll:
 *               summary: Aylıq əməkhaqqı hesablaması
 *               value:
 *                 employees: [
 *                   {
 *                     employeeId: "67a1b2c3d4e5f6a7b8c9d0e1",
 *                     name: "Əli Məmmədov",
 *                     grossSalary: 2500,
 *                     exemptions: 1
 *                   },
 *                   {
 *                     employeeId: "67a1b2c3d4e5f6a7b8c9d0e2", 
 *                     name: "Aygün Həsənova",
 *                     grossSalary: 1800,
 *                     exemptions: 0
 *                   },
 *                   {
 *                     employeeId: "67a1b2c3d4e5f6a7b8c9d0e3",
 *                     name: "Rəşid Əliyev",
 *                     grossSalary: 3200,
 *                     exemptions: 2
 *                   }
 *                 ]
 *                 taxYear: 2024
 *                 includeSocialSecurity: true
 *                 includeUnemployment: true
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       employeeId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       calculation:
 *                         $ref: '#/components/schemas/TaxCalculation'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalEmployees:
 *                       type: number
 *                       example: 3
 *                     totalGrossSalary:
 *                       type: number
 *                       example: 7500
 *                     totalNetSalary:
 *                       type: number
 *                       example: 5812.5
 *                     totalTaxes:
 *                       type: number
 *                       example: 1687.5
 *                     averageTaxRate:
 *                       type: number
 *                       example: 22.5
 *       400:
 *         $ref: '#/components/responses/CalculationError'
 */
router.post("/calculate-bulk", calculateBulkTaxes);

export default router;