import Joi from "joi";

/**
 * Joi validation schema for Profile Update
 */
export const profileValidationSchema = Joi.object({
  first_name: Joi.string()
    .required()
    .pattern(/^[A-Za-z]+$/)
    .messages({
      "string.base": "First name must be a string",
      "string.empty": "First name is required",
      "string.pattern.base": "First name can contain only letters",
    }),

  last_name: Joi.string()
    .required()
    .pattern(/^[A-Za-z]+$/)
    .messages({
      "string.base": "Last name must be a string",
      "string.empty": "Last name is required",
      "string.pattern.base": "Last name can contain only letters",
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Please enter a valid email address",
      "string.empty": "Email is required",
    }),

  phone: Joi.string()
    .required()
    .messages({
      "string.empty": "Phone number is required",
    }),
});
