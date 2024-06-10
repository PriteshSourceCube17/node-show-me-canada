const { UserSubscriptionPlan } = require("../models")


module.exports = async () => {
    const currentTimestamp = new Date();

    const userSubscriptionPlans = await UserSubscriptionPlan.find({ type: "paid", isExpired: 0, expiredDate: { $lte: currentTimestamp } });
    if (userSubscriptionPlans.length) {
        userSubscriptionPlans.forEach(async (plan) => {
            console.log('Expired plan:', plan);
            await UserSubscriptionPlan.updateOne({ _id: plan._id }, { $set: { isExpired: 1, status: 0 } })
        });
    }
};