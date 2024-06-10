const ErrorHandler = require("../../utils/ErrorHandling");
const { response200, response400, response500 } = require("../../lib/response-messages/response");
const HttpStatus = require("../../utils/HttpStatus");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { User, Notification, Tourist, TourGuide, Feedback, UserSecurityQue, SecurityQuestion, Subscription, UserSubscriptionPlan } = require("../../models");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt")
const { forgotPasswordMail, emailVerification } = require("../../utils/emailTemplates");

const handleSignUpProcess = async (user) => {
    try {
        const { _id, role, email, username, mobileNumber, securityQuestions, mobileCountryCode } = user

        // add default notification settings
        await Notification.create({ userId: _id });

        // add role  wise data
        await (role === "tourist" ? Tourist.create({ userId: _id, mobileNumber, mobileCountryCode }) : TourGuide.create({ userId: _id, mobileNumber, mobileCountryCode }));

        // add security questions
        let userQuestions = await Promise.all(securityQuestions.map(async (val) => {
            let data = await SecurityQuestion.findById(val.questionId)
            if (data) {
                return { ...val, question: data.question, userId: _id, answer: val.answer.toLowerCase() };
            }
            return null;
        }))

        userQuestions = userQuestions.filter(question => question !== null);
        if (userQuestions.length) {
            await UserSecurityQue.insertMany(userQuestions)
        }

        // assign free subscription plan
        // if (role === "tour-guide") {
        //     const freePlan = await Subscription.find({ type: "free" })
        //     if (freePlan) {
        //         const { title, noOfProfileImage, noOfCoverImage, noOfTourPackage, duration, amount, type, description } = freePlan[0]
        //         await UserSubscriptionPlan.create({
        //             userId: _id,
        //             subscriptionId: freePlan[0]._id,
        //             title,
        //             noOfProfileImage,
        //             noOfCoverImage,
        //             noOfTourPackage,
        //             duration,
        //             amount,
        //             description,
        //             type,
        //             purchaseDate: new Date()
        //         })

        //         await User.updateOne({ _id: _id }, {
        //             $set: { subscriptionPlanId: freePlan[0]._id }
        //         })
        //     }
        // }

        // send verification mail
        const digit = "0123456789"
        let OTP = ''
        for (let i = 0; i < 4; i++) {
            OTP += digit[Math.floor(Math.random() * 10)]
        }
        const verificationCodeExpires = Date.now() + 15 * 60 * 1000;

        await User.updateOne({ _id: _id }, { $set: { verificationCode: OTP, verificationCodeExpires } })
        await emailVerification({ email, username, OTP })

    } catch (error) {
        console.log('✌️error --->', error);
        // throw new ErrorHandler("Something went wrong", HttpStatus.ERROR)
    }
}

//  sign up 
const signUp = catchAsyncError(async (req, res) => {
    let { username, email, password, role, mobileNumber, securityQuestions, mobileCountryCode } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };
    const isMatch = await User.findOne({ email, isDeleted: 0 });
    if (isMatch) throw new ErrorHandler("Email already registered. Please use another.", HttpStatus.BAD_REQUEST);

    const isTourGuideNumber = await TourGuide.findOne({ mobileNumber, isDeleted: 0 });
    const isTouristNumber = await Tourist.findOne({ mobileNumber, isDeleted: 0 });
    if (isTourGuideNumber || isTouristNumber) throw new ErrorHandler("Mobile number already registered. Please use another.", HttpStatus.BAD_REQUEST);

    password = bcrypt.hashSync(password, 10)
    const user = await User.create({ username, email, password, role: role })

    user.mobileNumber = mobileNumber
    user.mobileCountryCode = mobileCountryCode
    user.securityQuestions = securityQuestions
    await handleSignUpProcess(user)

    return response200(res, "Account activation email sent successfully.", true, { username, email })
})

//resend email verification
const resendVerifyEmailOtp = catchAsyncError(async (req, res) => {
    const { email } = req.body;
    if (!email) return response400(res, "email is required.")

    const user = await User.findOne({ email: email });
    if (!user) return response400(res, "Invalid email.")

    const digit = "0123456789"
    let OTP = ''
    for (let i = 0; i < 4; i++) {
        OTP += digit[Math.floor(Math.random() * 10)]
    }
    const verificationCodeExpires = Date.now() + 15 * 60 * 1000;
    await User.updateOne({ _id: user._id }, { $set: { verificationCode: OTP, verificationCodeExpires } })
    await emailVerification({ email, username: user.username, OTP })

    return response200(res, "Account activation email sent successfully.", true,)

});

