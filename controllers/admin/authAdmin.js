const ErrorHandler = require("../../utils/ErrorHandling");
const { response200 } = require("../../lib/response-messages/response");
const HttpStatus = require("../../utils/HttpStatus");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { Admin, User, TourPackage, TouristBooking } = require("../../models");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt")
const moment = require("moment")

// admin login
const adminLogin = catchAsyncError(async (req, res) => {
    const { email, password } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };
    const adminData = await Admin.findOne({ email });
    if (!adminData) throw new ErrorHandler("Invalid email", HttpStatus.BAD_REQUEST);

    const isMatch = await bcrypt.compare(password, adminData.password);
    if (!isMatch) throw new ErrorHandler("Invalid password", HttpStatus.BAD_REQUEST);

    const token = await jwt.sign({ _id: adminData?._id }, process.env.JWT_SEC);

    let userId = adminData._id;
    return response200(res, "Login successfully", true, { userId, token })
})

// change password
const changePassword = catchAsyncError(async (req, res) => {
    let user = req.user
    const { currentPassword, newPassword } = req.body;
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    const admin = await Admin.findById(user)
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) throw new ErrorHandler("The current password does not match.", HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    admin.password = hashedPassword
    await admin.save()
    return response200(res, "Password changed successfully", true)
})

const dashboard = catchAsyncError(async (req, res) => {
    // get counts
    const totalTourGuide = await User.countDocuments({ role: "tour-guide", isDeleted: 0 })
    const totalTourist = await User.countDocuments({ role: "tourist", isDeleted: 0 })
    const totalTourPackage = await TourPackage.countDocuments({ isDeleted: 0 })
    const totalBooking = await TouristBooking.countDocuments({ isDeleted: 0 })

    // yearly counts
    let bookingCount = [],
        tourGuideCount = [],
        touristCount = [],
        monthCounts = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];

    // for booking list
    const bookingList = await TouristBooking.find({ isDeleted: 0 })
    // for tourist list
    const touristList = await User.find({ role: "tourist", isDeleted: 0 })
    // for tour guide list
    const tourGuideList = await User.find({ role: "tour-guide", isDeleted: 0 })

    const currentYear = moment().year();
    for (let month = 0; month < 12; month++) {
        const startDate = moment().year(currentYear).month(month).startOf('month').format('YYYY-MM-DD')
        const endDate = moment().year(currentYear).month(month).endOf('month').format('YYYY-MM-DD')

        if (bookingList.length) {
            const bookingData = bookingList.filter((val) => {
                const formattedDate = moment(val.createdAt).format('YYYY-MM-DD')
                return formattedDate >= startDate && formattedDate <= endDate
            })
            bookingCount.push(bookingData.length)
        }
        if (tourGuideList.length) {
            const touristData = tourGuideList.filter((val) => {
                const formattedDate = moment(val.createdAt).format('YYYY-MM-DD')
                return formattedDate >= startDate && formattedDate <= endDate
            })
            tourGuideCount.push(touristData.length)
        }
        if (touristList.length) {
            const touristData = touristList.filter((val) => {
                const formattedDate = moment(val.createdAt).format('YYYY-MM-DD')
                return formattedDate >= startDate && formattedDate <= endDate
            })
            touristCount.push(touristData.length)
        }
    }

    const yearlyData = monthCounts.map((ele, i) => {
        return {
            month: ele,
            booking: bookingCount[i] || 0,
            tourist: touristCount[i] || 0,
            tourGuide: tourGuideCount[i] || 0,
        };
    });

    // get 10 trips which  start from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = 10
    const latestTrips = await TouristBooking.aggregate([
        { $match: { startDate: { $gte: today } } },
        {
            $lookup: {
                from: "tourpackages",
                localField: "packageId",
                foreignField: "_id",
                as: "packageImages",
                pipeline: [
                    { $project: { _id: 0, galleryImages: 1 } }
                ]
            }
        },
        {
            $unwind: {
                path: "$packageImages",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "touristId",
                foreignField: "_id",
                as: "tourist",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "details",
                            pipeline: [
                                {
                                    $project:
                                    {
                                        _id: 1,
                                        images: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$details"
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            email: 1,
                            role: 1,
                            details: 1
                        }
                    }
                ]
            }

        },
        {
            $unwind: {
                path: "$tourist",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "tourGuideId",
                foreignField: "_id",
                as: "tourGuide",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourguides",
                            localField: "_id",
                            foreignField: "userId",
                            as: "details",
                            pipeline: [
                                {
                                    $project:
                                    {
                                        _id: 1,
                                        images: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$details"
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            email: 1,
                            role: 1,
                            details: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$tourGuide",
                preserveNullAndEmptyArrays: true
            }
        },
        { $limit: limit },
        { $sort: { startDate: 1 } },
        {
            $project: {
                _id: 1,
                packageId: 1,
                title: 1,
                description: 1,
                duration: 1,
                price: 1,
                startDate: 1,
                bookedDate: 1,
                confirmedDate: 1,
                cancelledDate: 1,
                status: 1,
                tourist: 1,
                tourGuide: 1,
                packageImages: "$packageImages.galleryImages"
            }
        }
    ])

    return response200(res, "Data fetch successfully.", true, { totalTourGuide, totalTourist, totalTourPackage, totalBooking, yearlyData, latestTrips })
})


module.exports = {
    adminLogin,
    changePassword,
    dashboard
}