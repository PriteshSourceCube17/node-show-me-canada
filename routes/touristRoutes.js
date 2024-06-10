const router = require("express").Router();
const { touristProfileController, touristTripController, touristController, touristTourPackageController } = require("../controllers");
const { touristValidation } = require("../utils/validations")
const { isAuthenticated, isAuthenticatedUser } = require("../middleware/authenticate")

router
    // profile
    .put("/general-info", isAuthenticated, isAuthenticatedUser("tourist"), touristProfileController.updateGeneralInfo)
    .put("/notification-info", isAuthenticated, isAuthenticatedUser("tourist"), touristValidation.notificationInfo, touristProfileController.updateNotificationInfo)
    .get("/notification-info", isAuthenticated, isAuthenticatedUser("tourist"), touristProfileController.notificationInfo)
    .post("/mobile-verify-code", isAuthenticated, isAuthenticatedUser("tourist"), touristProfileController.sendMobileVerification)
    .post("/mobile-verification", isAuthenticated, isAuthenticatedUser("tourist"), touristProfileController.verifyOTP)
    .post("/primary-image", isAuthenticated, isAuthenticatedUser("tourist"), touristValidation.primaryImage, touristProfileController.primaryImage)
    .delete("/remove-single-image", isAuthenticated, isAuthenticatedUser("tourist"), touristProfileController.deleteSingleImage)
    .get("/profile", isAuthenticated, isAuthenticatedUser("tourist"), touristProfileController.getProfile)


    // trips
    .post("/trip", isAuthenticated, isAuthenticatedUser("tourist"), touristValidation.createTrip, touristTripController.createTrip)
    .post("/change-trip-status", isAuthenticated, isAuthenticatedUser("tourist"), touristValidation.changeTripStatusValidation, touristTripController.changeTripStatus)
    .delete("/trip/:tripId", isAuthenticated, isAuthenticatedUser("tourist"), touristTripController.deleteTrip)
    .get("/get-my-trips", isAuthenticated, isAuthenticatedUser("tourist"), touristTripController.getMyTrips)


    // tour packages
    .get("/tour-packages", isAuthenticated, isAuthenticatedUser("tourist"), touristTourPackageController.getLatestTourPackage)


    // booking
    .post("/book-package", isAuthenticated, isAuthenticatedUser("tourist"), touristValidation.bookingValidation, touristTourPackageController.bookedPackage)
    .post("/get-booking-request", isAuthenticated, isAuthenticatedUser("tourist"), touristTourPackageController.getMyBookingReq)
    .post("/cancel-booking-request", isAuthenticated, isAuthenticatedUser("tourist"), touristTourPackageController.cancelBookingRequest)
    .get("/transactions", isAuthenticated, isAuthenticatedUser("tourist"), touristTourPackageController.getMyTransactionHistory)

module.exports = router