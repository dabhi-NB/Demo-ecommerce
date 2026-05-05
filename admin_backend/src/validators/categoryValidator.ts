import Joi from 'joi';

// Validation for creating a new category
export const validateCreateCategory = Joi.object({
  name: Joi.string().min(2).required().messages({
    'string.min': 'Category name must be at least 2 characters',
    'any.required': 'Category name is required'
  }),
  description: Joi.string().optional(),
  parent: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
  image: Joi.string().optional()
});

// Validation for updating a category (all fields optional)
export const validateUpdateCategory = Joi.object({
  name: Joi.string().min(2).optional().messages({
    'string.min': 'Category name must be at least 2 characters'
  }),
  description: Joi.string().optional(),
  parent: Joi.string().optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
  image: Joi.string().optional()
});
