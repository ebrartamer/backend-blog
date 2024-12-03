const Joi = require('joi');


const registerValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(30).required().messages({
            'string.base': 'Username must be a string',
            'string.empty': 'Username cannot be empty',
            'string.min': 'Username must be at least 3 characters',
            'string.max': 'Username must be at most 30 characters',
            'any.required': 'Username is required'
        }),
        email: Joi.string().email().required().messages({
            'string.base': 'Email must be a string',
            'string.empty': 'Email cannot be empty',
            'string.email': 'Please enter a valid email address',
            'any.required': 'Email is required'
        }),
        password: Joi.string().min(6).max(36).required().messages({
            'string.base': 'Password must be a string',
            'string.empty': 'Password cannot be empty',
            'string.min': 'Password must be at least 6 characters',
            'string.max': 'Password must be at most 36 characters',
            'any.required': 'Password is required'
        })
    });

    return schema.validate(data);
};


const loginValidation = (data) => {
    const schema = Joi.object({
        username: Joi.string().required().messages({
            'string.base': 'Username must be a string',
            'string.empty': 'Username cannot be empty',
            'any.required': 'Username is required'
        }),
        password: Joi.string().required().messages({
            'string.base': 'Password must be a string',
            'string.empty': 'Password cannot be empty',
            'any.required': 'Password is required'
        })
    });

    return schema.validate(data);
};

module.exports = { registerValidation, loginValidation };