import taxCalculationService from '../services/taxCalculationService.js';

export const calculateTaxes = async (req, res) => {
  try {
    const { salary, employeeType } = req.body;

    if (!salary || salary < 400) {
      return res.status(400).json({
        success: false,
        error: 'Əməkhaqqı 400 AZN-dən aşağı ola bilməz'
      });
    }

    if (!employeeType || !['state', 'private'].includes(employeeType)) {
      return res.status(400).json({
        success: false,
        error: 'İşçi növü düzgün deyil. "state" və ya "private" olmalıdır'
      });
    }

    const result = taxCalculationService.calculateAllTaxes(salary, employeeType);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getCalculationExamples = async (req, res) => {
  try {
    const examples = taxCalculationService.getCalculationExamples();
    
    res.json({
      success: true,
      data: examples
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const calculateBulkTaxes = async (req, res) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        error: 'Employees array göndərilməlidir'
      });
    }

    const results = employees.map(emp => {
      try {
        return {
          employee: emp,
          calculation: taxCalculationService.calculateAllTaxes(emp.salary, emp.employeeType)
        };
      } catch (error) {
        return {
          employee: emp,
          error: error.message
        };
      }
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};