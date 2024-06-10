const router = require("express").Router();
const { adminAuthController, adminActivityController, adminHourController, adminLanguageController, adminUserController, adminTeamController, adminSubscriptionController, adminTripController, adminCityController, adminAboutUsController, adminDetectedKeywordController } = require("../controllers");
const { adminValidation } = require("../utils/validations")
const { isAuthenticatedAdmin } = require("../middleware/authenticate")

router
    // Profile
    .post("/sign-in", adminValidation.loginValidation, adminAuthController.adminLogin)
    .post("/change-password", isAuthenticatedAdmin, adminValidation.changePasswordValidation, adminAuthController.changePassword)

    // dashboard
    .get("/dashboard", isAuthenticatedAdmin, adminAuthController.dashboard)

    // activity
    .post("/activity", isAuthenticatedAdmin, adminActivityController.addActivity)
    .put("/activity", isAuthenticatedAdmin, adminValidation.updateOptionValidation, adminActivityController.updateActivity)
    .delete("/activity/:activityId", isAuthenticatedAdmin, adminActivityController.deleteActivity)
    .post("/get-all-activity", isAuthenticatedAdmin, adminActivityController.getAllActivity)

    // hour
    .post("/hour", isAuthenticatedAdmin, adminHourController.addHour)
    .put("/hour", isAuthenticatedAdmin, adminValidation.updateOptionValidation, adminHourController.updateHour)
    .delete("/hour/:hourId", isAuthenticatedAdmin, adminHourController.deleteHour)
    .post("/get-all-hours", isAuthenticatedAdmin, adminHourController.getAllHour)

    // language
    .post("/language", isAuthenticatedAdmin, adminLanguageController.addLanguage)
    .put("/language", isAuthenticatedAdmin, adminValidation.updateOptionValidation, adminLanguageController.updateLanguage)
    .delete("/language/:languageId", isAuthenticatedAdmin, adminLanguageController.deleteLanguage)
    .post("/get-all-languages", isAuthenticatedAdmin, adminLanguageController.getAllLanguage)

    // user
    .post("/all-users", isAuthenticatedAdmin, adminUserController.getAllUsers)
    .get("/user/:userId", isAuthenticatedAdmin, adminUserController.getUserDetails)
    .post("/change-status", isAuthenticatedAdmin, adminValidation.changeUserStatusValidation, adminUserController.changeUserStatus)
    .post("/change-featured-status", isAuthenticatedAdmin, adminValidation.changeFeaturedStatusValidation, adminUserController.changeFeaturedStatus)
    .delete("/delete-user/:userId", isAuthenticatedAdmin, adminValidation.changeFeaturedStatusValidation, adminUserController.deleteUser)

    // subscription
    .post("/subscription", isAuthenticatedAdmin, adminValidation.addSubscriptionValidation, adminSubscriptionController.addSubscription)
    .put("/subscription", isAuthenticatedAdmin, adminValidation.updateSubscriptionValidation, adminSubscriptionController.updateSubscription)
    .post("/get-all-subscription", isAuthenticatedAdmin, adminSubscriptionController.getAllSubscription)
    .delete("/subscription/:subscriptionId", isAuthenticatedAdmin, adminSubscriptionController.deleteSubscription)

    // trip
    .post("/get-all-trips", isAuthenticatedAdmin, adminTripController.getAllTrip)

    // city
    .post("/city", isAuthenticatedAdmin, adminValidation.addCityValidation, adminCityController.addCity)
    .put("/city", isAuthenticatedAdmin, adminValidation.updateCityValidation, adminCityController.updateCity)
    .delete("/city/:cityId", isAuthenticatedAdmin, adminCityController.deleteCity)
    .post("/get-all-cities", isAuthenticatedAdmin, adminCityController.getAllCity)

    // team member
    .post("/member", isAuthenticatedAdmin, adminTeamController.addTeam)
    .put("/member", isAuthenticatedAdmin, adminTeamController.updateTeam)
    .delete("/member/:memberId", isAuthenticatedAdmin, adminTeamController.deleteMember)
    .post("/get-all-member", isAuthenticatedAdmin, adminTeamController.getAllTeamMembers)

    // about us story
    .post("/add-story", isAuthenticatedAdmin, adminAboutUsController.addStory)
    .put("/update-story", isAuthenticatedAdmin, adminAboutUsController.updateStory)
    .get("/get-story", isAuthenticatedAdmin, adminAboutUsController.getStory)


    // detected keyword in chat message
    .post("/keyword", isAuthenticatedAdmin, adminDetectedKeywordController.addKeyWord)
    .put("/keyword", isAuthenticatedAdmin, adminValidation.updateKeywordValidation, adminDetectedKeywordController.updateKeyWord)
    .delete("/keyword/:keywordId", isAuthenticatedAdmin, adminDetectedKeywordController.deleteKeyWord)
    .post("/get-all-keyword", isAuthenticatedAdmin, adminDetectedKeywordController.getAllKeyWord)

    // tour package
    .post("/change-package-status", isAuthenticatedAdmin, adminValidation.changePackageStatusValidation, adminUserController.changePackageStatus)
    .post("/get-requests", isAuthenticatedAdmin, adminUserController.getPackageBookingRequest)
    .post("/get-all-requests", isAuthenticatedAdmin, adminUserController.getAllBookingRequest)

module.exports = router