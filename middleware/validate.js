const { z } = require("zod");

/**
 * Zod validation middleware factory.
 * @param {z.ZodSchema} schema - Zod schema to validate req.body against
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

// ---------- Auth Schemas ----------
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ---------- Cart Schemas ----------
const addToCartSchema = z.object({
  productId: z.number().int().positive("Product ID must be a positive integer"),
  quantity: z.number().int().min(1).max(50).default(1),
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(1).max(50),
});

// ---------- Order Schemas ----------
const placeOrderSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  phone: z.string().optional(),
});

// ---------- Product Schemas ----------
const addProductSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  price: z.number().positive(),
  unit: z.string().min(1),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
  stock: z.number().int().min(0).optional().default(0),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  addToCartSchema,
  updateCartSchema,
  placeOrderSchema,
  addProductSchema,
};
