import Payment from "../models/Payment.js";

// helper: statusu runtime hesabla (DB update eləmir)
const calcStatus = (dueDate, currentStatus) => {
  if (currentStatus === "completed") return "completed";

  const now = new Date();
  // gün müqayisəsi (time yox)
  const due = new Date(dueDate);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueDay < nowDay) return "overdue";
  if (dueDay.getTime() === nowDay.getTime()) return "pending";
  return "planned";
};

// Yeni payment yarat
export const createPayment = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      userId: req.user._id, // body-dən yox!
      createdBy: req.user._id,
    };

    const payment = await Payment.create(payload);
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Bütün paymentləri al (yalnız user-ə aid)
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({
      dueDate: 1,
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Statusları hesablamaq (ümumi rəqəmlər üçün) - user filter
export const getPaymentStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalOutflow = await Payment.aggregate([
      { $match: { userId, type: "outflow" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalReceivable = await Payment.aggregate([
      { $match: { userId, type: "receipt" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // status DB-də köhnə qala bilər deyə overdue-ları dueDate ilə də hesablamaq olar
    const now = new Date();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overduePayments = await Payment.countDocuments({
      userId,
      type: "outflow",
      status: { $ne: "completed" },
      dueDate: { $lt: nowDay },
    });

    const overdueReceivables = await Payment.countDocuments({
      userId,
      type: "receipt",
      status: { $ne: "completed" },
      dueDate: { $lt: nowDay },
    });

    res.json({
      totalOutflow: totalOutflow[0]?.total || 0,
      totalReceivable: totalReceivable[0]?.total || 0,
      overduePayments,
      overdueReceivables,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Növbəti 7 gün üçün planlaşdırılmış ödənişlər və gəlirlər (user filter + urgent düz)
export const getNext7DaysSchedule = async (req, res) => {
  try {
    const userId = req.user._id;

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const nextWeekEnd = new Date(todayStart);
    nextWeekEnd.setDate(todayStart.getDate() + 7);
    // günün sonu (23:59:59.999)
    nextWeekEnd.setHours(23, 59, 59, 999);

    const schedule = await Payment.find({
      userId,
      dueDate: { $gte: todayStart, $lte: nextWeekEnd },
    }).sort({ dueDate: 1 });

    const formatted = schedule.map((p) => {
      const computedStatus = calcStatus(p.dueDate, p.status);
      return {
        date: p.dueDate,
        supplierName: p.supplierName,
        type: p.type,
        amount: p.amount,
        status: computedStatus,
        urgent: computedStatus === "overdue" ? "Təcili" : null,
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
