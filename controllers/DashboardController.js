import Transaction from "../models/Transaction.js";

export const getDashboardStats = async (req, res) => {
  try {
    // --- ÜMUMİ GƏLİR ---
    const incomeResult = await Transaction.aggregate([
      { $unwind: "$entries" },
      {
        $match: {
          "entries.account": "Sales",
          "entries.type": "credit",
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$entries.amount" },
        },
      },
    ]);

    const totalIncome = incomeResult[0]?.totalIncome || 0;

    // --- ÜMUMİ XƏRC ---
    const expenseResult = await Transaction.aggregate([
      { $unwind: "$entries" },
      {
        $match: {
          "entries.account": "Expense",
          "entries.type": "debit",
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$entries.amount" },
        },
      },
    ]);

    const totalExpense = expenseResult[0]?.totalExpense || 0;

    // --- XALİS MƏNFƏƏT ---
    const netIncome = totalIncome - totalExpense;

    // Cavab
    res.json({
      totalIncome,
      totalExpense,
      netIncome,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Server xətası" });
  }
};

// Ümumi Aktivlər
export const getTotalAssets = async (req, res) => {
  try {
    const assetAccounts = ["Cash", "Bank"];

    const result = await Transaction.aggregate([
      { $unwind: "$entries" },
      { $match: { "entries.account": { $in: assetAccounts } } },
      {
        $group: {
          _id: "$entries.account",
          totalDebit: {
            $sum: {
              $cond: [
                { $eq: ["$entries.type", "debit"] },
                "$entries.amount",
                0,
              ],
            },
          },
          totalCredit: {
            $sum: {
              $cond: [
                { $eq: ["$entries.type", "credit"] },
                "$entries.amount",
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          account: "$_id",
          balance: { $subtract: ["$totalDebit", "$totalCredit"] },
          _id: 0,
        },
      },
    ]);

    // Ümumi aktivlər = Cash + Bank balansları
    const totalAssets = result.reduce((sum, acc) => sum + acc.balance, 0);

    res.json({
      totalAssets,
      breakdown: result, // istəsən hər bir hesabın balansını da göstərir
    });
  } catch (error) {
    console.error("Get Total Assets Error:", error);
    res.status(500).json({ message: "Server xətası" });
  }
};
// Son 6 ay Gəlir və Xərc
export const getIncomeExpenseLast6Months = async (req, res) => {
  try {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5); // son 6 ay

    // Transaction-ları unwind və filter ilə alırıq
    const data = await Transaction.aggregate([
      { $unwind: "$entries" },
      {
        $match: {
          date: { $gte: sixMonthsAgo, $lte: today },
          "entries.account": { $in: ["Sales", "Expense"] },
          $or: [
            { "entries.account": "Sales", "entries.type": "credit" },
            { "entries.account": "Expense", "entries.type": "debit" },
          ],
        },
      },
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$date" } },
          amount: "$entries.amount",
          type: "$entries.account",
        },
      },
      {
        $group: {
          _id: "$month",
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "Sales"] }, "$amount", 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$type", "Expense"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      data.map((d) => ({
        month: d._id,
        income: d.income,
        expense: d.expense,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xətası" });
  }
};

// Son 6 ay Mənfəət Dinamikası
export const getProfitDynamicsLast6Months = async (req, res) => {
  try {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);

    const data = await Transaction.aggregate([
      { $unwind: "$entries" },
      {
        $match: {
          date: { $gte: sixMonthsAgo, $lte: today },
          "entries.account": { $in: ["Sales", "Expense"] },
          $or: [
            { "entries.account": "Sales", "entries.type": "credit" },
            { "entries.account": "Expense", "entries.type": "debit" },
          ],
        },
      },
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$date" } },
          amount: "$entries.amount",
          type: "$entries.account",
        },
      },
      {
        $group: {
          _id: "$month",
          profit: {
            $sum: {
              $cond: [
                { $eq: ["$type", "Sales"] },
                "$amount",
                { $multiply: ["$amount", -1] },
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(
      data.map((d) => ({
        month: d._id,
        profit: d.profit,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xətası" });
  }
};

export const getBalanceBreakdownPercentage = async (req, res) => {
  try {
    // Aktiv, Öhdəlik və Kapital hesabları
    const assetAccounts = ["Cash", "Bank"];
    const liabilityAccounts = ["Expense"]; // nümunə
    const equityAccounts = ["Sales"]; // sadəcə kapital nümunəsi

    const result = await Transaction.aggregate([
      { $unwind: "$entries" },
      {
        $match: {
          "entries.account": {
            $in: [...assetAccounts, ...liabilityAccounts, ...equityAccounts],
          },
        },
      },
      {
        $group: {
          _id: "$entries.account",
          totalDebit: {
            $sum: {
              $cond: [
                { $eq: ["$entries.type", "debit"] },
                "$entries.amount",
                0,
              ],
            },
          },
          totalCredit: {
            $sum: {
              $cond: [
                { $eq: ["$entries.type", "credit"] },
                "$entries.amount",
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          account: "$_id",
          balance: { $subtract: ["$totalDebit", "$totalCredit"] },
          _id: 0,
        },
      },
    ]);

    // Hər bir bölmənin cəmini hesabla
    const totalAssets = result
      .filter((acc) => assetAccounts.includes(acc.account))
      .reduce((sum, acc) => sum + acc.balance, 0);

    const totalLiabilities = result
      .filter((acc) => liabilityAccounts.includes(acc.account))
      .reduce((sum, acc) => sum + acc.balance, 0);

    const totalEquity = result
      .filter((acc) => equityAccounts.includes(acc.account))
      .reduce((sum, acc) => sum + acc.balance, 0);

    const grandTotal = totalAssets + totalLiabilities + totalEquity;

    // Faiz hesabı
    const breakdown = {
      assets: ((totalAssets / grandTotal) * 100).toFixed(2),
      liabilities: ((totalLiabilities / grandTotal) * 100).toFixed(2),
      equity: ((totalEquity / grandTotal) * 100).toFixed(2),
    };

    res.json({
      totalAssets,
      totalLiabilities,
      totalEquity,
      breakdownPercent: breakdown,
      accountsBreakdown: result, // ətraflı balans hər hesab üzrə
    });
  } catch (err) {
    console.error("Balance Percentage Error:", err);
    res.status(500).json({ error: "Server xətası" });
  }
};
import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import EmployeeFlow from "../models/EmployeeFlow.js";

// Helper funksiyalar (eyni qalır)
const getWeekRange = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return { startOfWeek, endOfWeek };
};

const getCurrentMonthRange = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { startOfMonth, endOfMonth };
};

// ✅ Dashboard ümumi məlumatları (req.user._id ilə)
export const getDashboardData = async (req, res) => {
  try {
    // Middleware-dən gələn req.user._id istifadə edirik
    const userId = req.user._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "İstifadəçi məlumatları tapılmadı"
      });
    }

    const { startOfWeek, endOfWeek } = getWeekRange();
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    // Paralel sorğular
    const [
      totalEmployees,
      salaryStats,
      leaveStats,
      attendanceStats,
      recentPayments,
      upcomingPayments
    ] = await Promise.all([
      // 1. İşçi sayı
      Employee.countDocuments({ companyId: userId }),
      
      // 2. Maaş statistikaları
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalGross: { $sum: "$gross" },
            totalNet: { $sum: "$Net_salary" },
            avgGross: { $avg: "$gross" },
            avgNet: { $avg: "$Net_salary" }
          }
        }
      ]),
      
      // 3. Məzuniyyət statistikaları
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: { path: "$leaves", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            "leaves.status": "approved",
            "leaves.startDate": { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalLeaveDays: { $sum: "$leaves.totalDaysRequested" },
            activeOnLeave: {
              $sum: { $cond: [{ $eq: ["$leaves.status", "approved"] }, 1, 0] }
            }
          }
        }
      ]),
      
      // 4. Davamlılıq statistikaları
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: { path: "$attendances", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            "attendances.date": {
              $gte: startOfWeek.toISOString().split('T')[0],
              $lte: endOfWeek.toISOString().split('T')[0]
            }
          }
        },
        {
          $facet: {
            statusStats: [
              { $group: { _id: "$attendances.status", count: { $sum: 1 } } }
            ],
            presentCount: [
              { $match: { "attendances.status": "present" } },
              { $count: "count" }
            ],
            totalCount: [
              { $count: "count" }
            ]
          }
        }
      ]),
      
      // 5. Son 3 ödəniş
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
        { $sort: { "paymentHistory.paymentDate": -1 } },
        { $limit: 3 },
        {
          $project: {
            employeeName: { $concat: ["$firstName", " ", "$lastName"] },
            amount: "$paymentHistory.amount",
            date: "$paymentHistory.paymentDate",
            type: "$paymentHistory.paymentType",
            status: "$paymentHistory.status"
          }
        }
      ]),
      
      // 6. Gələcək ödənişlər
      Employee.aggregate([
        { 
          $match: { 
            companyId: new mongoose.Types.ObjectId(userId),
            nextPaymentDate: { $gte: new Date() }
          }
        },
        { $sort: { nextPaymentDate: 1 } },
        { $limit: 4 },
        {
          $project: {
            employeeName: { $concat: ["$firstName", " ", "$lastName"] },
            amount: "$gross",
            netAmount: "$Net_salary",
            nextPaymentDate: "$nextPaymentDate",
            department: "$Department"
          }
        }
      ])
    ]);

    // Departament statistikaları
    const departmentStats = await Employee.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$Department",
          employeeCount: { $sum: 1 },
          totalGross: { $sum: "$gross" },
          totalNet: { $sum: "$Net_salary" },
          avgGross: { $avg: "$gross" }
        }
      },
      { $sort: { totalGross: -1 } }
    ]);

    // İşçi status statistikaları
    const employeeStatusStats = await Employee.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // İşçi növü statistikaları
    const employeeTypeStats = await Employee.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$employeeType",
          count: { $sum: 1 },
          totalGross: { $sum: "$gross" }
        }
      }
    ]);

    // Davamlılıq faizi hesablanması
    const attendanceData = attendanceStats[0] || {};
    const presentCount = attendanceData.presentCount?.[0]?.count || 0;
    const totalCount = attendanceData.totalCount?.[0]?.count || 0;
    const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

    // Maaş statistikaları
    const salaryData = salaryStats[0] || {};
    const leaveData = leaveStats[0] || {};

    // Departament faizləri
    const totalGrossAll = salaryData.totalGross || 1;
    const departmentStatsWithPercentage = departmentStats.map(dept => ({
      ...dept,
      percentage: ((dept.totalGross / totalGrossAll) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          totalGrossSalary: salaryData.totalGross || 0,
          totalNetSalary: salaryData.totalNet || 0,
          averageSalary: salaryData.avgGross ? Math.round(salaryData.avgGross) : 0,
          averageNetSalary: salaryData.avgNet ? Math.round(salaryData.avgNet) : 0,
          totalLeaveDays: leaveData.totalLeaveDays || 0,
          employeesOnLeave: leaveData.activeOnLeave || 0,
          attendanceRate: Math.round(attendanceRate)
        },
        employeeStatus: employeeStatusStats.map(stat => ({
          status: stat._id || "unknown",
          count: stat.count,
          percentage: ((stat.count / totalEmployees) * 100).toFixed(1)
        })),
        employeeTypes: employeeTypeStats.map(stat => ({
          type: stat._id || "unknown",
          count: stat.count,
          totalGross: stat.totalGross,
          percentage: ((stat.count / totalEmployees) * 100).toFixed(1)
        })),
        departments: departmentStatsWithPercentage,
        recentPayments,
        upcomingPayments,
        attendanceBreakdown: attendanceData.statusStats?.map(stat => ({
          status: stat._id || "unknown",
          count: stat.count
        })) || []
      }
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Dashboard məlumatları alınarkən xəta baş verdi",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Həftəlik davamlılıq (req.user._id ilə)
export const getWeeklyAttendance = async (req, res) => {
  try {
    // Middleware-dən gələn req.user._id istifadə edirik
    const userId = req.user._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "İstifadəçi məlumatları tapılmadı"
      });
    }

    const { weekStart } = req.query;
    
    let startDate = weekStart ? new Date(weekStart) : new Date();
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // Həftəlik statistikalar
    const weeklyStats = await Employee.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: { path: "$attendances", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "attendances.date": {
            $gte: startDate.toISOString().split('T')[0],
            $lte: endDate.toISOString().split('T')[0]
          }
        }
      },
      {
        $facet: {
          dailyStats: [
            {
              $group: {
                _id: {
                  date: "$attendances.date",
                  status: "$attendances.status"
                },
                count: { $sum: 1 }
              }
            },
            {
              $group: {
                _id: "$_id.date",
                attendance: {
                  $push: {
                    status: "$_id.status",
                    count: "$count"
                  }
                }
              }
            }
          ],
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                present: {
                  $sum: { $cond: [{ $eq: ["$attendances.status", "present"] }, 1, 0] }
                },
                absent: {
                  $sum: { $cond: [{ $eq: ["$attendances.status", "absent"] }, 1, 0] }
                },
                late: {
                  $sum: { $cond: [{ $eq: ["$attendances.isLate", true] }, 1, 0] }
                }
              }
            }
          ]
        }
      }
    ]);

    const dailyStats = weeklyStats[0]?.dailyStats || [];
    const summary = weeklyStats[0]?.summary?.[0] || { total: 0, present: 0, absent: 0, late: 0 };

    // Günlər üçün formatlaşdırma
    const formattedDailyStats = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= endDate) {
      const dayStr = currentDay.toISOString().split('T')[0];
      const dayData = dailyStats.find(d => d._id === dayStr);
      
      const attendance = {
        present: 0,
        absent: 0,
        on_leave: 0,
        remote: 0
      };
      
      if (dayData) {
        dayData.attendance.forEach(item => {
          attendance[item.status] = item.count;
        });
      }
      
      formattedDailyStats.push({
        date: dayStr,
        dayName: currentDay.toLocaleDateString('az-AZ', { weekday: 'long' }),
        attendance
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }

    res.json({
      success: true,
      data: {
        weekRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        dailyStats: formattedDailyStats,
        summary: {
          ...summary,
          attendanceRate: summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(1) : 0
        }
      }
    });

  } catch (error) {
    console.error("Weekly attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Həftəlik davamlılıq məlumatları alınarkən xəta baş verdi"
    });
  }
};

