const { response200, response400 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { Subscription } = require("../../models");
const { default: mongoose } = require("mongoose");

// add subscription
const addSubscription = catchAsyncError(async (req, res) => {
    let { title } = req.body
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    const isMatch = await Subscription.findOne({ title, isDeleted: 0 })
    if (isMatch) return response400(res, "Subscription already exits for this title.")

    await Subscription.create(req.body)
    return response200(res, "Subscription added successfully.", true, [])

})

// update subscription
const updateSubscription = catchAsyncError(async (req, res) => {
    let { subscriptionId, title, description, noOfProfileImage, noOfCoverImage, noOfTourPackage, amount, type } = req.body
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) throw new ErrorHandler("Please enter valid subscriptionId", HttpStatus.BAD_REQUEST);

    let subscription = await Subscription.findOne({ _id: subscriptionId, isDeleted: 0 })
    if (!subscription) return response400(res, "Subscription not found.")

    const isMatch = await Subscription.findOne({ title, _id: { $ne: subscriptionId }, isDeleted: 0 })
    if (isMatch) return response400(res, "Subscription already exits for this title.")

    subscription.title = title
    subscription.description = description
    subscription.noOfProfileImage = noOfProfileImage
    subscription.noOfCoverImage = noOfCoverImage
    subscription.noOfTourPackage = noOfTourPackage
    // subscription.duration = duration
    subscription.amount = amount
    subscription.type = type
    await subscription.save()

    return response200(res, "Subscription updated successfully.", true, [])
})

// get all subscription
const getAllSubscription = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0 };

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    const findQuery = Subscription.find(query).sort({ createdAt: 1 }).select('_id title description noOfProfileImage noOfCoverImage noOfTourPackage amount type createdAt status')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "Subscription list loaded successfully", true, data);

});

// delete subscription
const deleteSubscription = catchAsyncError(async (req, res) => {
    const { subscriptionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) throw new ErrorHandler("Please enter valid subscriptionId", HttpStatus.BAD_REQUEST);

    const subscription = await Subscription.findByIdAndUpdate({ _id: subscriptionId }, { $set: { isDeleted: 1 } })
    if (!subscription) return response400(res, "Subscription not found.");
    return response200(res, "Subscription deleted successfully", true, []);
});

module.exports = {
    addSubscription,
    updateSubscription,
    getAllSubscription,
    deleteSubscription
}
