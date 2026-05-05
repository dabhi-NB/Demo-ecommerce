import Joi from 'joi';


export const accountRegisterSchema = Joi.object({

  first_name: Joi.string()
    .trim()
    .pattern(/^[A-Za-z]+$/)
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'First name must contain only letters',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),

  last_name: Joi.string()
    .trim()
    .pattern(/^[A-Za-z]+$/)
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'Last name must contain only letters',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),

  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10 digits',
      'any.required': 'Phone number is required'
    }),

  password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.max': 'Password cannot exceed 100 characters',
    'any.required': 'Password is required'
  }),




  recaptcha_token: Joi.string().required().messages({
    'any.required': 'reCAPTCHA verification is required'
  }),

  device_uid: Joi.string().optional().messages({
    'any.required': 'Device UID is required'
  }),

  timezone: Joi.string().optional().default('UTC'),

  country: Joi.string().optional().default('')
});
export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  otp: Joi.string() 
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numeric digits',
      'any.required': 'OTP is required',
    }),
});