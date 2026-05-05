import Joi from 'joi';

// Validation for creating a new coupon
export const validateCreateCoupon = Joi.object({
  code: Joi.string().pattern(/^[A-Z0-9-]+$/i).required().messages({
    'string.pattern.base': 'Coupon code must contain only letters, numbers, and hyphens',
    'any.required': 'Coupon code is required'
  }),
  discountType: Joi.string().valid('percentage', 'fixed').required().messages({
    'any.only': 'Discount type must be either "percentage" or "fixed"',
    'any.required': 'Discount type is required'
  }),
  discountValue: Joi.number().positive().required().messages({
    'number.positive': 'Discount value must be greater than 0',
    'any.required': 'Discount value is required'
  }),
  minOrderAmount: Joi.number().min(0).optional(),
  maxDiscountAmount: Joi.number().min(0).optional(),
  validFrom: Joi.date().required().messages({
    'date.base': 'Valid from must be a valid date',
    'any.required': 'Valid from date is required'
  }),
  validUntil: Joi.date().greater(Joi.ref('validFrom')).required().messages({
    'date.base': 'Valid until must be a valid date',
    'date.greater': 'Valid until must be after valid from date',
    'any.required': 'Valid until date is required'
  }),
  usageLimit: Joi.number().min(1).optional(),
  usagePerUser: Joi.number().min(1).optional(),
  isActive: Joi.boolean().optional(),
  description: Joi.string().optional()
});

// Custom validation for percentage discount
export const validateCouponDiscount = (value: any, helpers: any) => {
  if (value.discountType === 'percentage' && value.discountValue > 100) {
    return helpers.error('number.max', { limit: 100 });
  }
  return value;
};

// Validation for updating a coupon (all fields optional)
export const validateUpdateCoupon = Joi.object({
  code: Joi.string().pattern(/^[A-Z0-9-]+$/i).optional().messages({
    'string.pattern.base': 'Coupon code must contain only letters, numbers, and hyphens'
  }),
  discountType: Joi.string().valid('percentage', 'fixed').optional().messages({
    'any.only': 'Discount type must be either "percentage" or "fixed"'
  }),
  discountValue: Joi.number().positive().optional().messages({
    'number.positive': 'Discount value must be greater than 0'
  }),
  minOrderAmount: Joi.number().min(0).optional(),
  maxDiscountAmount: Joi.number().min(0).optional(),
  validFrom: Joi.date().optional().messages({
    'date.base': 'Valid from must be a valid date'
  }),
  validUntil: Joi.date().optional().messages({
    'date.base': 'Valid until must be a valid date'
  }),
  usageLimit: Joi.number().min(1).optional(),
  usagePerUser: Joi.number().min(1).optional(),
  isActive: Joi.boolean().optional(),
  description: Joi.string().optional()
});
