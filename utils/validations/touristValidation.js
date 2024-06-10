const { body } = require("express-validator");

// auth
const primaryImage = [
    body("imageId").not().isEmpty().trim().withMessage("imageId is required."),
    body("isPrimary").not().isEmpty().trim().withMessage("isPrimary is required."),
]

const notificationInfo = [
    body("email.newBookingAndMessage").not().isEmpty().trim().withMessage("newBookingAndMessage is required."),
    body("email.touristVisitMyCity").not().isEmpty().trim().withMessage("touristVisitMyCity is required."),
    body("email.offerReceiveFromLocal").not().isEmpty().trim().withMessage("offerReceiveFromLocal is required."),
    body("email.generalInfo").not().isEmpty().trim().withMessage("generalInfo is required."),
    body("mobile.newBookingAndMessage").not().isEmpty().trim().withMessage("newBookingAndMessage is required."),
    body("mobile.touristVisitMyCity").not().isEmpty().trim().withMessage("touristVisitMyCity is required."),
    body("mobile.offerReceiveFromLocal").not().isEmpty().trim().withMessage("offerReceiveFromLocal is required."),
];

// trips
const createTrip = [
    body("location").not().isEmpty().trim().withMessage("location is required."),
    body("startDate").not().isEmpty().trim().withMessage("startDate is required."),
    body("endDate").not().isEmpty().trim().withMessage("endDate is required."),
    body("numberOfPeople").not().isEmpty().trim().withMessage("numberOfPeople is required."),
    body("preferredGender").optional(),
]

const changeTripStatusValidation = [
    body("tripId").not().isEmpty().trim().withMessage("tripId is required."),
    body("status").not().isEmpty().withMessage("status is required.").custom((value) => {
        if (value !== undefined && value !== null && (value === 0 || value === 1)) {
            return true;
        }
        throw new Error("status must be either 0 or 1.");
    }),
];


// booking validation
const bookingValidation = [
    body("packageId").not().isEmpty().trim().withMessage("packageId is required."),
    body("startDate").not().isEmpty().trim().withMessage("startDate is required."),
    body("success").not().isEmpty().trim().withMessage("success is required."),
    body("message").optional(),
    // body("endDate").not().isEmpty().trim().withMessage("endDate is required."),
    body("tripId").optional(),
]

module.exports = {
    primaryImage,
    notificationInfo,
    createTrip,
    changeTripStatusValidation,
    bookingValidation
}