// ✅ Departament detalları (req.user._id ilə)
export const getDepartmentDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { department } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "İstifadəçi məlumatları tapılmadı"
      });
    }

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Departament adı təqdim edilməyib"
      });
    }

    // Paralel sorğular
    const [employees, stats, salaryRange, recentPayments] = await Promise.all([
      // İşçilər
      Employee.find({ 
        companyId: userId, 
        Department: department 
      })
      .select("firstName lastName email position gross Net_salary status hireDate employeeType")
      .sort({ gross: -1 })
      .limit(50),
      
      // Statistikalar
      Employee.aggregate([
        { 
          $match: { 
            companyId: new mongoose.Types.ObjectId(userId), 
            Department: department 
          } 
        },
        {
          $group: {
            _id: "$Department",
            totalEmployees: { $sum: 1 },
            totalGross: { $sum: "$gross" },
            totalNet: { $sum: "$Net_salary" },
            avgGross: { $avg: "$gross" },
            avgNet: { $avg: "$Net_salary" },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            onLeave: { $sum: { $cond: [{ $eq: ["$status", "on_leave"] }, 1, 0] } }
          }
        }
      ]),
      
      // Maaş aralığı
      Employee.aggregate([
        { 
          $match: { 
            companyId: new mongoose.Types.ObjectId(userId), 
            Department: department 
          } 
        },
        {
          $group: {
            _id: null,
            minSalary: { $min: "$gross" },
            maxSalary: { $max: "$gross" },
            avgSalary: { $avg: "$gross" }
          }
        }
      ]),
      
      // Son ödənişlər
      Employee.aggregate([
        { 
          $match: { 
            companyId: new mongoose.Types.ObjectId(userId), 
            Department: department 
          } 
        },
        { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
        { $sort: { "paymentHistory.paymentDate": -1 } },
        { $limit: 5 },
        {
          $project: {
            employeeName: { $concat: ["$firstName", " ", "$lastName"] },
            amount: "$paymentHistory.amount",
            date: "$paymentHistory.paymentDate",
            type: "$paymentHistory.paymentType"
          }
        }
      ])
    ]);

    const departmentStats = stats[0] || {};
    const salaryData = salaryRange[0] || {};

    res.json({
      success: true,
      data: {
        department,
        statistics: {
          ...departmentStats,
          avgGross: departmentStats.avgGross ? Math.round(departmentStats.avgGross) : 0,
          avgNet: departmentStats.avgNet ? Math.round(departmentStats.avgNet) : 0
        },
        salaryRange: {
          min: salaryData.minSalary || 0,
          max: salaryData.maxSalary || 0,
          average: salaryData.avgSalary ? Math.round(salaryData.avgSalary) : 0
        },
        employees: employees.map(emp => ({
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          position: emp.position,
          gross: emp.gross,
          net: emp.Net_salary,
          status: emp.status,
          type: emp.employeeType
        })),
        recentPayments,
        employeeCount: employees.length
      }
    });

  } catch (error) {
    console.error("Department details error:", error);
    res.status(500).json({
      success: false,
      message: "Departament məlumatları alınarkən xəta baş verdi"
    });
  }
};

