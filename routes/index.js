const express = require("express");
const router = express.Router();

const userRoute = require("./userRoutes");
const adminRoutes = require("./adminRoutes");
const optionRoutes = require("./optionsRoutes");
const tourGuideRoutes = require("./tourGuideRoutes");
const touristRoutes = require("./touristRoutes");

router.use("/admin", adminRoutes);
router.use("/options", optionRoutes);
router.use("/users", userRoute);
router.use("/guides", tourGuideRoutes);
router.use("/tourist", touristRoutes);

module.exports = router