const { response200, response400 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { Language } = require("../../models");
const { default: mongoose } = require("mongoose");

// add language
const addLanguage = catchAsyncError(async (req, res) => {
    let { name } = req.body
    if (!name) return response400(res, "name is required.")

    isMatch = await Language.findOne({ name, isDeleted: 0 })
    if (isMatch) return response400(res, "Language already exits.")

    await Language.create({ name })
    return response200(res, "Language added successfully.", true, [])

})

// update language
const updateLanguage = catchAsyncError(async (req, res) => {
    let { id, name, status } = req.body
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (!mongoose.Types.ObjectId.isValid(id)) throw new ErrorHandler("Please enter valid language id", HttpStatus.BAD_REQUEST);


    const language = await Language.findOne({ _id: id, isDeleted: 0 });
    if (!language) return response400(res, "Language not found.");

    if (name) {
        const isMatch = await Language.findOne({
            name,
            isDeleted: 0,
            _id: { $ne: id }

        })
        if (isMatch) return response400(res, "Language already exits.");

        language.name = name
    }

    if (status !== undefined) {
        language.status = status
    }

    await language.save()
    return response200(res, "Language updated successfully", true, []);

})

// get all language
const getAllLanguage = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0 };

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const findQuery = Language.find(query).sort({ createdAt: -1 }).select('_id name createdAt status')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "Language list loaded successfully", true, data);

});

// delete language
const deleteLanguage = catchAsyncError(async (req, res) => {
    const { languageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(languageId)) throw new ErrorHandler("Please enter valid languageId", HttpStatus.BAD_REQUEST);

    const language = await Language.findByIdAndUpdate({ _id: languageId }, { $set: { isDeleted: 1 } })
    if (!language) return response400(res, "Language not found.");
    return response200(res, "Language deleted successfully", true, []);
});

module.exports = {
    addLanguage,
    updateLanguage,
    getAllLanguage,
    deleteLanguage
}
