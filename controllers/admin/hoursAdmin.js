const { response200, response400 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { Hour } = require("../../models");
const { default: mongoose } = require("mongoose");

// add hour
const addHour = catchAsyncError(async (req, res) => {
    let { name } = req.body
    if (!name) return response400(res, "name is required.")

    isMatch = await Hour.findOne({ name, isDeleted: 0 })
    if (isMatch) return response400(res, "Hour already exits.")

    await Hour.create({ name })
    return response200(res, "Hour added successfully.", true, [])

})

// update hour
const updateHour = catchAsyncError(async (req, res) => {
    let { id, name, status } = req.body
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (!mongoose.Types.ObjectId.isValid(id)) throw new ErrorHandler("Please enter valid hour id", HttpStatus.BAD_REQUEST);


    const hour = await Hour.findOne({ _id: id, isDeleted: 0 });
    if (!hour) return response400(res, "Hour not found.");

    if (name) {
        const isMatch = await Hour.findOne({
            name,
            isDeleted: 0,
            _id: { $ne: id }

        })
        if (isMatch) return response400(res, "Hour already exits.");

        hour.name = name
    }

    if (status !== undefined) {
        hour.status = status
    }

    await hour.save()
    return response200(res, "Hour updated successfully", true, []);

})

// get all hour
const getAllHour = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0 };

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const findQuery = Hour.find(query).sort({ createdAt: -1 }).select('_id name createdAt status')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "Hour list loaded successfully", true, data);

});

// delete hour
const deleteHour = catchAsyncError(async (req, res) => {
    const { hourId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hourId)) throw new ErrorHandler("Please enter valid hourId", HttpStatus.BAD_REQUEST);


    const hour = await Hour.findByIdAndUpdate({ _id: hourId }, { $set: { isDeleted: 1 } })
    if (!hour) return response400(res, "Hour not found.");
    return response200(res, "Hour deleted successfully", true, []);
});

module.exports = {
    addHour,
    updateHour,
    getAllHour,
    deleteHour
}
