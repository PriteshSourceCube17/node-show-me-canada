const { body, param } = require("express-validator");

// auth
const signUpValidation = [
    body("username").not().isEmpty().trim().withMessage("username is required."),
    body("email").not().isEmpty().trim().withMessage("email is required."),
    body("password").not().isEmpty().trim().withMessage("password is required."),
    body("mobileNumber").not().isEmpty().trim().withMessage("mobileNumber is required."),
    body("mobileCountryCode").not().isEmpty().trim().withMessage("mobileCountryCode is required."),
    body("role").not().isEmpty().withMessage("role is required.").custom((value) => {
        if (value !== undefined && value !== null && (value === "tourist" || value === "tour-guide")) {
            return true;
        }
        throw new Error("Role must be valid");
    }),
    body("securityQuestions").isArray().withMessage("securityQuestions is required."),
    body("securityQuestions").custom((value) => {
        if (Array.isArray(value) && value.length === 3) {
            return true;
        }
        throw new Error("Must be fill three questions.");
    }),
    body("securityQuestions.*.questionId").not().isEmpty().withMessage("questionId is required"),
    body("securityQuestions.*.answer").not().isEmpty().withMessage("answer is required."),
]

// login
const loginValidation = [
    body("email").not().isEmpty().trim().withMessage("email is required."),
    body("password").not().isEmpty().trim().withMessage("password is required."),
]

// reset password
const resetPassword = [
    body("resetPasswordToken").not().isEmpty().trim().withMessage("restPasswordToken is required."),
    body("password").not().isEmpty().trim().withMessage("password is required."),
]
// change password
const changePassword = [
    body("currentPassword").not().isEmpty().trim().withMessage("currentPassword is required."),
    body("newPassword").not().isEmpty().trim().withMessage("newPassword is required."),
]

// add review
const addReview = [
    body("bookingId").not().isEmpty().trim().withMessage("bookingId is required."),
    body("review").not().isEmpty().trim().withMessage("review is required."),
    body("rating").not().isEmpty().trim().withMessage("rating is required."),
]

module.exports = {
    signUpValidation,
    loginValidation,
    resetPassword,
    changePassword,
    addReview
}
