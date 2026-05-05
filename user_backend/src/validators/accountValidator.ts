import Joi from "joi";

export const accountUpdateSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .pattern(/^[A-Za-z]+$/)
    .min(3)
    .max(50)
    .optional()
    .messages({
      'string.pattern.base': 'First name must contain only letters',
      'string.min': 'First name must be at least 3 characters',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  last_name: Joi.string()
    .trim()
    .pattern(/^[A-Za-z]+$/)
    .min(3)
    .max(50)
    .optional()
    .messages({
      'string.pattern.base': 'Last name must contain only letters',
      'string.min': 'Last name must be at least 3 characters',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  country: Joi.string().optional(),
  timezone: Joi.string().optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  image: Joi.string().optional(), // <-- allow "image" field
  userId: Joi.string().optional(), // <-- allow "userId" field as fallback
  // add other fields as needed
});
