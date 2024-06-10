const router = require("express").Router();
const { tourGuideProfileController, tourGuideTourPackageController, tourGuideSubscriptionController } = require("../controllers");
const { tourGuideValidation } = require("../utils/validations")
const { isAuthenticated, isAuthenticatedUser } = require("../middleware/authenticate")

router
    // profile
    .put("/general-info", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.updateGeneralInfo)
    .put("/other-info", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.updateOtherInfo)
    .post("/primary-image", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideValidation.primaryImage, tourGuideProfileController.primaryImage)
    .post("/mobile-verify-code", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.sendMobileVerification)
    .post("/mobile-verification", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.verifyOTP)
    .get("/profile", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.getProfile)
    .delete("/remove-single-image", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.deleteSingleImage)
    .delete("/remove-banner-image", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.deleteBannerImage)
    .delete("/remove-gallery-image", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.deleteGalleryImage)
    .delete("/remove-gallery-video", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.deleteGalleryVideo)
    .put("/notification-info", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideValidation.notificationInfo, tourGuideProfileController.updateNotificationInfo)
    .get("/notification-info", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.notificationInfo)
    .post("/upload-gallery-image", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.uploadGalleryImage)
    .post("/upload-gallery-video", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideProfileController.uploadGalleryVideo)


    // tour package
    .post("/tour-package", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideTourPackageController.addTourPackage)
    .put("/update-tour-package", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideTourPackageController.updateTourPackage)
    .delete("/tour-package/:packageId", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideTourPackageController.deletePackage)
    .get("/tour-packages", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideTourPackageController.getMyTourPackages)
    .delete("/gallery-image", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideValidation.deleteSingleImageValidation, tourGuideTourPackageController.deleteGalleryImage)
    .get("/tour-package/:packageId", tourGuideTourPackageController.getTourPackageDetails)

    // booking
    .post("/bookings", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideTourPackageController.getBookingRequest)
    .post("/change-booking-status", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideValidation.changeBookingStatusValidation, tourGuideTourPackageController.changeBookingStatus)


    // subscription plan
    .post("/purchase-subscription", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideSubscriptionController.purchaseSubscription)
    .get("/invoice-details/:planId", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideSubscriptionController.planDataForInvoice)
    .get("/subscription-transaction", isAuthenticated, isAuthenticatedUser("tour-guide"), tourGuideSubscriptionController.getTransactionHistory)
module.exports = router