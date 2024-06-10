const router = require("express").Router();
const { optionsController } = require("../controllers");
const { isAuthenticated } = require("../middleware/authenticate")

router
    .post("/get-all-activity", optionsController.getAllActivity)
    .post("/get-all-hours", optionsController.getAllHour)
    .post("/get-all-languages", optionsController.getAllLanguage)
    .post("/get-all-cities", optionsController.getAllCity)
    .post("/get-all-tour-guides", optionsController.getAllTourGuide)
    .post("/get-featured-tour-guides", optionsController.getFeaturedTourGuide)
    .get("/about-us", optionsController.getAboutUs)
    .get("/security-question", optionsController.getAllSecurityQuestion)
    .get("/get-register-city", optionsController.registerUserCity)
    .get("/get-team-member", isAuthenticated, optionsController.getAllTeamMembers)
    .get("/get-height-price", optionsController.highestRate)
    .get("/get-recent-booking", optionsController.getRecentBooking)
    .post("/get-all-subscription", optionsController.getAllSubscription)
    .post("/get-tour-package", optionsController.getAllTourPackage)

module.exports = router