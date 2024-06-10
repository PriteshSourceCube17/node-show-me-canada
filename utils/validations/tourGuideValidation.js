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

// tour package
const deleteSingleImageValidation = [
    body("packageId").not().isEmpty().trim().withMessage("packageId is required."),
    body("galleryImageId").not().isEmpty().trim().withMessage("galleryImageId is required."),
]

const addPackageValidation = ["title", "description", "locationId", "price", "duration"]

const changeBookingStatusValidation = [
    body("bookingId").not().isEmpty().trim().withMessage("bookingId is required."),
    body("status").not().isEmpty().trim().custom((value) => {
        if (value !== undefined && value !== null && (value == "confirmed" || value == "cancelled" || value == "ongoing" || value == "completed")) {
            return true;
        }
        throw new Error("status must be valid");
    })
];

module.exports = {
    primaryImage,
    notificationInfo,
    deleteSingleImageValidation,
    addPackageValidation,
    changeBookingStatusValidation
}
