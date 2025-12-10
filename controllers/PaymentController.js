import Payment from "../models/Payment.js";

// Yeni payment yarat
export const createPayment = async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Bütün paymentləri al
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Statusları hesablamaq (ümumi rəqəmlər üçün)
export const getPaymentStats = async (req, res) => {
  try {
    const totalOutflow = await Payment.aggregate([
      { $match: { type: "outflow" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalReceivable = await Payment.aggregate([
      { $match: { type: "receipt" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const overduePayments = await Payment.countDocuments({
      type: "outflow",
      status: "overdue",
    });
    const overdueReceivables = await Payment.countDocuments({
      type: "receipt",
      status: "overdue",
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

// Növbəti 7 gün üçün planlaşdırılmış ödənişlər və gəlirlər
export const getNext7DaysSchedule = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const schedule = await Payment.find({
      dueDate: { $gte: today, $lte: nextWeek },
    }).sort({ dueDate: 1 });

    const formatted = schedule.map((p) => ({
      date: p.dueDate,
      supplierName: p.supplierName,
      type: p.type,
      amount: p.amount,
      urgent: p.dueDate < new Date() ? "Təcili" : null,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
