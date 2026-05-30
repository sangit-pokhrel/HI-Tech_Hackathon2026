import { Customer } from "../db/schema";

export const createCustomer = async ({ body, set }: any) => {
  try {
    const newCustomer = new Customer(body);
    const savedCustomer = await newCustomer.save();
    set.status = 201;
    return {
      success: true,
      message: "Customer created successfully",
      data: savedCustomer,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to create customer",
    };
  }
};

export const getAllCustomers = async ({ set }: any) => {
  try {
    const customers = await Customer.find().sort({ created_at: -1 });
    return {
      success: true,
      data: customers,
    };
  } catch (error: any) {
    set.status = 500;
    return {
      success: false,
      message: error.message || "Failed to retrieve customers",
    };
  }
};

export const getCustomerById = async ({ params: { id }, set }: any) => {
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      set.status = 404;
      return {
        success: false,
        message: "Customer not found",
      };
    }
    return {
      success: true,
      data: customer,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Invalid customer ID or query",
    };
  }
};

export const updateCustomer = async ({ params: { id }, body, set }: any) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCustomer) {
      set.status = 404;
      return {
        success: false,
        message: "Customer not found",
      };
    }

    return {
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to update customer",
    };
  }
};

export const deleteCustomer = async ({ params: { id }, set }: any) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      set.status = 404;
      return {
        success: false,
        message: "Customer not found",
      };
    }

    return {
      success: true,
      message: "Customer deleted successfully",
      data: deletedCustomer,
    };
  } catch (error: any) {
    set.status = 400;
    return {
      success: false,
      message: error.message || "Failed to delete customer",
    };
  }
};
