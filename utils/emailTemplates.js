const path = require("path");
const ejs = require("ejs");
const sendEmail = require("./EmailSender");
const { image_url, front_url } = require("./constants")

const emailVerification = async (options) => {
    const { email, username, OTP } = options
    const url = `${process.env.FRONT_URL}signup-verification`
    const logo = image_url.LOGO
    const verifyOtp = image_url.VERIFY_OTP
    const front = front_url.live_url

    const templatePath = path.join(__dirname, "../public/emailTemplates/emailVerification.ejs")
    const data = await ejs.renderFile(templatePath, { username, email, OTP, url, logo, verifyOtp, front });

    await sendEmail({
        email,
        subject: 'Email verification',
        message: data
    })
}
const forgotPasswordMail = async (options) => {
    const { email, username, OTP } = options
    const url = `${process.env.FRONT_URL}reset-password`
    const logo = image_url.LOGO
    const resetPass = image_url.RESET_PASS
    const front = front_url.live_url

    const templatePath = path.join(__dirname, "../public/emailTemplates/forgotPassword.ejs")
    const data = await ejs.renderFile(templatePath, { username, email, OTP, url, logo, resetPass, front });

    await sendEmail({
        email,
        subject: 'Reset Password Token',
        message: data
    })
}

module.exports = {
    emailVerification,
    forgotPasswordMail
}