const { response200, response400 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { Subscription, UserSubscriptionPlan, User, SubscriptionPayment } = require("../../models");
const { default: mongoose } = require("mongoose");
const moment = require("moment");

// add subscription
const purchaseSubscription = catchAsyncError(async (req, res) => {
    const id = req.user
    let { subscriptionId, success, message } = req.body
    // validation
    if (!subscriptionId) return response400(res, "subscriptionId is required.")
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) return response400(res, "Please enter valid subscriptionId.")

    // find plan
    const plan = await Subscription.findOne({ _id: subscriptionId, isDeleted: 0, status: 1 })
    if (!plan) return response400(res, "Subscription plan details not found.")

    const { _id, title, noOfProfileImage, amount, description, noOfCoverImage, noOfTourPackage, type } = plan
    // count end date of plan
    // const date = moment().add(duration, 'days').endOf('day').utcOffset(0);
    // date.set({ hour: 23, minute: 59, second: 59, millisecond: 999 })

    let previousSubscription
    let payment


    if (type === "paid") {
        // previous subscription plan details
        previousSubscription = await UserSubscriptionPlan.findOne({ userId: id, status: 1 })

        // stored payment 
        let status = success ? 1 : 2
        payment = await SubscriptionPayment.create({
            userId: id,
            subscriptionPlanId: subscriptionId,
            status: status,
            purchaseDate: new Date(),
            // expiredDate: date.toDate(),
            title,
            description,
            // duration,
            amount,
            type,
            message,
            noOfProfileImage: noOfProfileImage + previousSubscription?.noOfProfileImage || noOfProfileImage,
            noOfCoverImage: noOfCoverImage + previousSubscription?.noOfCoverImage || noOfCoverImage,
            noOfTourPackage: noOfTourPackage + previousSubscription?.noOfTourPackage || noOfTourPackage,
        })
        if (!success) return response400(res, "Payment failed. Please try again or contact support.")

    }


    // stored new plan
    await UserSubscriptionPlan.create({
        userId: id,
        subscriptionId: _id,
        purchaseDate: new Date(),
        // expiredDate: date.toDate(),
        title,
        // duration,
        amount,
        type,
        description,
        noOfProfileImage: noOfProfileImage + previousSubscription?.noOfProfileImage || noOfProfileImage,
        noOfCoverImage: noOfCoverImage + previousSubscription?.noOfCoverImage || noOfCoverImage,
        noOfTourPackage: noOfTourPackage + previousSubscription?.noOfTourPackage || noOfTourPackage,
        paymentId: payment?._id
    })

    // de active previous plan
    if (previousSubscription) {
        previousSubscription.status = 0
        await previousSubscription.save()
    }

    await User.updateOne({ _id: id }, {
        $set: { subscriptionPlanId: subscriptionId, hasSubscription: true }
    })
    return response200(res, "Congratulations! Your subscription plan has been updated successfully.")
})

const planDataForInvoice = catchAsyncError(async (req, res) => {
    let { planId } = req.params
    if (!planId) return response400(res, "planId is required.")

    const data = await UserSubscriptionPlan.findOne({ _id: planId }).select('_id  subscriptionId title noOfProfileImage noOfCoverImage noOfTourPackage duration amount type purchaseDate expiredDate status paymentId isExpired createdAt description')

    return response200(res, "Record fetch successfully.", true, data)
})

const getTransactionHistory = catchAsyncError(async (req, res) => {
    const id = req.user
    const data = await SubscriptionPayment.find({ userId: id }).select("_id subscriptionPlanId title noOfProfileImage noOfCoverImage noOfTourPackage amount type purchaseDate status message createdAt").sort({ createdAt: -1 })
    return response200(res, "Record fetch successfully.", true, data);
})

module.exports = {
    purchaseSubscription,
    planDataForInvoice,
    getTransactionHistory
}