// ✅ Ödəniş statistikaları (req.user._id ilə)
export const getPaymentStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "İstifadəçi məlumatları tapılmadı"
      });
    }

    const { month, year } = req.query;
    
    const targetDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
    const nextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);

    // Son 6 ayın siyahısı
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(targetDate);
      date.setMonth(targetDate.getMonth() - i);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        name: date.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' })
      };
    }).reverse();

    // Cari ay statistikaları
    const [currentMonthStats, paymentTrends] = await Promise.all([
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        {
          $facet: {
            salaryStats: [
              {
                $group: {
                  _id: null,
                  totalGross: { $sum: "$gross" },
                  totalNet: { $sum: "$Net_salary" },
                  totalTax: { $sum: "$tax" },
                  totalSocial: { $sum: "$social_pay" },
                  paid: { $sum: { $cond: [{ $eq: ["$salary_status", "paid"] }, 1, 0] } },
                  pending: { $sum: { $cond: [{ $eq: ["$salary_status", "pending"] }, 1, 0] } }
                }
              }
            ],
            recentPayments: [
              { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
              {
                $match: {
                  "paymentHistory.forMonth": {
                    $gte: targetDate,
                    $lt: nextMonth
                  }
                }
              },
              { $sort: { "paymentHistory.paymentDate": -1 } },
              { $limit: 10 },
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$paymentHistory.paymentDate" }
                  },
                  totalAmount: { $sum: "$paymentHistory.amount" },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]),
      
      // Trend statistikaları
      Promise.all(
        last6Months.map(async (monthData) => {
          const monthStart = new Date(monthData.year, monthData.month - 1, 1);
          const monthEnd = new Date(monthData.year, monthData.month, 1);
          
          const result = await Employee.aggregate([
            { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
            { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
            {
              $match: {
                "paymentHistory.forMonth": {
                  $gte: monthStart,
                  $lt: monthEnd
                }
              }
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$paymentHistory.amount" },
                count: { $sum: 1 }
              }
            }
          ]);
          
          return {
            month: monthData.name,
            totalAmount: result[0]?.totalAmount || 0,
            paymentCount: result[0]?.count || 0
          };
        })
      )
    ]);

    const salaryData = currentMonthStats[0]?.salaryStats?.[0] || {};
    const dailyPayments = currentMonthStats[0]?.recentPayments || [];

    res.json({
      success: true,
      data: {
        currentMonth: {
          name: targetDate.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' }),
          statistics: salaryData,
          dailyPayments
        },
        paymentTrends,
        summary: {
          totalPaid: salaryData.paid || 0,
          totalPending: salaryData.pending || 0,
          paymentEfficiency: (salaryData.paid + salaryData.pending) > 0 
            ? ((salaryData.paid / (salaryData.paid + salaryData.pending)) * 100).toFixed(1)
            : 0,
          averagePayment: salaryData.paid > 0 
            ? Math.round((salaryData.totalGross || 0) / salaryData.paid)
            : 0
        }
      }
    });

  } catch (error) {
    console.error("Payment statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Ödəniş statistikaları alınarkən xəta baş verdi"
    });
  }
};

