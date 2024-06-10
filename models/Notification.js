const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    email: {
        newBookingAndMessage: {
            type: Boolean,
            default: false
        },
        touristVisitMyCity: {
            type: Boolean,
            default: false
        },
        offerReceiveFromLocal: {
            type: Boolean,
            default: false
        },
        generalInfo: {
            type: Boolean,
            default: false
        }
    },
    mobile: {
        newBookingAndMessage: {
            type: Boolean,
            default: false
        },
        touristVisitMyCity: {
            type: Boolean,
            default: false
        },
        offerReceiveFromLocal: {
            type: Boolean,
            default: false
        },
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("notification", notificationSchema)