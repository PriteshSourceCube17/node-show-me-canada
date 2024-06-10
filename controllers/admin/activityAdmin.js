const { response200, response400, response500 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { Activity } = require("../../models");
const { default: mongoose } = require("mongoose");
const { uploadFile, deleteImage } = require("../../lib/uploader/upload");
const multer = require("multer");
const storage = multer.memoryStorage()
const upload = multer({ storage })


// add activity
const addActivity = catchAsyncError(async (req, res) => {
    upload.fields([
        { name: "name", maxCount: 1 },
        { name: "icon", maxCount: 1 },
    ])(req, res, async (error) => {
        try {
            if (error) return response400(res, "Something went wrong.")

            let { name } = req.body
            if (!name) return response400(res, "name is required.")

            isMatch = await Activity.findOne({ name, isDeleted: 0 })
            if (isMatch) return response400(res, "Activity already exits.")

            if (req?.files?.icon) {
                const file = req.files.icon[0]
                req.body.icon = await uploadFile(file)
            }


            await Activity.create(req.body)
            return response200(res, "Activity added successfully.", true, [])
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    })
})

// update activity
const updateActivity = catchAsyncError(async (req, res) => {
    upload.fields([
        { name: "id", maxCount: 1 },
        { name: "name", maxCount: 1 },
        { name: "icon", maxCount: 1 },
        { name: "status", maxCount: 1 },
    ])(req, res, async (error) => {
        try {
            let { id, name, status } = req.body

            if (!id) return response400(res, "activityId is required.")

            if (!mongoose.Types.ObjectId.isValid(id)) return response400(res, "Please enter valid activity id")


            const activity = await Activity.findOne({ _id: id, isDeleted: 0 });
            if (!activity) return response400(res, "Activity not found.");

            if (name) {
                const isMatch = await Activity.findOne({
                    name,
                    isDeleted: 0,
                    _id: { $ne: id }

                })
                if (isMatch) return response400(res, "Activity already exits.");

                activity.name = name
            }

            if (status !== undefined) activity.status = status

            const imgPath = activity.icon
            if (req?.files?.icon) {
                const file = req.files.icon[0]
                activity.icon = await uploadFile(file)
                if (imgPath !== undefined) await deleteImage(imgPath)
            }

            await activity.save()
            return response200(res, "Activity updated successfully", true, []);
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    })

})

// get all activity
const getAllActivity = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0 };

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const findQuery = Activity.find(query).sort({ createdAt: -1 }).select('_id name icon createdAt status')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "Activity list loaded successfully", true, data);

});

// delete activity
const deleteActivity = catchAsyncError(async (req, res) => {
    const { activityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(activityId)) throw new ErrorHandler("Please enter valid activityId", HttpStatus.BAD_REQUEST);

    const activity = await Activity.findByIdAndUpdate({ _id: activityId }, { $set: { isDeleted: 1 } })
    if (!activity) return response400(res, "Activity not found.");

    return response200(res, "Activity deleted successfully", true, []);
});

module.exports = {
    addActivity,
    updateActivity,
    getAllActivity,
    deleteActivity
}
