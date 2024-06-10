const { response200, response400, response500 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { Team } = require("../../models");
const { default: mongoose } = require("mongoose");
const multer = require("multer");
const storage = multer.memoryStorage()
const upload = multer({ storage })
const { uploadFile, deleteImage } = require("../../lib/uploader/upload");
const { addTeamValidation } = require("../../utils/validations/adminValidate")

// add team
const addTeam = catchAsyncError(async (req, res) => {
    upload.fields([
        { name: "name", maxCount: 1 },
        { name: "position", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ])(req, res, async (err) => {
        try {

            if (err) return response400(res, "Something went wrong")

            const { name } = req.body
            const isValidated = addTeamValidation.filter((field) => !req.body[field])
            if (isValidated.length > 0) return response400(res, `${isValidated.join(", ")} is required.`)

            const isMatch = await Team.findOne({ isDeleted: 0, name })
            if (isMatch) return response400(res, "Team member name is already exits")

            if (req?.files?.image) {
                const file = req?.files?.image[0]
                req.body.image = await uploadFile(file)
            } else {
                return response400(res, "image is required")
            }
            await Team.create(req.body)
            return response200(res, "Team member added successfully.")
        } catch (error) {
            response500(res, "Something went wrong")
        }
    })
})

// update team
const updateTeam = catchAsyncError(async (req, res) => {
    upload.fields([
        { name: "memberId", maxCount: 1 },
        { name: "name", maxCount: 1 },
        { name: "position", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ])(req, res, async (err) => {
        try {
            if (err) return response400(res, "Something went wrong")


            const { name, memberId, position } = req.body
            if (!memberId) return response400(res, "memberId is required.")
            if (!mongoose.Types.ObjectId.isValid(memberId)) return response400(res, "Please enter valid memberId")

            let member = await Team.findOne({ isDeleted: 0, _id: memberId })
            if (!member) return response400(res, "Member details not found.")

            if (name) {
                const isMatch = await Team.findOne({ isDeleted: 0, name, _id: { $ne: memberId } })
                if (isMatch) return response400(res, "Team member name is already exits")
                member.name = name

            }

            const imagePath = member?.image
            if (req?.files?.image) {
                const file = req?.files?.image[0]
                member.image = await uploadFile(file)
                if (imagePath !== undefined) await deleteImage(imagePath)
            }
            member.position = position
            await member.save()
            return response200(res, "Member details update successfully.")
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    })
})

// get all team member
const getAllTeamMembers = catchAsyncError(async (req, res) => {
    const data = await Team.find({ isDeleted: 0 }).select("_id  name position image status createdAt")
    return response200(res, "Member list loaded successfully.", true, data)
})

// delete team member
const deleteMember = catchAsyncError(async (req, res) => {
    const { memberId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(memberId)) return response400(res, "Please enter valid memberId")

    const member = await Team.findByIdAndUpdate({ _id: memberId }, { $set: { isDeleted: 1 } })
    if (!member) return response400(res, "Member details not found.");

    return response200(res, "Member deleted successfully", true, []);
});

module.exports = {
    addTeam,
    updateTeam,
    getAllTeamMembers,
    deleteMember
}
