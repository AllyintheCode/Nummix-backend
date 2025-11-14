import Transaction from "../models/Transaction.js";

export const getGeneralLedgerWithTotals = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: 1 }).lean();

    const ledger = {};

    transactions.forEach((txn) => {
      txn.entries.forEach((entry) => {
        if (!ledger[entry.account]) {
          ledger[entry.account] = {
            account: entry.account,
            entries: [],
            balance: 0,
          };
        }

        const amount = entry.type === "debit" ? entry.amount : -entry.amount;
        ledger[entry.account].balance += amount;

        ledger[entry.account].entries.push({
          date: txn.date,
          reference: txn.reference,
          description: txn.description || "",
          type: entry.type,
          amount: entry.amount,
          balance: ledger[entry.account].balance,
        });
      });
    });

    const assetAccounts = ["Cash", "Bank"];
    const liabilityAccounts = ["Expense"];
    const equityAccounts = ["Sales"];
    const incomeAccounts = ["Sales"];
    const expenseAccounts = ["Expense"];

    const totalAssets = Object.values(ledger)
      .filter((acc) => assetAccounts.includes(acc.account))
      .reduce((sum, acc) => sum + acc.balance, 0);

    const totalLiabilities = Object.values(ledger)
      .filter((acc) => liabilityAccounts.includes(acc.account))
      .reduce((sum, acc) => sum + acc.balance, 0);

    const totalEquity = Object.values(ledger)
      .filter((acc) => equityAccounts.includes(acc.account))
      .reduce((sum, acc) => sum + acc.balance, 0);

    const totalIncome = Object.values(ledger)
      .filter((acc) => incomeAccounts.includes(acc.account))
      .reduce((sum, acc) => sum + acc.balance, 0);

    const totalExpense = Object.values(ledger)
      .filter((acc) => expenseAccounts.includes(acc.account))
      .reduce((sum, acc) => sum + acc.balance, 0);

    res.json({
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalIncome,
        totalExpense,
      },
      ledger: Object.values(ledger),
    });
  } catch (err) {
    console.error("General Ledger Error:", err);
    res.status(500).json({ error: "Server xətası" });
  }
};
