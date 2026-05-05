import Joi from 'joi';

// Joi validation schema for user creation and update
export const userValidationSchema = Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(6) // required for create, optional for update
});