// ✅ İşçi qrupları (req.user._id ilə)
export const getEmployeeGroupStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [positionStats, hireYearStats, salaryRanges, employmentStats] = await Promise.all([
      // Vəzifələr
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        { $match: { position: { $exists: true, $ne: "" } } },
        {
          $group: {
            _id: "$position",
            count: { $sum: 1 },
            totalGross: { $sum: "$gross" },
            avgGross: { $avg: "$gross" },
            avgNet: { $avg: "$Net_salary" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // İşə qəbul ili
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: { $year: "$hireDate" },
            count: { $sum: 1 },
            totalGross: { $sum: "$gross" }
          }
        },
        { $sort: { _id: -1 } }
      ]),
      
      // Maaş aralıqları
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        {
          $bucket: {
            groupBy: "$gross",
            boundaries: [0, 1000, 2000, 3000, 5000, 10000],
            default: "10000+",
            output: {
              count: { $sum: 1 },
              avgGross: { $avg: "$gross" },
              avgNet: { $avg: "$Net_salary" }
            }
          }
        }
      ]),
      
      // İşçi statusları
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: {
              status: "$status",
              type: "$employeeType"
            },
            count: { $sum: 1 },
            avgGross: { $avg: "$gross" }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        positions: positionStats.map(pos => ({
          position: pos._id,
          count: pos.count,
          avgGross: pos.avgGross ? Math.round(pos.avgGross) : 0,
          avgNet: pos.avgNet ? Math.round(pos.avgNet) : 0
        })),
        hireYears: hireYearStats.map(year => ({
          year: year._id,
          count: year.count,
          totalGross: year.totalGross
        })),
        salaryRanges: salaryRanges.map(range => ({
          range: range._id,
          count: range.count,
          avgGross: range.avgGross ? Math.round(range.avgGross) : 0,
          avgNet: range.avgNet ? Math.round(range.avgNet) : 0
        })),
        employmentStats: employmentStats.map(stat => ({
          status: stat._id.status,
          type: stat._id.type,
          count: stat.count,
          avgGross: stat.avgGross ? Math.round(stat.avgGross) : 0
        }))
      }
    });

  } catch (error) {
    console.error("Employee group stats error:", error);
    res.status(500).json({
      success: false,
      message: "İşçi qrupları statistikaları alınarkən xəta baş verdi"
    });
  }
};

