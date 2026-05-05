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
  current_password: Joi.string().min(6).required(),
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Confirm password does not match',
    }),
});
