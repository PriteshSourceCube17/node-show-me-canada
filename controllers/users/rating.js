const { default: mongoose } = require("mongoose");
const { response200, response400, response500 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { User, TourPackage, City, TouristBooking, Review } = require("../../models");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");

const addReview = catchAsyncError(async (req, res) => {
    const userId = req.user
    const { bookingId } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (!mongoose.Types.ObjectId.isValid(bookingId)) throw new BadRequestException("Please enter valid bookingId.")
    const bookingDetails = await TouristBooking.findOne({ _id: bookingId, isDeleted: 0 })
    if (!bookingDetails) return response400(res, "Booking details not found.")

    const user = await User.findById(userId)

    if (user.role === "tourist") {
        req.body.receiverId = bookingDetails.tourGuideId
    } else {
        req.body.receiverId = bookingDetails.touristId
    }
    await Review.create({ ...req.body, reviewerId: userId, packageId: bookingDetails.packageId })

    return response200(res, "Review added successfully.")
})

module.exports = {
    addReview
}