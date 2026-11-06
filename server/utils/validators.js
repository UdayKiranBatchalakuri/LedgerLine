const { z } = require("zod");

const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(50),

  email: z.string()
    .trim()
    .email("Enter a valid email address")
    .max(254)
    .transform((value) => value.toLowerCase()),

  password: z.string()
    .min(8, "Password must contain at least 8 characters")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password must not exceed 72 bytes"
    )
});

const loginSchema = z.object({
  email: z.string()
    .trim()
    .email("Enter a valid email address")
    .transform((value) => value.toLowerCase()),

  password: z.string()
    .min(1, "Password is required")
    .refine(
      (value) => Buffer.byteLength(value, "utf8") <= 72,
      "Password must not exceed 72 bytes"
    )
});

module.exports = {
  registerSchema,
  loginSchema
};