// ✅ Real-time dashboard (req.user._id ilə)
export const getRealTimeDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const [todayAttendance, duePayments, endingLeaves, recentActivities] = await Promise.all([
      // Bugünkü davamlılıq
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: { path: "$attendances", preserveNullAndEmptyArrays: true } },
        { $match: { "attendances.date": todayStr } },
        {
          $group: {
            _id: "$attendances.status",
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Bu günkü ödənişlər
      Employee.aggregate([
        { 
          $match: { 
            companyId: new mongoose.Types.ObjectId(userId),
            nextPaymentDate: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999))
            }
          }
        },
        {
          $project: {
            employeeName: { $concat: ["$firstName", " ", "$lastName"] },
            amount: "$gross",
            netAmount: "$Net_salary",
            nextPaymentDate: "$nextPaymentDate",
            department: "$Department"
          }
        },
        { $sort: { nextPaymentDate: 1 } },
        { $limit: 10 }
      ]),
      
      // Bitən məzuniyyətlər
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: { path: "$leaves", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            "leaves.status": "approved",
            "leaves.endDate": { $gte: today, $lte: endOfWeek }
          }
        },
        {
          $project: {
            employeeName: { $concat: ["$firstName", " ", "$lastName"] },
            leaveType: "$leaves.leaveType",
            endDate: "$leaves.endDate",
            daysUsed: "$leaves.daysUsed"
          }
        },
        { $sort: { "leaves.endDate": 1 } },
        { $limit: 5 }
      ]),
      
      // Son aktivliklər
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
        { $sort: { "paymentHistory.paymentDate": -1 } },
        { $limit: 5 },
        {
          $project: {
            type: "payment",
            employeeName: { $concat: ["$firstName", " ", "$lastName"] },
            amount: "$paymentHistory.amount",
            date: "$paymentHistory.paymentDate"
          }
        }
      ])
    ]);

    const attendance = todayAttendance.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        today: {
          date: todayStr,
          attendance,
          duePayments,
          totalPresent: attendance.present || 0,
          totalAbsent: attendance.absent || 0,
          totalOnLeave: attendance.on_leave || 0
        },
        upcoming: {
          endingLeaves,
          activities: recentActivities
        },
        alerts: {
          pendingPayments: duePayments.length,
          onLeaveToday: attendance.on_leave || 0,
          absentToday: attendance.absent || 0
        }
      }
    });

  } catch (error) {
    console.error("Real-time dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Real-time məlumatlar alınarkən xəta baş verdi"
    });
  }
};

