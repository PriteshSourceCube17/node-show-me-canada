const { response200, response400, response500 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { AboutUs } = require("../../models");
const { default: mongoose } = require("mongoose");
const multer = require("multer");
const storage = multer.memoryStorage()
const upload = multer({ storage })
const { uploadFile, deleteImage } = require("../../lib/uploader/upload");
const { addTeamValidation } = require("../../utils/validations/adminValidate")

// add story
const addStory = catchAsyncError(async (req, res) => {
    upload.fields([
        { name: "content", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ])(req, res, async (err) => {
        try {

            if (err) return response400(res, "Something went wrong")

            const { content } = req.body
            if (!content) return response400(res, "Content is required.")

            if (req?.files?.image) {
                const file = req?.files?.image[0]
                req.body.image = await uploadFile(file)
            } else {
                return response400(res, "image is required")
            }

            await AboutUs.create(req.body)
            return response200(res, "Story added successfully.")
        } catch (error) {
            response500(res, "Something went wrong")
        }
    })
})

// update story
const updateStory = catchAsyncError(async (req, res) => {
    upload.fields([
        { name: "storyId", maxCount: 1 },
        { name: "content", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ])(req, res, async (err) => {
        try {
            if (err) return response400(res, "Something went wrong")


            const { storyId, content } = req.body
            if (!storyId) return response400(res, "storyId is required.")
            if (!mongoose.Types.ObjectId.isValid(storyId)) return response400(res, "Please enter valid storyId")

            let story = await AboutUs.findOne({ isDeleted: 0, _id: storyId })
            if (!story) return response400(res, "Story details not found.")


            const imagePath = story?.image
            if (req?.files?.image) {
                const file = req?.files?.image[0]
                story.image = await uploadFile(file)
                if (imagePath !== undefined) await deleteImage(imagePath)
            }

            story.content = content
            await story.save()
            return response200(res, "Story details update successfully.")
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    })
})

// get all story member
const getStory = catchAsyncError(async (req, res) => {
    const data = await AboutUs.find({ isDeleted: 0 }).select("_id  content  image ")
    return response200(res, "Member list loaded successfully.", true, data[0])
})

module.exports = {
    addStory,
    updateStory,
    getStory
}
