import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(1).required().messages({
    'string.min': 'Password is required',
    'any.required': 'Password is required'
  }),
  device_uid: Joi.string().required().messages({
    'any.required': 'Device UID is required'
  }),
  timezone: Joi.string().optional().default('UTC')
});

export const changePasswordSchema = Joi.object({
  old_password: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  new_password: Joi.string().min(6).max(100).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.max': 'New password must not exceed 100 characters',
    'any.required': 'New password is required'
  }),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
    'any.only': 'Password confirmation does not match',
    'any.required': 'Password confirmation is required'
  })
});