// ✅ Balans bölgüsü faizləri (req.user._id ilə)
export const getBalanceBreakdownPercentages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "İstifadəçi məlumatları tapılmadı"
      });
    }

    // Balans bölgüsü üçün məlumatları toplamaq
    const [salaryStats, taxStats, departmentStats] = await Promise.all([
      // Maaş statistikaları
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalGross: { $sum: "$gross" },
            totalNet: { $sum: "$Net_salary" },
            totalTax: { $sum: "$tax" },
            totalSocial: { $sum: "$social_pay" }
          }
        }
      ]),
      
      // Vergi statistikaları
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        { $unwind: { path: "$paymentHistory", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            "paymentHistory.paymentType": { $in: ["salary", "tax", "bonus"] }
          }
        },
        {
          $group: {
            _id: "$paymentHistory.paymentType",
            totalAmount: { $sum: "$paymentHistory.amount" }
          }
        }
      ]),
      
      // Departament bölgüsü
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: "$Department",
            totalGross: { $sum: "$gross" },
            employeeCount: { $sum: 1 }
          }
        },
        { $sort: { totalGross: -1 } }
      ])
    ]);

    const salaryData = salaryStats[0] || {};
    const taxData = taxStats.reduce((acc, curr) => {
      acc[curr._id] = curr.totalAmount;
      return acc;
    }, {});
    
    const totalGross = salaryData.totalGross || 1;
    const totalNet = salaryData.totalNet || 0;
    const totalTax = salaryData.totalTax || 0;
    const totalSocial = salaryData.totalSocial || 0;

    // Balans bölgüsü faizləri
    const balanceBreakdown = {
      // Maaş bölgüsü
      salaryDistribution: {
        grossSalary: {
          amount: totalGross,
          percentage: 100
        },
        netSalary: {
          amount: totalNet,
          percentage: totalGross > 0 ? ((totalNet / totalGross) * 100).toFixed(1) : 0
        },
        taxDeductions: {
          amount: totalTax,
          percentage: totalGross > 0 ? ((totalTax / totalGross) * 100).toFixed(1) : 0
        },
        socialDeductions: {
          amount: totalSocial,
          percentage: totalGross > 0 ? ((totalSocial / totalGross) * 100).toFixed(1) : 0
        }
      },
      
      // Ödəniş növləri
      paymentTypes: {
        salaryPayments: {
          amount: taxData.salary || 0,
          percentage: totalGross > 0 ? ((taxData.salary || 0) / totalGross * 100).toFixed(1) : 0
        },
        taxPayments: {
          amount: taxData.tax || 0,
          percentage: totalGross > 0 ? ((taxData.tax || 0) / totalGross * 100).toFixed(1) : 0
        },
        bonusPayments: {
          amount: taxData.bonus || 0,
          percentage: totalGross > 0 ? ((taxData.bonus || 0) / totalGross * 100).toFixed(1) : 0
        }
      },
      
      // Departament bölgüsü
      departmentDistribution: departmentStats.map(dept => ({
        department: dept._id || "Digər",
        amount: dept.totalGross,
        employeeCount: dept.employeeCount,
        percentage: totalGross > 0 ? ((dept.totalGross / totalGross) * 100).toFixed(1) : 0
      })),
      
      // İşçi növü bölgüsü
      employeeTypeDistribution: await Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: "$employeeType",
            totalGross: { $sum: "$gross" },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            type: "$_id",
            amount: "$totalGross",
            employeeCount: "$count",
            percentage: {
              $multiply: [
                { $divide: ["$totalGross", totalGross] },
                100
              ]
            }
          }
        }
      ]),
      
      // Maaş aralığı bölgüsü
      salaryRangeDistribution: await Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(userId) } },
        {
          $bucket: {
            groupBy: "$gross",
            boundaries: [0, 1000, 2000, 3000, 5000, 10000],
            default: "10000+",
            output: {
              count: { $sum: 1 },
              totalAmount: { $sum: "$gross" },
              avgSalary: { $avg: "$gross" }
            }
          }
        },
        {
          $project: {
            range: "$_id",
            employeeCount: "$count",
            totalAmount: "$totalAmount",
            avgSalary: "$avgSalary",
            percentage: {
              $multiply: [
                { $divide: ["$totalAmount", totalGross] },
                100
              ]
            }
          }
        },
        { $sort: { range: 1 } }
      ])
    };

    // Ümumi xülasə
    const summary = {
      totalAmount: totalGross,
      totalEmployees: await Employee.countDocuments({ companyId: userId }),
      averageSalary: totalGross > 0 ? Math.round(totalGross / (await Employee.countDocuments({ companyId: userId }) || 1)) : 0,
      taxBurden: totalGross > 0 ? (((totalTax + totalSocial) / totalGross) * 100).toFixed(1) : 0,
      netToGrossRatio: totalGross > 0 ? ((totalNet / totalGross) * 100).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: {
        balanceBreakdown,
        summary,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Balance breakdown error:", error);
    res.status(500).json({
      success: false,
      message: "Balans bölgüsü məlumatları alınarkən xəta baş verdi",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Payment analitikası (req.user._id ilə)
export const getPaymentAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [payments, cashflow, overduePayments] = await Promise.all([
      // Payment statistikaları
      Payment.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: {
              type: "$type",
              status: "$status",
              currency: "$currency"
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      
      // Cashflow analizi
      Payment.aggregate([
        { $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          dueDate: { $gte: startOfMonth, $lte: endOfMonth }
        }},
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$dueDate" }
            },
            outflow: { 
              $sum: { $cond: [{ $eq: ["$type", "outflow"] }, "$amount", 0] }
            },
            receipt: { 
              $sum: { $cond: [{ $eq: ["$type", "receipt"] }, "$amount", 0] }
            }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 30 }
      ]),
      
      // Overdue ödənişlər
      Payment.find({
        userId: userId,
        status: "overdue"
      }).sort({ dueDate: 1 }).limit(10)
    ]);

    res.json({
      success: true,
      data: {
        paymentSummary: payments,
        cashflow,
        overduePayments,
        totalOverdue: overduePayments.reduce((sum, payment) => sum + payment.amount, 0)
      }
    });

  } catch (error) {
    console.error("Payment analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Ödəniş analitikası alınarkən xəta baş verdi"
    });
  }
};

