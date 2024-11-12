    const { check } = require(`express-validator`)
    const User = require(`../models/User`)

    const signupValidation = [
        check('username')
            .notEmpty()
            .withMessage('Username is required')
            .custom(async (username) => {
                const existingUser = await User.findOne({ username });
                if (existingUser) {
                    throw new Error('Username is already in use');
                }
                return true;
            }),
    
        check('email')
            .isEmail()
            .withMessage('Invalid Email')
            .notEmpty()
            .withMessage('Email is required')
            .custom(async (email) => {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    throw new Error('Email is already in use');
                }
                return true;
            }),
    
        check('password')
            .isLength({ min: 6 })
            .withMessage('Password length must be greater than 6')
            .notEmpty()
            .withMessage('Password is required'),
    ];

    const signinValidator = [
        check(`email`)
        .isEmail()
        .withMessage(`Invalid Email`)
        .notEmpty()
        .withMessage(`Email is required`),

        check(`password`)
        .isLength({min: 6})
        .withMessage(`Password length must be greater than 6`) 
        .notEmpty()
        .withMessage(`Password is required`),
    ];

    const emailValidator = [
        check(`email`)
        .isEmail()
        .withMessage(`Invalid Email`)
        .notEmpty()
        .withMessage(`Email is required`),
    ];

    const verifyUserValidator = [
        check(`email`)
        .isEmail()
        .withMessage(`Invalid Email`)
        .notEmpty()
        .withMessage(`Email is required`),

        check(`code`)
        .notEmpty().
        withMessage(`Code is required`)
    ]

    module.exports = { 
        signupValidation, 
        signinValidator, 
        emailValidator, 
        verifyUserValidator 
    }