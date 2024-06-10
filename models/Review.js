const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
    bookingId: {
        type: mongoose.Types.ObjectId,
        ref: "bookTourPackage",
        required: true
    },
    packageId: {
        type: mongoose.Types.ObjectId,
        ref: "TourPackage",
    },
    reviewerId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    review: {
        type: String,
        require: true
    },
    rating: {
        type: Number,
        require: true
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

reviewSchema.post('save', async function (doc) {
    const User = mongoose.model('User');

    const ratings = await this.model('Review').find({
        receiverId: doc.receiverId
    });
    const filteredReviews = ratings.filter(rating => rating.review !== undefined);
    const averageRating = ratings.reduce((total, rating) => total + rating.rating, 0) / ratings.length;
    const user = await User.findById(doc.receiverId);
    user.rating = averageRating.toFixed(2);
    user.noOfReviews = filteredReviews.length;
    await user.save();
});

module.exports = mongoose.model("Review", reviewSchema)