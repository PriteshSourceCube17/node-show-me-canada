const router = require("express").Router();
const { userAuthController, userReviewController, touristProfileController, tourGuideProfileController, userChatController } = require("../controllers");
const { userValidation } = require("../utils/validations")
const { isAuthenticated } = require("../middleware/authenticate")

router
    // auth
    .post("/sign-up", userValidation.signUpValidation, userAuthController.signUp)
    .post("/email-verification", userAuthController.verifyEmailOtp)
    .post("/resend-email-verification", userAuthController.resendVerifyEmailOtp)
    .post("/sign-in", userValidation.loginValidation, userAuthController.login)
    .post("/forgot-password", userAuthController.forgotPassword)
    .post("/reset-password", userValidation.resetPassword, userAuthController.resetPassword)
    .post("/change-password", isAuthenticated, userValidation.changePassword, userAuthController.changePassword)
    .post("/close-account", isAuthenticated, userValidation.changePassword, userAuthController.closeAccount)
    .post("/security-question", userAuthController.getUserSecurityQuestion)
    .post("/recover-email", userAuthController.recoverEmail)

    // tour guide
    .get("/tour-guide/:userId", tourGuideProfileController.getDetails)
    .post("/tour-guides", isAuthenticated, tourGuideProfileController.getAllTourGuide)

    // tourist
    .get("/tourist/:userId", isAuthenticated, touristProfileController.getDetails)

    // review
    .post("/add-review", isAuthenticated, userValidation.addReview, userReviewController.addReview)

    // chat module
    .post("/detect-message", isAuthenticated, userChatController.detectKeyword)
    .post("/check-group", isAuthenticated, userChatController.checkGroup)
    .post("/create-chat-room", isAuthenticated, userChatController.createChatRoom)
    .post("/get-all-rooms", isAuthenticated, userChatController.fetchRoom)
    .post("/badge-reset", isAuthenticated, userChatController.resetBadge)
    .post("/send-message", isAuthenticated, userChatController.sendMessages)
    .get("/get-messages/:groupId", isAuthenticated, userChatController.fetchMessages)
    .post("/update-socket", isAuthenticated, userChatController.updateSocket)
// request
// .post("/get-requests", isAuthenticated, touristTripController.getRequests)
module.exports = router