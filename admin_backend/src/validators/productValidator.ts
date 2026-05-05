import Joi from 'joi';

// Validation for creating a new product
export const validateCreateProduct = Joi.object({
  name: Joi.string().min(2).required().messages({
    'string.min': 'Product name must be at least 2 characters',
    'any.required': 'Product name is required'
  }),
  slug: Joi.string().optional(),
  category: Joi.string().required().messages({
    'any.required': 'Category is required'
  }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'Price must be greater than or equal to 0',
    'any.required': 'Price is required'
  }),
  stock: Joi.number().min(0).required().messages({
    'number.min': 'Stock must be greater than or equal to 0',
    'any.required': 'Stock is required'
  }),
  salePrice: Joi.number().min(0).optional(),
  description: Joi.string().optional(),
  shortDescription: Joi.string().optional(),
  brand: Joi.string().optional(),
  sku: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  weight: Joi.number().min(0).optional(),
  specifications: Joi.array().optional(),
  compatibleWith: Joi.array().optional(),
  variants: Joi.array().optional(),
  variantOptions: Joi.array().optional(),
});

// Validation for updating a product (all fields optional)
export const validateUpdateProduct = Joi.object({
  name: Joi.string().min(2).optional().messages({
    'string.min': 'Product name must be at least 2 characters'
  }),
  slug: Joi.string().optional(),
  category: Joi.string().optional(),
  price: Joi.number().min(0).optional().messages({
    'number.min': 'Price must be greater than or equal to 0'
  }),
  stock: Joi.number().min(0).optional().messages({
    'number.min': 'Stock must be greater than or equal to 0'
  }),
  salePrice: Joi.number().min(0).optional(),
  description: Joi.string().optional(),
  shortDescription: Joi.string().optional(),
  brand: Joi.string().optional(),
  sku: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  weight: Joi.number().min(0).optional(),
  specifications: Joi.array().optional(),
  compatibleWith: Joi.array().optional(),
  variants: Joi.array().optional(),
  variantOptions: Joi.array().optional(),
  removeImages: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional()
});

// Validation for stock update
export const validateStockUpdate = Joi.object({
  stock: Joi.number().min(0).required().messages({
    'number.min': 'Stock must be greater than or equal to 0',
    'any.required': 'Stock is required'
  }),
  variantId: Joi.string().optional()
});

// Validation for bulk stock update
export const validateBulkStockUpdate = Joi.object({
  updates: Joi.array().items(
    Joi.object({
      productId: Joi.string().required().messages({
        'any.required': 'Product ID is required'
      }),
      variantId: Joi.string().optional(),
      stock: Joi.number().min(0).required().messages({
        'number.min': 'Stock must be greater than or equal to 0',
        'any.required': 'Stock is required'
      })
    })
  ).min(1).required().messages({
    'array.min': 'At least one update is required',
    'any.required': 'Updates array is required'
  })
});