// ✅ Employee flow statistikaları (req.user._id ilə)
export const getEmployeeFlowStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { year } = req.query;
    
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);

    const [monthlyFlow, departmentFlow, reasons] = await Promise.all([
      // Aylıq axın
      EmployeeFlow.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: "$date" },
              type: "$type"
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: "$_id.month",
            flows: {
              $push: {
                type: "$_id.type",
                count: "$count"
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Departament axını
      EmployeeFlow.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              department: "$department",
              type: "$type"
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: "$_id.department",
            flows: {
              $push: {
                type: "$_id.type",
                count: "$count"
              }
            },
            total: { $sum: "$count" }
          }
        },
        { $sort: { total: -1 } },
        { $limit: 10 }
      ]),
      
      // Əsas səbəblər
      EmployeeFlow.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate },
            reason: { $exists: true, $ne: "" }
          }
        },
        {
          $group: {
            _id: "$reason",
            count: { $sum: 1 },
            types: { $addToSet: "$type" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        monthlyFlow,
        departmentFlow,
        reasons,
        year: targetYear,
        totalFlows: monthlyFlow.reduce((sum, month) => 
          sum + month.flows.reduce((s, flow) => s + flow.count, 0), 0
        )
      }
    });

  } catch (error) {
    console.error("Employee flow stats error:", error);
    res.status(500).json({
      success: false,
      message: "İşçi axını statistikaları alınarkən xəta baş verdi"
    });
  }
};

