const { response200, response400, response500 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { City } = require("../../models");
const { default: mongoose } = require("mongoose");
const { uploadFile, deleteImage } = require("../../lib/uploader/upload");
const multer = require("multer");
const storage = multer.memoryStorage()
const upload = multer({ storage })

// add city
const addCity = catchAsyncError(async (req, res) => {
    upload.fields([
        { name: "name", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
        { name: "stateName", maxCount: 1 },
    ])(req, res, async (error) => {
        try {
            if (error) return response400(res, "Something went wrong.")

            let { name, stateName } = req.body
            if (!name) return response400(res, "name is required.")
            if (!stateName) return response400(res, "stateName is required.")

            isMatch = await City.findOne({ name, isDeleted: 0 })
            if (isMatch) return response400(res, "City already exits.")

            if (req?.files?.coverImage) {
                const file = req.files.coverImage[0]
                req.body.coverImage = await uploadFile(file)
            }

            await City.create(req.body)

            return response200(res, "City added successfully.", true, [])
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    })

})

// update city
const updateCity = catchAsyncError(async (req, res) => {
    upload.fields([
        { name: "cityId", maxCount: 1 },
        { name: "name", maxCount: 1 },
        { name: "stateName", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
        { name: "status", maxCount: 1 },
    ])(req, res, async (error) => {
        try {
            let { cityId, name, status, stateName } = req.body

            if (!cityId) return response400(res, "cityId is required.")

            if (!mongoose.Types.ObjectId.isValid(cityId)) return response400(res, "Please enter valid city id")


            const city = await City.findOne({ _id: cityId, isDeleted: 0 });
            if (!city) return response400(res, "City not found.");

            if (name) {
                const isMatch = await City.findOne({
                    name,
                    isDeleted: 0,
                    _id: { $ne: cityId }

                })
                if (isMatch) return response400(res, "City already exits.");
                city.name = name
            }

            if (status !== undefined) city.status = status

            const imgPath = city.coverImage
            if (req?.files?.coverImage) {
                const file = req.files.coverImage[0]
                city.coverImage = await uploadFile(file)
                if (imgPath !== undefined) await deleteImage(imgPath)
            }
            city.stateName = stateName
            await city.save()

            return response200(res, "City updated successfully", true, []);
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    })


})

// get all city
const getAllCity = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0 };

    if (search) {
        query.$or = [{ name: { $regex: search, $options: 'i' } }, { stateName: { $regex: search, $options: 'i' } }]
    }

    const findQuery = City.find(query).sort({ name: 1 }).select('_id name stateName coverImage createdAt status')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "City list loaded successfully", true, data);

});

// delete city
const deleteCity = catchAsyncError(async (req, res) => {
    const { cityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(cityId)) throw new ErrorHandler("Please enter valid cityId", HttpStatus.BAD_REQUEST);

    const city = await City.findByIdAndUpdate({ _id: cityId }, { $set: { isDeleted: 1 } })
    if (!city) return response400(res, "City not found.");

    return response200(res, "City deleted successfully", true, []);
});

module.exports = {
    addCity,
    updateCity,
    getAllCity,
    deleteCity
}
