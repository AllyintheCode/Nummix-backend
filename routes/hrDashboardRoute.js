import express from 'express';
import {
  getDashboardData,
  getWeeklyAttendance,
  getDepartmentDetails,
  getPaymentStatistics,
  getEmployeeGroupStats,
  getRealTimeDashboard,
  getBalanceBreakdownPercentages,
  getPaymentAnalytics,
  getEmployeeFlowStats,
  getUserStatistics,
  testDashboard
} from '../controllers/DashboardController.js';
import protect from "../middlewares/authMiddleware.js";


const router = express.Router();

// Dashboard routes (artıq middleware YOXDUR)
router.get('/',protect ,getDashboardData);
router.get('/weekly-attendance',protect, getWeeklyAttendance);
router.get('/department/:department',protect, getDepartmentDetails);
router.get('/payment-statistics',protect, getPaymentStatistics);
router.get('/employee-group-stats',protect, getEmployeeGroupStats);
router.get('/realtime',protect, getRealTimeDashboard);
router.get('/balance-breakdown',protect, getBalanceBreakdownPercentages);
router.get('/payment-analytics',protect, getPaymentAnalytics);
router.get('/employee-flow-stats',protect, getEmployeeFlowStats);
router.get('/user-statistics',protect, getUserStatistics);
router.get('/test',protect, testDashboard);

export default router;