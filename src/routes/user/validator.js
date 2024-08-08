const { body, validationResult } = require('express-validator');


module.exports = new class {
    paRegisterValidation() {        
        return [
            body('firstName')
                .isLength({ min: 1 })
                .withMessage('firstName must be at least 4 chars long')
                .isLength({ max: 50 })
                .withMessage(' firstName must be less than 12 chars long')
                .exists()
                .withMessage('firstName is required')
                .trim()
                .matches(/^[A-Za-z0-9\_]+$/)
                .withMessage('firstName must be alphanumeric only')
                .escape(),
            body('lastName')
                .isLength({ min: 1 })
                .withMessage('lastName must be at least 4 chars long')
                .isLength({ max: 50 })
                .withMessage(' lastName must be less than 12 chars long')
                .exists()
                .withMessage('lastName is required')
                .trim()
                .matches(/^[A-Za-z0-9\_]+$/)
                .withMessage('lastName must be alphanumeric only')
                .escape(),
            body('lastName')
                .isLength({ min: 1 })
                .withMessage('lastName must be at least 4 chars long')
                .isLength({ max: 50 })
                .withMessage(' lastName must be less than 12 chars long')
                .exists()
                .withMessage('lastName is required')
                .trim()
                .matches(/^[A-Za-z0-9\_]+$/)
                .withMessage('lastName must be alphanumeric only')
                .escape(),
            body('height')                
                .exists()
                .withMessage('height is required')
                .trim()
                .matches(/^[0-9\_]+$/)
                .withMessage('height must be Numeric only')
                .escape(),
            body('weith')                
                .exists()
                .withMessage('height is required')
                .trim()
                .matches(/^[0-9\_]+$/)
                .withMessage('height must be Numeric only')
                .escape(),
            body('mobileNumber')                
                .exists()
                .withMessage('mobileNumber is required')
                .trim()
                .matches(/^[0-9\_]+$/)
                .withMessage('mobileNumber must be Numeric only')
                .escape()
          
        ]

    }
    dgRegisterValidation() {        
        return [
            body('firstName')
                .isLength({ min: 3 })
                .withMessage('firstName must be at least 3 chars long')
                .isLength({ max: 30 })
                .withMessage(' firstName must be less than 30 chars long')
                .exists()
                .withMessage('firstName is required')
                .trim()
                .matches(/^[A-Za-z0-9\_]+$/)
                .withMessage('firstName must be alphanumeric only')
                .escape(),
            body('lastName')
                .isLength({ min: 3 })
                .withMessage('lastName must be at least 3 chars long')
                .isLength({ max: 50 })
                .withMessage(' lastName must be less than 50 chars long')
                .exists()
                .withMessage('lastName is required')
                .trim()
                .matches(/^[A-Za-z0-9\_]+$/)
                .withMessage('lastName must be alphanumeric only')
                .escape(),
            body('email').isEmail().normalizeEmail().withMessage('Invalid Email').exists(),
            body('mobileNumber')                
                .exists()
                .withMessage('mobileNumber is required')
                .trim()
                .matches(/^[0-9\_]+$/)
                .withMessage('mobileNumber must be Numeric only')
                .escape()
          
        ]

    }
    hospitalValidation() {
        return [
          
            body('name')
                .isLength({ min: 5 })
                .withMessage('hospital name must be at least 2 chars long')
                .isLength({ max: 50 })
                .withMessage('hospital name must be at max 50 chars long')
                
                .exists(),
        ]
    }
}