// email verification
const verifyEmailOtp = catchAsyncError(async (req, res) => {
    const { OTP } = req.body;
    if (!OTP) return response400(res, "OTP is required.")

    const user = await User.findOne({ verificationCode: OTP, verificationCodeExpires: { $gt: new Date() } });
    if (!user) return response400(res, "OTP is invalid or expired.")

    user.verificationCode = null
    user.isVerified = 1
    await user.save()

    const token = jwt.sign({ _id: user?._id }, process.env.JWT_SEC);

    let userId = user._id;
    return response200(res, "Email verification done successfully.", true, { userId, role: user.role, token, hasSubscription: user.hasSubscription })

});

//  login
const login = catchAsyncError(async (req, res) => {
    const { email, password } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };
    const user = await User.findOne({ email, isDeleted: 0 });
    if (!user) throw new ErrorHandler("Invalid email", HttpStatus.BAD_REQUEST);

    if (user.status === 0) throw new ErrorHandler("Account is deactivated. Contact support for assistance.", HttpStatus.BAD_REQUEST);


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ErrorHandler("Invalid password", HttpStatus.BAD_REQUEST);

    const token = jwt.sign({ _id: user?._id }, process.env.JWT_SEC);

    let userId = user._id;

    // if (user.isVerified === 0) throw new ErrorHandler("Please verified your email.", HttpStatus.BAD_REQUEST);

    return response200(res, "Login successfully", true, { userId, role: user.role, token, isVerified: user.isVerified, hasSubscription: user.hasSubscription })
})

// forgot password
const forgotPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body;

    if (!email) return response400(res, "email is required.")

    const user = await User.findOne({ email });
    if (!user) return response400(res, "Email is not registered with us.")


    const digit = "0123456789"
    let OTP = ''
    for (let i = 0; i < 4; i++) {
        OTP += digit[Math.floor(Math.random() * 10)]
    }
    const resetPasswordTokenExpires = Date.now() + 15 * 60 * 1000;

    await forgotPasswordMail({ email: user.email, username: user.username, OTP });
    user.resetPasswordToken = OTP
    user.resetPasswordTokenExpires = resetPasswordTokenExpires
    await user.save()
    return response200(res, "Please check your mail for otp", true, { email })
});

// reset password
const resetPassword = catchAsyncError(async (req, res) => {
    const { password, resetPasswordToken } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    const user = await User.findOne({ resetPasswordToken: resetPasswordToken, resetPasswordTokenExpires: { $gt: new Date() } });
    if (!user) return response400(res, "OTP is invalid or expired.")

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword
    user.resetPasswordToken = ""
    await user.save()

    return response200(res, "Password Reset successfully..", true)

});

// change password
const changePassword = catchAsyncError(async (req, res) => {
    const userId = req.user
    let { currentPassword, newPassword } = req.body
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    const user = await User.findOne({ _id: userId })

    if (bcrypt.compareSync(currentPassword, user.password)) {
        newPassword = bcrypt.hashSync(newPassword, 10)
        user.password = newPassword
        await user.save()

        return response200(res, "Password change successfully.")

    } else {
        return response400(res, "Invalid current password")
    }

})

// close account
const closeAccount = catchAsyncError(async (req, res) => {
    const userId = req.user
    const { feedback } = req.body
    await User.updateOne({ _id: userId }, { $set: { status: 0, accountCloseByUser: true } })

    if (feedback) {
        await Feedback.create({ userId, feedback })
    }

    return response200(res, "Account close successfully.")
})


// get user security question list
const getUserSecurityQuestion = catchAsyncError(async (req, res) => {
    const { mobileNumber } = req.body
    if (!mobileNumber) return response400(res, "mobileNumber is required.")

    let user = await Tourist.findOne({ mobileNumber })

    if (!user) {
        user = await TourGuide.findOne({ mobileNumber })
        if (!user) return response400(res, "Oops! Mobile number not found. Please double-check and try again.")
    }

    const data = await UserSecurityQue.find({ userId: user.userId, isDeleted: 0 }).select("_id question userId")
    return response200(res, "Security question list loaded successfully", true, data)
})

// recover email by match security question
const recoverEmail = catchAsyncError(async (req, res) => {
    const { securityAnswer, userId } = req.body
    if (!securityAnswer) return response400(res, "securityAnswer is required.")

    const result = await Promise.all(securityAnswer.map(async (val) => {
        const data = await UserSecurityQue.findOne({ _id: val.questionId, userId: userId, answer: val.answer.toLowerCase() })
        return data;

    }))

    if (result.every(data => data !== null)) {
        const user = await User.findById(userId)
        return response200(res, "Registered email address", true, { email: user?.email });
    } else {
        return response400(res, "Oops! We couldn't verify your identity. Please double-check your answers and try again.");
    }

})


module.exports = {
    signUp,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    closeAccount,
    emailVerification,
    verifyEmailOtp,
    resendVerifyEmailOtp,
    getUserSecurityQuestion,
    recoverEmail
}