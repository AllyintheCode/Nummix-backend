// routes/departmentRoutes.js
import express from "express";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStatistics
} from "../controllers/DepartmentController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Bütün department route-ları auth tələb edir
router.use(protect);

router.get('/:userId/departments', getDepartments);
router.post('/:userId/departments', createDepartment);
router.put('/:userId/departments/:departmentId', updateDepartment);
router.delete('/:userId/departments/:departmentId', deleteDepartment);
router.get('/:userId/departments/statistics', getDepartmentStatistics);

export default router;