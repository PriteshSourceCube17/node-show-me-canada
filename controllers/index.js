// admin
module.exports.adminAuthController = require("./admin/authAdmin");
module.exports.adminActivityController = require("./admin/activityAdmin");
module.exports.adminHourController = require("./admin/hoursAdmin");
module.exports.adminLanguageController = require("./admin/languageAdmin");
module.exports.adminUserController = require("./admin/userAdmin");
module.exports.adminSubscriptionController = require("./admin/subscriptionAdmin");
module.exports.adminTripController = require("./admin/tripAdmin");
module.exports.adminCityController = require("./admin/cityAdmin");
module.exports.adminTeamController = require("./admin/teamAdmin");
module.exports.adminAboutUsController = require("./admin/aboutUs");
module.exports.adminDetectedKeywordController = require("./admin/chatKeyWords");

// options
module.exports.optionsController = require("./options/options");

// users
module.exports.userAuthController = require("./users/authUser");
module.exports.userReviewController = require("./users/rating");
module.exports.userChatController = require("./chat/chat");

// tour guide
module.exports.tourGuideProfileController = require("./tourGuide/tourGuideProfile");
module.exports.tourGuideTourPackageController = require("./tourGuide/tourPackage");
module.exports.tourGuideSubscriptionController = require("./tourGuide/subscription");


// tourist
module.exports.touristProfileController = require("./tourist/touristProfile");
module.exports.touristTourPackageController = require("./tourist/tourPackages");
module.exports.touristTripController = require("./tourist/touristTrip");
