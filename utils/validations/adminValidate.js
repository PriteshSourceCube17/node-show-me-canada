const { body, param } = require("express-validator");

// profile
const loginValidation = [
    body("email").not().isEmpty().trim().withMessage("email is required."),
    body("password").not().isEmpty().trim().withMessage("password is required."),
]
const changePasswordValidation = [
    body("currentPassword").not().isEmpty().trim().withMessage("currentPassword is required."),
    body("newPassword").not().isEmpty().trim().withMessage("newPassword is required."),
]

// activity
const updateOptionValidation = [
    body("id").not().isEmpty().trim().withMessage("id is required."),
    body("name").optional(),
    body("status").optional().custom((value) => {
        if (value !== undefined && value !== null && (value === 0 || value === 1)) {
            return true;
        }
        throw new Error("status must be either 0 or 1.");
    }),
];

// detected key word
const updateKeywordValidation = [
    body("id").not().isEmpty().trim().withMessage("id is required."),
    body("keyword").optional(),
    body("status").optional().custom((value) => {
        if (value !== undefined && value !== null && (value === 0 || value === 1)) {
            return true;
        }
        throw new Error("status must be either 0 or 1.");
    }),
];

// user
const changeUserStatusValidation = [
    body("userId").not().isEmpty().trim().withMessage("userId is required."),
    body("status").not().isEmpty().trim().custom((value) => {
        if (value !== undefined && value !== null && (value == 0 || value == 1)) {
            return true;
        }
        throw new Error("status must be either 0 or 1.");
    }),
];

const changeFeaturedStatusValidation = [
    body("userId").not().isEmpty().trim().withMessage("userId is required."),
    body("isFeatured").not().isEmpty().trim().custom((value) => {
        if (value !== undefined && value !== null && (value == 0 || value == 1)) {
            return true;
        }
        throw new Error("isFeatured must be either 0 or 1.");
    }),
];

// subscription
const addSubscriptionValidation = [
    body('title').not().isEmpty().trim().withMessage("title is required."),
    body('description').not().isEmpty().trim().withMessage("description is required."),
    body('noOfProfileImage').not().isEmpty().trim().withMessage("noOfProfileImage is required."),
    body('noOfCoverImage').not().isEmpty().trim().withMessage("noOfCoverImage is required."),
    body('noOfTourPackage').not().isEmpty().trim().withMessage("noOfTourPackage is required."),
    // body('duration').not().isEmpty().trim().withMessage("duration is required."),
    body('amount').not().isEmpty().trim().withMessage("amount is required."),
    body('type').not().isEmpty().trim().withMessage("type is required."),
]

const updateSubscriptionValidation = [
    body('subscriptionId').not().isEmpty().withMessage("subscriptionId is required."),
    body('title').optional(),
    body('description').optional(),
    body('noOfProfileImage').optional(),
    body('noOfCoverImage').optional(),
    body('noOfTourPackage').optional(),
    // body('duration').optional(),
    body('amount').optional(),
    body('type').optional(),
]

// cities
const addCityValidation = [
    body('name').not().isEmpty().trim().withMessage("name is required."),
    // body('countryCode').not().isEmpty().trim().withMessage("countryCode is required."),
    // body('stateCode').not().isEmpty().trim().withMessage("stateCode is required."),
    // body('latitude').not().isEmpty().trim().withMessage("latitude is required."),
    // body('longitude').not().isEmpty().trim().withMessage("longitude is required."),
    body('stateName').not().isEmpty().trim().withMessage("stateName is required."),
]
const updateCityValidation = [
    body('cityId').not().isEmpty().withMessage("cityId is required."),
    body('name').optional(),
    // body('countryCode').optional(),
    // body('stateCode').optional(),
    // body('latitude').optional(),
    // body('longitude').optional(),
    body('stateName').optional(),
    body("status").optional().custom((value) => {
        if (value !== undefined && value !== null && (value === 0 || value === 1)) {
            return true;
        }
        throw new Error("status must be either 0 or 1.");
    }),
]

// team members
const addTeamValidation = ["name", "position"]


// change package status
const changePackageStatusValidation = [
    body("packageId").not().isEmpty().trim().withMessage("packageId is required."),
    body("status").not().isEmpty().trim().custom((value) => {
        if (value !== undefined && value !== null && (value == 0 || value == 1)) {
            return true;
        }
        throw new Error("status must be either 0 or 1.");
    }),
];

module.exports = {
    loginValidation,
    changePasswordValidation,
    updateOptionValidation,
    changeUserStatusValidation,
    changeFeaturedStatusValidation,
    addSubscriptionValidation,
    updateSubscriptionValidation,
    addCityValidation,
    updateCityValidation,
    addTeamValidation,
    updateKeywordValidation,
    changePackageStatusValidation
}