// ✅ User statistikaları (req.user._id ilə)
export const getUserStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select(
      "monthly_active_employees current_month_total companyName fullName email"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "İstifadəçi tapılmadı"
      });
    }

    // Helper function
    const getMonthNumber = (monthName) => {
      const months = {
        January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
        July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
      };
      return months[monthName] || 0;
    };

    // Aylıq aktiv işçilər statistikası
    const monthlyActive = Object.entries(user.monthly_active_employees || {})
      .map(([month, count]) => ({
        month,
        count,
        monthNumber: getMonthNumber(month)
      }))
      .sort((a, b) => a.monthNumber - b.monthNumber);

    res.json({
      success: true,
      data: {
        userInfo: {
          companyName: user.companyName,
          fullName: user.fullName,
          email: user.email
        },
        monthlyActive,
        currentMonth: user.current_month_total || {},
        summary: {
          totalEmployees: monthlyActive.reduce((sum, month) => sum + month.count, 0),
          averageMonthly: monthlyActive.length > 0 
            ? Math.round(monthlyActive.reduce((sum, month) => sum + month.count, 0) / monthlyActive.length)
            : 0
        }
      }
    });

  } catch (error) {
    console.error("User statistics error:", error);
    res.status(500).json({
      success: false,
      message: "İstifadəçi statistikaları alınarkən xəta baş verdi"
    });
  }
};

// ✅ Test endpointi
export const testDashboard = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Dashboard API işləyir",
      endpoints: {
        dashboard: "GET /api/dashboard",
        weeklyAttendance: "GET /api/dashboard/weekly-attendance",
        departmentDetails: "GET /api/dashboard/department/:department",
        paymentStatistics: "GET /api/dashboard/payment-statistics",
        employeeGroupStats: "GET /api/dashboard/employee-group-stats",
        realtimeDashboard: "GET /api/dashboard/realtime",
        balanceBreakdown: "GET /api/dashboard/balance-breakdown",
        paymentAnalytics: "GET /api/dashboard/payment-analytics",
        employeeFlowStats: "GET /api/dashboard/employee-flow-stats",
        userStatistics: "GET /api/dashboard/user-statistics"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};