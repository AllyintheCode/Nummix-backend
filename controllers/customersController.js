import Customer from "../models/customersSchema.js";

export const getAllCustomers = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";

        const customers = await Customer.find({ isActive: true, $text: { $search: searchQuery } }).sort({
            createdAt: -1,
        });

        if (!customers || !customers.length) {
            return res.status(404).json({ message: "No customers found." });
        }

        res.status(200).json({
            message: "Customers retrieved successfully",
            data: customers,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSingleCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        res.status(200).json({
            message: "Customer retrieved successfully",
            data: customer,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const createCustomer = async (req, res) => {
    try {
        const { companyName, contactPerson, email, location, phone, tin, segment } = req.body;

        if (!companyName || !contactPerson || !email || !location || !phone || !tin || !segment) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newCustomer = new Customer({
            companyName,
            contactPerson,
            email,
            location,
            phone,
            tin,
            segment,
        });

        const savedCustomer = await newCustomer.save();

        res.status(201).json({
            message: "Customer created successfully",
            data: savedCustomer,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const changeCustomerActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({ message: "Customer not found." });
        }

        customer.isActive = !customer.isActive;
        await customer.save();

        res.status(200).json({
            message: "Customer status updated successfully",
            data: customer,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};
