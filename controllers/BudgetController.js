import Budget from "../models/Budget.js";
import ExcelJS from "exceljs";

//Yeni büdcə planı yaratmaq
export const createBudget = async (req, res) => {
  try {
    let { department, year, monthlyBudgets } = req.body;

    if (!department || year == null) {
      return res.status(400).json({ message: "department və year mütləqdir" });
    }

    department = String(department).trim();
    const yearNum = Number(year);

    if (!Number.isFinite(yearNum)) {
      return res.status(400).json({ message: "Year düzgün deyil" });
    }

    if (!Array.isArray(monthlyBudgets)) monthlyBudgets = [];

    // eyni departament+il təkrar olmasın
    const existingBudget = await Budget.findOne({
      department,
      year: yearNum,
    });

    if (existingBudget) {
      return res.status(400).json({
        message: "Bu departament üçün bu il artıq büdcə planı mövcuddur.",
      });
    }

    const budget = await Budget.create({
      department,
      year: yearNum,
      monthlyBudgets,
      createdBy: req.user?._id,
    });

    res.status(201).json({ message: "Büdcə planı uğurla yaradıldı.", budget });
  } catch (error) {
    // Unique index error (duplicate)
    if (error?.code === 11000) {
      return res.status(400).json({
        message: "Bu departament üçün bu il artıq büdcə planı mövcuddur.",
      });
    }

    console.error("Create Budget Error:", error);
    res.status(500).json({ message: "Server xətası baş verdi." });
  }
};
//Bütün büdcələri gətir (ümumi siyahı)
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find().sort({ year: -1, department: 1 });
    res.status(200).json(budgets);
  } catch (error) {
    console.error("Get Budgets Error:", error);
    res.status(500).json({ message: "Server xətası baş verdi." });
  }
};

//Departament üzrə illik büdcə detalları (chart və cədvəl üçün)
export const getBudgetByDepartment = async (req, res) => {
  try {
    const { department, year } = req.params;
    const budget = await Budget.findOne({ department, year });

    if (!budget) {
      return res
        .status(404)
        .json({ message: "Bu departament üçün büdcə tapılmadı." });
    }

    res.status(200).json(budget);
  } catch (error) {
    console.error("Get Budget By Department Error:", error);
    res.status(500).json({ message: "Server xətası baş verdi." });
  }
};
//Mövcud büdcəni yeniləmək (məs: faktiki xərcləri dəyişmək)
export const updateBudget = async (req, res) => {
  try {
    const id = req.params.id.trim(); // Budget ID (Mongo ObjectId)
    const { monthlyBudgets } = req.body;

    const budget = await Budget.findById(id);
    if (!budget) {
      return res.status(404).json({ message: "Büdcə tapılmadı." });
    }

    // Yeni aylıq məlumatları əvəz et (əgər gəlirsə)
    if (monthlyBudgets) {
      budget.monthlyBudgets = monthlyBudgets;
    }

    // Mongoose pre-save hook avtomatik hesablayacaq
    await budget.save();

    res.status(200).json({ message: "Büdcə uğurla yeniləndi.", budget });
  } catch (error) {
    console.error("Update Budget Error:", error);
    res.status(500).json({ message: "Server xətası baş verdi." });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const id = req.params.id.trim();
    const budget = await Budget.findByIdAndDelete(id);

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Delete Budget Error:", error);
    res.status(500).json({ message: "Failed to delete budget", error });
  }
};
// Bütün büdcələr üzrə ümumi hesabat
export const getBudgetReport = async (req, res) => {
  try {
    const { department, year } = req.query;

    const query = {};
    if (department) query.department = { $regex: new RegExp(department, "i") };
    if (year) query.year = Number(year);

    const budgets = await Budget.find(query);

    if (!budgets.length) {
      return res.status(404).json({
        message: "No budget data found for this filter",
        totalPlanned: 0,
        totalActual: 0,
        totalDifference: 0,
        totalUsageRate: "0%",
        budgets: [],
      });
    }

    // Ümumi cəmləri hesablayırıq
    let totalPlanned = 0;
    let totalActual = 0;
    let totalDifference = 0;

    const reportData = budgets.map((budget) => {
      const monthlyData = budget.monthlyBudgets.map((month) => {
        const totalPlannedMonth = month.categories.reduce(
          (sum, c) => sum + c.plannedAmount,
          0
        );
        const totalActualMonth = month.categories.reduce(
          (sum, c) => sum + c.actualAmount,
          0
        );
        const difference = totalActualMonth - totalPlannedMonth;
        const usageRate = (
          (totalActualMonth / totalPlannedMonth) *
          100
        ).toFixed(2);

        totalPlanned += totalPlannedMonth;
        totalActual += totalActualMonth;
        totalDifference += difference;

        return {
          month: month.month,
          totalPlanned: totalPlannedMonth,
          totalActual: totalActualMonth,
          difference,
          usageRate: usageRate + "%",
        };
      });

      return {
        department: budget.department,
        year: budget.year,
        monthlyData,
      };
    });

    const totalUsageRate =
      ((totalActual / totalPlanned) * 100).toFixed(2) + "%";

    res.status(200).json({
      message: "Budget report generated successfully",
      totalPlanned,
      totalActual,
      totalDifference,
      totalUsageRate,
      budgets: reportData,
    });
  } catch (error) {
    console.error("Get Budget Report Error:", error);
    res.status(500).json({ message: "Server error while generating report" });
  }
};

// Büdcə məlumatlarını Excel faylı kimi ixrac et
export const exportBudgetToExcel = async (req, res) => {
  try {
    const { department, year } = req.query;

    const query = {};
    if (department) query.department = { $regex: new RegExp(department, "i") };
    if (year) query.year = Number(year);

    const budgets = await Budget.find(query);

    if (!budgets.length) {
      return res
        .status(404)
        .json({ message: "No budget data found for this filter" });
    }

    // Workbook və Sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Budget Report");

    // Başlıqlar
    worksheet.columns = [
      { header: "Department", key: "department", width: 25 },
      { header: "Year", key: "year", width: 10 },
      { header: "Month", key: "month", width: 15 },
      { header: "Category", key: "category", width: 25 },
      { header: "Planned Amount", key: "plannedAmount", width: 18 },
      { header: "Actual Amount", key: "actualAmount", width: 18 },
      { header: "Difference", key: "difference", width: 15 },
      { header: "Usage Rate (%)", key: "usageRate", width: 18 },
      { header: "Status", key: "status", width: 15 },
    ];

    // 🔹 Məlumatların əlavə olunması
    budgets.forEach((budget) => {
      (budget.monthlyBudgets || []).forEach((month) => {
        (month.categories || []).forEach((cat) => {
          worksheet.addRow({
            department: budget.department,
            year: budget.year,
            month: month.month,
            category: cat.name,
            plannedAmount: cat.plannedAmount,
            actualAmount: cat.actualAmount,
            difference: cat.difference,
            usageRate: cat.usageRate ? cat.usageRate.toFixed(2) : "0.00",
            status: cat.status,
          });
        });
      });
    });

    // Header dizaynı
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Cavab olaraq Excel göndər
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=budget-report-${year || "all"}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Export Excel Error:", error);
    res
      .status(500)
      .json({ message: "Server xətası baş verdi (Excel export zamanı)" });
  }
};
