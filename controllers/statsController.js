import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';

// ✅ ŞİRKƏT ÜMUMİ MAAŞ XÜLASƏSİ
export const getCompanySalarySummary = async (req, res) => {
  try {
    const userId = req.user._id; // ← payrollController strukturu ilə uyğun
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
    const targetYear = parseInt(year) || currentDate.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    // Şirkətin ümumi maaş məlumatları
    const employees = await Employee.find({ 
      companyId: userId,
      status: 'active',
      hireDate: { $lte: endDate }
    });
    
    // Ümumi maaş hesablamaları
    let totalGross = 0;
    let totalTax = 0;
    let totalSocialPay = 0;
    let totalNet = 0;
    
    employees.forEach(emp => {
      totalGross += emp.gross || 0;
      totalTax += emp.tax || 0;
      totalSocialPay += emp.social_pay || 0;
      totalNet += emp.Net_salary || 0;
    });
    
    // Şirkət vergiləri (employer taxes)
    const employerTaxes = await Payment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          paymentFor: 'employer',
          paymentDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentType',
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const companyTaxSummary = {};
    employerTaxes.forEach(tax => {
      companyTaxSummary[tax._id] = tax.totalAmount;
    });
    
    res.status(200).json({
      success: true,
      data: {
        period: { 
          month: targetMonth, 
          year: targetYear,
          name: startDate.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })
        },
        salarySummary: {
          totalGross,
          totalTax,
          totalSocialPay,
          totalNet,
          totalCostToCompany: totalGross + totalSocialPay,
          averageGross: employees.length > 0 ? Math.round(totalGross / employees.length) : 0,
          averageNet: employees.length > 0 ? Math.round(totalNet / employees.length) : 0
        },
        companyTaxes: companyTaxSummary,
        employeeCount: employees.length
      }
    });
    
  } catch (error) {
    console.error('Company salary summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Maaş xülasəsi gətirilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// ✅ DEPARTAMENTLƏR ÜZRƏ MAAŞ PAYLANMASI
export const getDepartmentSalaryDistribution = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
    const targetYear = parseInt(year) || currentDate.getFullYear();
    
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    // Departament üzrə maaş paylanması
    const departmentStats = await Employee.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(userId),
          status: 'active',
          hireDate: { $lte: endDate },
          Department: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$Department',
          totalEmployees: { $sum: 1 },
          totalGross: { $sum: '$gross' },
          totalTax: { $sum: '$tax' },
          totalSocialPay: { $sum: '$social_pay' },
          totalNet: { $sum: '$Net_salary' },
          avgGross: { $avg: '$gross' },
          avgNet: { $avg: '$Net_salary' }
        }
      },
      {
        $sort: { totalGross: -1 }
      }
    ]);
    
    // Ümumi məbləği hesablayaq
    const totalGrossAll = departmentStats.reduce((sum, dept) => sum + dept.totalGross, 0);
    
    // Faizləri yenidən hesablayaq
    const departmentsWithPercentage = departmentStats.map(dept => ({
      department: dept._id,
      totalEmployees: dept.totalEmployees,
      totalGross: dept.totalGross,
      totalTax: dept.totalTax,
      totalSocialPay: dept.totalSocialPay,
      totalNet: dept.totalNet,
      avgGross: Math.round(dept.avgGross || 0),
      avgNet: Math.round(dept.avgNet || 0),
      percentageOfTotalSalary: totalGrossAll > 0 
        ? parseFloat(((dept.totalGross / totalGrossAll) * 100).toFixed(2))
        : 0
    }));
    
    res.status(200).json({
      success: true,
      data: {
        period: { 
          month: targetMonth, 
          year: targetYear,
          name: new Date(targetYear, targetMonth - 1, 1).toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })
        },
        departments: departmentsWithPercentage,
        totalDepartments: departmentsWithPercentage.length,
        totalGrossAll: totalGrossAll,
        summary: {
          totalEmployees: departmentsWithPercentage.reduce((sum, dept) => sum + dept.totalEmployees, 0),
          highestPayingDept: departmentsWithPercentage.length > 0 ? departmentsWithPercentage[0] : null,
          lowestPayingDept: departmentsWithPercentage.length > 0 ? departmentsWithPercentage[departmentsWithPercentage.length - 1] : null
        }
      }
    });
    
  } catch (error) {
    console.error('Department salary distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Departament paylanması gətirilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// ✅ İŞÇİ DÖVRİYYƏSİ (GİRİŞ-ÇIXIŞ)
export const getEmployeeTurnover = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '6months' } = req.query; // '6months', 'year', 'month', 'quarter'
    
    const currentDate = new Date();
    let startDate, endDate;
    
    // Müddəti müəyyən edək
    switch (period) {
      case 'month':
        startDate = new Date(currentDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(currentDate);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(currentDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '6months':
      default:
        startDate = new Date(currentDate);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
    }
    
    endDate = new Date(currentDate);
    
    // Aylıq məlumatlar üçün
    const monthlyData = [];
    let tempDate = new Date(startDate);
    
    while (tempDate <= endDate) {
      const monthStart = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1);
      const monthEnd = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0, 23, 59, 59);
      
      // Həmin ay üçün yeni işə götürülənlər
      const newHires = await Employee.countDocuments({
        companyId: userId,
        hireDate: { $gte: monthStart, $lte: monthEnd },
        status: 'active'
      });
      
      // Həmin ay üçün işdən çıxanlar
      const terminatedEmployees = await Employee.countDocuments({
        companyId: userId,
        status: 'terminated',
        terminationDate: { $gte: monthStart, $lte: monthEnd }
      });
      
      // Ayın əvvəlindəki aktiv işçi sayı
      const startOfMonthActive = await Employee.countDocuments({
        companyId: userId,
        status: 'active',
        hireDate: { $lte: monthStart },
        $or: [
          { terminationDate: { $exists: false } },
          { terminationDate: { $gt: monthStart } }
        ]
      });
      
      // İşçi dövriyyəsi (turnover rate)
      const turnoverRate = startOfMonthActive > 0 
        ? (terminatedEmployees / startOfMonthActive) * 100 
        : 0;
      
      // Ayın sonundakı aktiv işçi sayı
      const endOfMonthActive = startOfMonthActive + newHires - terminatedEmployees;
      
      monthlyData.push({
        month: tempDate.getMonth() + 1,
        year: tempDate.getFullYear(),
        monthName: tempDate.toLocaleString('az-AZ', { month: 'long' }),
        newHires,
        terminatedEmployees,
        netChange: newHires - terminatedEmployees,
        startOfMonthActive,
        endOfMonthActive,
        turnoverRate: parseFloat(turnoverRate.toFixed(2)),
        retentionRate: parseFloat((100 - turnoverRate).toFixed(2))
      });
      
      // Növbəti aya keç
      tempDate.setMonth(tempDate.getMonth() + 1);
    }
    
    // Ümumi statistikalar
    const totalNewHires = monthlyData.reduce((sum, month) => sum + month.newHires, 0);
    const totalTerminations = monthlyData.reduce((sum, month) => sum + month.terminatedEmployees, 0);
    const avgTurnoverRate = monthlyData.length > 0
      ? monthlyData.reduce((sum, month) => sum + month.turnoverRate, 0) / monthlyData.length
      : 0;
    
    // Cari işçi sayı
    const currentEmployeeCount = await Employee.countDocuments({
      companyId: userId,
      status: 'active'
    });
    
    res.status(200).json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate,
          type: period,
          name: `${period === 'month' ? 'Son 1 ay' : period === 'quarter' ? 'Son 3 ay' : period === 'year' ? 'Son 1 il' : 'Son 6 ay'}`
        },
        summary: {
          totalNewHires,
          totalTerminations,
          netChange: totalNewHires - totalTerminations,
          currentEmployeeCount,
          avgTurnoverRate: parseFloat(avgTurnoverRate.toFixed(2)),
          avgRetentionRate: parseFloat((100 - avgTurnoverRate).toFixed(2))
        },
        monthlyData,
        analysis: {
          trend: totalNewHires > totalTerminations ? 'positive' : totalNewHires < totalTerminations ? 'negative' : 'stable',
          recommendation: avgTurnoverRate > 15 
            ? 'Yüksək işçi dövriyyəsi nisbəti. Səbəbləri araşdırın.'
            : avgTurnoverRate > 10
            ? 'Orta səviyyəli işçi dövriyyəsi.'
            : 'Aşağı işçi dövriyyəsi nisbəti - yaxşı nəticə.'
        }
      }
    });
    
  } catch (error) {
    console.error('Employee turnover error:', error);
    res.status(500).json({
      success: false,
      message: 'İşçi dövriyyəsi gətirilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// ✅ DAVAMIYYƏT STATISTIKALARI
export const getAttendanceStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
    const targetYear = parseInt(year) || currentDate.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    // Ayın iş günlərinin sayını hesablayaq
    const getWorkingDays = (start, end) => {
      let count = 0;
      const current = new Date(start);
      
      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      
      return count;
    };
    
    const totalWorkingDaysInMonth = getWorkingDays(startDate, endDate);
    
    // İşçiləri gətirək
    const employees = await Employee.find({
      companyId: userId,
      status: 'active'
    });
    
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalOnLeave = 0;
    let totalRemote = 0;
    let totalLateMinutes = 0;
    let totalExpectedAttendanceDays = 0;
    let totalActualAttendanceDays = 0;
    
    const monthAttendance = [];
    
    for (const employee of employees) {
      // İşçinin bu ay üçün işləməli olduğu günləri hesablayaq
      let employeeStartDate = employee.hireDate;
      if (employeeStartDate < startDate) {
        employeeStartDate = startDate;
      }
      
      const employeeWorkingDays = getWorkingDays(employeeStartDate, endDate);
      totalExpectedAttendanceDays += employeeWorkingDays;
      
      // REAL tətbiq üçün Attendance modelindən məlumat gətirilməlidir
      // Burada nümunə məlumat yaradaq:
      const presentDays = Math.floor(Math.random() * employeeWorkingDays);
      const absentDays = Math.floor(Math.random() * 5);
      const lateDays = Math.floor(Math.random() * 3);
      
      totalPresent += presentDays;
      totalAbsent += absentDays;
      totalLate += lateDays;
      totalActualAttendanceDays += presentDays;
      
      const attendancePercentage = employeeWorkingDays > 0 
        ? (presentDays / employeeWorkingDays * 100)
        : 0;
      
      monthAttendance.push({
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.Department || 'Təyin edilməyib',
        position: employee.position || 'Təyin edilməyib',
        present: presentDays,
        absent: absentDays,
        late: lateDays,
        onLeave: 0,
        remote: 0,
        lateMinutes: lateDays * 15,
        workingDaysExpected: employeeWorkingDays,
        workingDaysActual: presentDays,
        attendanceRate: parseFloat(attendancePercentage.toFixed(2)),
        status: attendancePercentage >= 90 ? 'Excellent' : attendancePercentage >= 80 ? 'Good' : attendancePercentage >= 70 ? 'Average' : 'Needs Improvement'
      });
    }
    
    // Ümumi davamiyyət faizi
    const overallAttendanceRate = totalExpectedAttendanceDays > 0 
      ? (totalActualAttendanceDays / totalExpectedAttendanceDays * 100)
      : 0;
    
    const avgLateMinutes = totalLate > 0 
      ? (totalLate * 15 / totalLate)
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        period: { 
          month: targetMonth, 
          year: targetYear,
          monthName: startDate.toLocaleString('az-AZ', { month: 'long', year: 'numeric' }),
          startDate,
          endDate 
        },
        workingDays: {
          totalWorkingDaysInMonth,
          totalExpectedAttendanceDays,
          totalActualAttendanceDays,
          overallAttendanceRate: parseFloat(overallAttendanceRate.toFixed(2))
        },
        summary: {
          totalEmployees: employees.length,
          totalPresent,
          totalAbsent,
          totalLate,
          totalOnLeave,
          totalRemote,
          overallAttendanceRate: parseFloat(overallAttendanceRate.toFixed(2)),
          avgLateMinutes: parseFloat(avgLateMinutes.toFixed(2)),
          latePercentage: employees.length > 0 
            ? parseFloat((totalLate / employees.length * 100).toFixed(2))
            : 0,
          avgAttendancePerEmployee: employees.length > 0 
            ? parseFloat((totalActualAttendanceDays / employees.length).toFixed(1))
            : 0
        },
        analysis: {
          attendanceRating: overallAttendanceRate >= 95 ? 'Excellent' : 
                          overallAttendanceRate >= 90 ? 'Very Good' : 
                          overallAttendanceRate >= 85 ? 'Good' : 
                          overallAttendanceRate >= 80 ? 'Average' : 
                          'Needs Improvement',
          recommendation: overallAttendanceRate < 85 
            ? 'Davamiyyət səviyyəsi aşağıdır. Səbəbləri araşdırın və tədbirlər görün.'
            : 'Davamiyyət səviyyəsi qənaətbəxşdir.'
        },
        detailedAttendance: monthAttendance.slice(0, 20), // İlk 20 nəticə
        topPerformers: monthAttendance
          .filter(emp => emp.attendanceRate >= 95)
          .slice(0, 5),
        needsAttention: monthAttendance
          .filter(emp => emp.attendanceRate < 80)
          .slice(0, 5)
      }
    });
    
  } catch (error) {
    console.error('Attendance statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Davamiyyət statistikası gətirilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// ✅ ŞİRKƏT DASHBOARD ÜMUMİ STATISTIKALARI
export const getCompanyDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Keçən ay üçün tarixlər
    const lastMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const lastMonth = lastMonthDate.getMonth() + 1;
    const lastMonthYear = lastMonthDate.getFullYear();
    
    // Cari ayın tarixləri
    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
    // Keçən ayın tarixləri
    const lastMonthStart = new Date(lastMonthYear, lastMonth - 1, 1);
    const lastMonthEnd = new Date(lastMonthYear, lastMonth, 0, 23, 59, 59);
    
    // Cari ay üçün işçilər
    const currentMonthEmployees = await Employee.find({
      companyId: userId,
      status: 'active',
      hireDate: { $lte: currentMonthEnd }
    }).lean();
    
    // Keçən ay üçün işçilər
    const lastMonthEmployees = await Employee.find({
      companyId: userId,
      status: 'active',
      hireDate: { $lte: lastMonthEnd }
    }).lean();
    
    // Maaş fondları
    const currentMonthSalaryFund = currentMonthEmployees.reduce((sum, emp) => 
      sum + (emp.gross || 0), 0);
    
    const lastMonthSalaryFund = lastMonthEmployees.reduce((sum, emp) => 
      sum + (emp.gross || 0), 0);
    
    // Orta maaşlar
    const currentAvgSalary = currentMonthEmployees.length > 0
      ? currentMonthSalaryFund / currentMonthEmployees.length
      : 0;
    
    const lastAvgSalary = lastMonthEmployees.length > 0
      ? lastMonthSalaryFund / lastMonthEmployees.length
      : 0;
    
    // İşçi dövriyyəsi (son 30 gün)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newHiresLast30Days = await Employee.countDocuments({
      companyId: userId,
      hireDate: { $gte: thirtyDaysAgo, $lte: currentMonthEnd },
      status: 'active'
    });
    
    const terminatedLast30Days = await Employee.countDocuments({
      companyId: userId,
      status: 'terminated',
      terminationDate: { $gte: thirtyDaysAgo, $lte: currentMonthEnd }
    });
    
    const turnoverRate = currentMonthEmployees.length > 0
      ? (terminatedLast30Days / currentMonthEmployees.length * 100)
      : 0;
    
    // Departament sayı
    const departmentCount = await Employee.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(userId),
          status: 'active',
          Department: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$Department'
        }
      },
      {
        $count: 'totalDepartments'
      }
    ]);
    
    // Ən böyük departament
    const largestDepartment = await Employee.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(userId),
          status: 'active',
          Department: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$Department',
          employeeCount: { $sum: 1 },
          avgSalary: { $avg: '$gross' }
        }
      },
      {
        $sort: { employeeCount: -1 }
      },
      {
        $limit: 1
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        period: {
          currentMonth: { 
            month: currentMonth, 
            year: currentYear,
            monthName: currentMonthStart.toLocaleString('az-AZ', { month: 'long' })
          },
          lastMonth: { 
            month: lastMonth, 
            year: lastMonthYear,
            monthName: lastMonthStart.toLocaleString('az-AZ', { month: 'long' })
          }
        },
        employeeCount: {
          currentMonth: currentMonthEmployees.length,
          lastMonth: lastMonthEmployees.length,
          change: currentMonthEmployees.length - lastMonthEmployees.length,
          changePercentage: lastMonthEmployees.length > 0
            ? parseFloat(((currentMonthEmployees.length - lastMonthEmployees.length) / lastMonthEmployees.length * 100).toFixed(2))
            : 0,
          growthTrend: currentMonthEmployees.length > lastMonthEmployees.length ? 'positive' : 'negative'
        },
        salaryFund: {
          currentMonth: Math.round(currentMonthSalaryFund),
          lastMonth: Math.round(lastMonthSalaryFund),
          change: Math.round(currentMonthSalaryFund - lastMonthSalaryFund),
          changePercentage: lastMonthSalaryFund > 0
            ? parseFloat(((currentMonthSalaryFund - lastMonthSalaryFund) / lastMonthSalaryFund * 100).toFixed(2))
            : 0
        },
        averageSalary: {
          currentMonth: Math.round(currentAvgSalary),
          lastMonth: Math.round(lastAvgSalary),
          change: Math.round(currentAvgSalary - lastAvgSalary),
          changePercentage: lastAvgSalary > 0
            ? parseFloat(((currentAvgSalary - lastAvgSalary) / lastAvgSalary * 100).toFixed(2))
            : 0,
          trend: currentAvgSalary > lastAvgSalary ? 'increasing' : 'decreasing'
        },
        turnover: {
          newHiresLast30Days,
          terminatedLast30Days,
          netChange: newHiresLast30Days - terminatedLast30Days,
          turnoverRate: parseFloat(turnoverRate.toFixed(2)),
          turnoverStatus: turnoverRate < 5 ? 'Low' : turnoverRate < 10 ? 'Moderate' : 'High'
        },
        departments: {
          totalDepartments: departmentCount.length > 0 ? departmentCount[0].totalDepartments : 0,
          largestDepartment: largestDepartment.length > 0 ? largestDepartment[0] : null
        },
        keyMetrics: {
          employeeGrowthRate: lastMonthEmployees.length > 0 
            ? parseFloat(((currentMonthEmployees.length - lastMonthEmployees.length) / lastMonthEmployees.length * 100).toFixed(2))
            : 0,
          salaryCostPerEmployee: currentMonthEmployees.length > 0 
            ? Math.round(currentMonthSalaryFund / currentMonthEmployees.length)
            : 0,
          employeeRetentionRate: parseFloat((100 - turnoverRate).toFixed(2))
        },
        status: {
          financialHealth: currentMonthSalaryFund < (lastMonthSalaryFund * 1.2) ? 'Stable' : 'Increasing',
          workforceHealth: turnoverRate < 10 ? 'Stable' : 'Volatile',
          growthPotential: newHiresLast30Days > terminatedLast30Days ? 'Growing' : 'Declining'
        }
      }
    });
    
  } catch (error) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard statistikaları gətirilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// ✅ İL ÜZRƏ AYLIQ MAAŞ STATISTIKASI
export const getYearlyMonthlySalaryStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { year } = req.query;
    
    const currentDate = new Date();
    const targetYear = parseInt(year) || currentDate.getFullYear();
    
    const monthlyStats = [];
    
    // Hər ay üçün hesablamalar
    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(targetYear, month - 1, 1);
      const endDate = new Date(targetYear, month, 0, 23, 59, 59);
      
      // Ayın sonunda aktiv işçilər
      const employees = await Employee.find({
        companyId: userId,
        status: 'active',
        hireDate: { $lte: endDate }
      });
      
      // Maaş fondları
      const salaryFund = employees.reduce((sum, emp) => sum + (emp.gross || 0), 0);
      
      // Orta maaş
      const avgSalary = employees.length > 0 ? salaryFund / employees.length : 0;
      
      // İşçi dövriyyəsi (həmin ay)
      const newHires = await Employee.countDocuments({
        companyId: userId,
        hireDate: { $gte: startDate, $lte: endDate },
        status: 'active'
      });
      
      const terminatedEmployees = await Employee.countDocuments({
        companyId: userId,
        status: 'terminated',
        terminationDate: { $gte: startDate, $lte: endDate }
      });
      
      // Vergi ümumi
      const totalTax = employees.reduce((sum, emp) => sum + (emp.tax || 0), 0);
      const totalSocialPay = employees.reduce((sum, emp) => sum + (emp.social_pay || 0), 0);
      
      monthlyStats.push({
        month,
        year: targetYear,
        monthName: new Date(targetYear, month - 1, 1).toLocaleString('az-AZ', { month: 'long' }),
        employeeCount: employees.length,
        salaryFund: Math.round(salaryFund),
        avgSalary: Math.round(avgSalary),
        totalTax: Math.round(totalTax),
        totalSocialPay: Math.round(totalSocialPay),
        totalCost: Math.round(salaryFund + totalSocialPay),
        turnover: {
          newHires,
          terminatedEmployees,
          netChange: newHires - terminatedEmployees
        }
      });
    }
    
    // İl üzrə ümumi statistikalar
    const totalEmployees = monthlyStats[monthlyStats.length - 1]?.employeeCount || 0;
    const totalSalaryFund = monthlyStats.reduce((sum, month) => sum + month.salaryFund, 0);
    const avgYearlySalary = totalEmployees > 0 ? totalSalaryFund / totalEmployees : 0;
    const totalNewHires = monthlyStats.reduce((sum, month) => sum + month.turnover.newHires, 0);
    const totalTerminations = monthlyStats.reduce((sum, month) => sum + month.turnover.terminatedEmployees, 0);
    
    // Trend analizi
    const salaryTrend = monthlyStats.map(month => month.salaryFund);
    const isSalaryIncreasing = salaryTrend[salaryTrend.length - 1] > salaryTrend[0];
    const avgMonthlyGrowth = salaryTrend.length > 1 
      ? ((salaryTrend[salaryTrend.length - 1] - salaryTrend[0]) / salaryTrend[0] * 100 / (salaryTrend.length - 1))
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        year: targetYear,
        summary: {
          totalEmployees,
          totalSalaryFund: Math.round(totalSalaryFund),
          avgYearlySalary: Math.round(avgYearlySalary),
          totalNewHires,
          totalTerminations,
          netEmployeeChange: totalNewHires - totalTerminations,
          turnoverRate: totalEmployees > 0 ? parseFloat((totalTerminations / totalEmployees * 100).toFixed(2)) : 0
        },
        monthlyStats,
        trends: {
          salaryTrend: isSalaryIncreasing ? 'Increasing' : 'Decreasing',
          avgMonthlyGrowth: parseFloat(avgMonthlyGrowth.toFixed(2)),
          peakMonth: monthlyStats.reduce((max, month) => month.salaryFund > max.salaryFund ? month : max, monthlyStats[0]),
          lowestMonth: monthlyStats.reduce((min, month) => month.salaryFund < min.salaryFund ? month : min, monthlyStats[0]),
          seasonalPattern: salaryTrend[10] > salaryTrend[0] ? 'Year-end increase' : 'Stable throughout year'
        },
        analysis: {
          efficiencyScore: totalEmployees > 0 ? parseFloat((totalSalaryFund / totalEmployees / avgYearlySalary * 100).toFixed(2)) : 0,
          costManagement: avgMonthlyGrowth < 5 ? 'Good' : avgMonthlyGrowth < 10 ? 'Moderate' : 'High',
          recommendation: avgMonthlyGrowth > 10 
            ? 'Maaş xərcləri yüksək artım tempində. Nəzarət tədbirləri nəzərdən keçirin.'
            : 'Maaş xərcləri idarə olunan səviyyədədir.'
        }
      }
    });
    
  } catch (error) {
    console.error('Yearly salary stats error:', error);
    res.status(500).json({
      success: false,
      message: 'İllik maaş statistikaları gətirilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// ✅ DEPARTAMENTLƏR ÜZRƏ İLLİK MAAŞ BÖLGÜSÜ
export const getYearlyDepartmentSalaryDistribution = async (req, res) => {
  try {
    const userId = req.user._id;
    const { year } = req.query;
    
    const currentDate = new Date();
    const targetYear = parseInt(year) || currentDate.getFullYear();
    const yearEndDate = new Date(targetYear, 11, 31, 23, 59, 59);
    
    // İl üzrə ümumi departament statistikaları
    const yearlyDepartmentSummary = await Employee.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(userId),
          status: 'active',
          hireDate: { $lte: yearEndDate },
          Department: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$Department',
          totalEmployees: { $sum: 1 },
          totalGross: { $sum: '$gross' },
          totalNet: { $sum: '$Net_salary' },
          avgGross: { $avg: '$gross' },
          avgNet: { $avg: '$Net_salary' },
          minSalary: { $min: '$gross' },
          maxSalary: { $max: '$gross' }
        }
      },
      {
        $sort: { totalGross: -1 }
      }
    ]);
    
    // Ümumi məbləği hesablayaq
    const totalGrossAll = yearlyDepartmentSummary.reduce((sum, dept) => sum + dept.totalGross, 0);
    const totalEmployeesAll = yearlyDepartmentSummary.reduce((sum, dept) => sum + dept.totalEmployees, 0);
    
    // Faizləri əlavə edək
    const departmentsWithPercentage = yearlyDepartmentSummary.map(dept => ({
      department: dept._id,
      totalEmployees: dept.totalEmployees,
      totalGross: Math.round(dept.totalGross),
      totalNet: Math.round(dept.totalNet),
      avgGross: Math.round(dept.avgGross || 0),
      avgNet: Math.round(dept.avgNet || 0),
      minSalary: Math.round(dept.minSalary || 0),
      maxSalary: Math.round(dept.maxSalary || 0),
      salaryRange: Math.round((dept.maxSalary || 0) - (dept.minSalary || 0)),
      percentageOfTotal: totalGrossAll > 0 
        ? parseFloat(((dept.totalGross / totalGrossAll) * 100).toFixed(2))
        : 0,
      percentageOfEmployees: totalEmployeesAll > 0 
        ? parseFloat(((dept.totalEmployees / totalEmployeesAll) * 100).toFixed(2))
        : 0,
      costPerEmployee: dept.totalEmployees > 0 
        ? Math.round(dept.totalGross / dept.totalEmployees)
        : 0
    }));
    
    // Aylıq bölgü (ilk 3 ay üçün)
    const monthlyBreakdown = [];
    for (let month = 1; month <= 3; month++) { // İlk 3 ay üçün
      const endDate = new Date(targetYear, month, 0, 23, 59, 59);
      
      const monthDepartmentStats = await Employee.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(userId),
            status: 'active',
            hireDate: { $lte: endDate },
            Department: { $exists: true, $ne: null, $ne: '' }
          }
        },
        {
          $group: {
            _id: '$Department',
            totalGross: { $sum: '$gross' },
            employeeCount: { $sum: 1 }
          }
        }
      ]);
      
      monthlyBreakdown.push({
        month,
        monthName: new Date(targetYear, month - 1, 1).toLocaleString('az-AZ', { month: 'long' }),
        departments: monthDepartmentStats.map(dept => ({
          department: dept._id,
          totalGross: Math.round(dept.totalGross),
          employeeCount: dept.employeeCount
        }))
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        year: targetYear,
        summary: {
          totalDepartments: departmentsWithPercentage.length,
          totalGrossAll: Math.round(totalGrossAll),
          totalEmployeesAll,
          avgSalaryAll: totalEmployeesAll > 0 ? Math.round(totalGrossAll / totalEmployeesAll) : 0,
          highestCostDepartment: departmentsWithPercentage.length > 0 ? departmentsWithPercentage[0] : null,
          lowestCostDepartment: departmentsWithPercentage.length > 0 ? departmentsWithPercentage[departmentsWithPercentage.length - 1] : null
        },
        yearlySummary: departmentsWithPercentage,
        monthlyBreakdown: monthlyBreakdown,
        analysis: {
          costDistribution: departmentsWithPercentage.length > 0 
            ? parseFloat((departmentsWithPercentage[0].percentageOfTotal - 
                         departmentsWithPercentage[departmentsWithPercentage.length - 1].percentageOfTotal).toFixed(2))
            : 0,
          efficiencyRanking: departmentsWithPercentage
            .map(dept => ({
              department: dept.department,
              efficiencyScore: dept.costPerEmployee > 0 
                ? parseFloat((dept.avgNet / dept.costPerEmployee * 100).toFixed(2))
                : 0
            }))
            .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
            .slice(0, 3)
        }
      }
    });
    
  } catch (error) {
    console.error('Yearly department salary distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'İllik departament maaş bölgüsü gətirilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// ✅ AYLIQ KPI GÖSTƏRİCİLƏRİ
export const getMonthlyKPIs = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
    const targetYear = parseInt(year) || currentDate.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
    
    // Əvvəlki ay
    const prevMonthDate = new Date(targetYear, targetMonth - 2, 1);
    const prevMonthStart = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
    const prevMonthEnd = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59);
    
    // Cari ay işçiləri
    const employees = await Employee.find({
      companyId: userId,
      status: 'active',
      hireDate: { $lte: endDate }
    });
    
    // Əvvəlki ay işçiləri
    const prevMonthEmployees = await Employee.find({
      companyId: userId,
      status: 'active',
      hireDate: { $lte: prevMonthEnd }
    });
    
    // Maaş fondu
    const salaryFund = employees.reduce((sum, emp) => sum + (emp.gross || 0), 0);
    const prevSalaryFund = prevMonthEmployees.reduce((sum, emp) => sum + (emp.gross || 0), 0);
    
    // Orta maaş
    const avgSalary = employees.length > 0 ? salaryFund / employees.length : 0;
    const prevAvgSalary = prevMonthEmployees.length > 0 ? prevSalaryFund / prevMonthEmployees.length : 0;
    
    // İşçi dövriyyəsi
    const newHires = await Employee.countDocuments({
      companyId: userId,
      hireDate: { $gte: startDate, $lte: endDate },
      status: 'active'
    });
    
    const terminatedEmployees = await Employee.countDocuments({
      companyId: userId,
      status: 'terminated',
      terminationDate: { $gte: startDate, $lte: endDate }
    });
    
    const turnoverRate = employees.length > 0
      ? (terminatedEmployees / employees.length * 100)
      : 0;
    
    // Vergilər
    const totalTax = employees.reduce((sum, emp) => sum + (emp.tax || 0), 0);
    const totalSocialPay = employees.reduce((sum, emp) => sum + (emp.social_pay || 0), 0);
    
    // Departament sayı
    const departmentCount = await Employee.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(userId),
          status: 'active',
          hireDate: { $lte: endDate },
          Department: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$Department'
        }
      },
      {
        $count: 'totalDepartments'
      }
    ]);
    
    // KPI scores
    const calculateKPIScore = (value, target, weight = 1) => {
      if (target === 0) return 0;
      const score = (value / target) * 100 * weight;
      return Math.min(score, 100 * weight); // Max score = weight * 100
    };
    
    const kpiScores = {
      employeeRetention: calculateKPIScore(100 - turnoverRate, 95, 0.3),
      salaryEfficiency: calculateKPIScore(avgSalary, prevAvgSalary, 0.25),
      growthRate: calculateKPIScore(employees.length, prevMonthEmployees.length, 0.2),
      costControl: calculateKPIScore(salaryFund, prevSalaryFund * 1.05, 0.25) // 5% artıma icazə
    };
    
    const totalKPIScore = Object.values(kpiScores).reduce((sum, score) => sum + score, 0);
    const overallScore = parseFloat((totalKPIScore / 4).toFixed(2));
    
    res.status(200).json({
      success: true,
      data: {
        period: { 
          month: targetMonth, 
          year: targetYear,
          monthName: startDate.toLocaleString('az-AZ', { month: 'long', year: 'numeric' })
        },
        kpis: {
          // Əsas göstəricilər
          employeeMetrics: {
            totalEmployees: employees.length,
            previousMonthEmployees: prevMonthEmployees.length,
            growthRate: prevMonthEmployees.length > 0 
              ? parseFloat(((employees.length - prevMonthEmployees.length) / prevMonthEmployees.length * 100).toFixed(2))
              : 0,
            newHires,
            terminatedEmployees,
            netChange: newHires - terminatedEmployees,
            turnoverRate: parseFloat(turnoverRate.toFixed(2)),
            retentionRate: parseFloat((100 - turnoverRate).toFixed(2))
          },
          
          // Maliyyə göstəriciləri
          financialMetrics: {
            salaryFund: Math.round(salaryFund),
            previousMonthSalaryFund: Math.round(prevSalaryFund),
            growthPercentage: prevSalaryFund > 0 
              ? parseFloat(((salaryFund - prevSalaryFund) / prevSalaryFund * 100).toFixed(2))
              : 0,
            avgSalary: Math.round(avgSalary),
            previousAvgSalary: Math.round(prevAvgSalary),
            avgSalaryChange: Math.round(avgSalary - prevAvgSalary),
            totalTax: Math.round(totalTax),
            totalSocialPay: Math.round(totalSocialPay),
            totalCompanyCost: Math.round(salaryFund + totalSocialPay),
            costPerEmployee: employees.length > 0 
              ? Math.round((salaryFund + totalSocialPay) / employees.length)
              : 0
          },
          
          // Struktur göstəriciləri
          structuralMetrics: {
            totalDepartments: departmentCount.length > 0 ? departmentCount[0].totalDepartments : 0,
            avgEmployeesPerDept: departmentCount.length > 0 && departmentCount[0].totalDepartments > 0
              ? Math.round(employees.length / departmentCount[0].totalDepartments)
              : 0
          },
          
          // KPI Scores
          kpiScores: {
            employeeRetention: {
              score: parseFloat(kpiScores.employeeRetention.toFixed(2)),
              target: 95,
              status: kpiScores.employeeRetention >= 85 ? 'Excellent' : kpiScores.employeeRetention >= 70 ? 'Good' : 'Needs Improvement'
            },
            salaryEfficiency: {
              score: parseFloat(kpiScores.salaryEfficiency.toFixed(2)),
              target: 100,
              status: kpiScores.salaryEfficiency >= 90 ? 'Excellent' : kpiScores.salaryEfficiency >= 75 ? 'Good' : 'Needs Improvement'
            },
            growthRate: {
              score: parseFloat(kpiScores.growthRate.toFixed(2)),
              target: 105,
              status: kpiScores.growthRate >= 100 ? 'Growing' : 'Declining'
            },
            costControl: {
              score: parseFloat(kpiScores.costControl.toFixed(2)),
              target: 100,
              status: kpiScores.costControl >= 90 ? 'Excellent' : kpiScores.costControl >= 75 ? 'Good' : 'Needs Improvement'
            },
            overallScore: {
              score: overallScore,
              rating: overallScore >= 90 ? 'Excellent' : overallScore >= 80 ? 'Good' : overallScore >= 70 ? 'Average' : 'Needs Improvement',
              color: overallScore >= 90 ? 'green' : overallScore >= 80 ? 'blue' : overallScore >= 70 ? 'yellow' : 'red'
            }
          }
        },
        
        // Müqayisə
        comparison: {
          vsPreviousMonth: {
            employeeChange: employees.length - prevMonthEmployees.length,
            salaryFundChange: salaryFund - prevSalaryFund,
            avgSalaryChange: avgSalary - prevAvgSalary,
            overallTrend: salaryFund > prevSalaryFund && employees.length >= prevMonthEmployees.length ? 'Positive' : 'Mixed'
          }
        },
        
        // Tövsiyələr
        recommendations: overallScore < 70 
          ? [
              'İşçi saxlanmasını artırmaq üçün tədbirlər görün',
              'Maaş strukturu optimallaşdırın',
              'Maliyyə xərclərini nəzərdən keçirin'
            ]
          : overallScore < 80
          ? [
              'Orta səviyyəli nəticələr. Optimallaşdırma imkanlarını araşdırın',
              'İşçi məmnuniyyətini artırmaq üçün tədbirlər görün'
            ]
          : [
              'Əla nəticələr. Cari strategiyanızı davam etdirin',
              'Daha da yaxşılaşdırmaq üçün inkişaf imkanlarını araşdırın'
            ]
      }
    });
    
  } catch (error) {
    console.error('Monthly KPIs error:', error);
    res.status(500).json({
      success: false,
      message: 'Aylıq KPI-lar gətirilərkən xəta baş verdi',
      error: error.message
    });
  }
};

export default {
  getCompanySalarySummary,
  getDepartmentSalaryDistribution,
  getEmployeeTurnover,
  getAttendanceStatistics,
  getCompanyDashboardStats,
  getYearlyMonthlySalaryStats,
  getYearlyDepartmentSalaryDistribution,
  getMonthlyKPIs
};