const { response200, response400 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { DetectedKeyword } = require("../../models");
const { default: mongoose } = require("mongoose");

// add key word
const addKeyWord = catchAsyncError(async (req, res) => {
    let { keyword } = req.body
    if (!keyword) return response400(res, "keyword is required.")

    keyword = keyword.toLowerCase()
    isMatch = await DetectedKeyword.findOne({ keyword, isDeleted: 0 })
    if (isMatch) return response400(res, "Keyword id already exits.")

    await DetectedKeyword.create({ keyword })
    return response200(res, "Keyword added successfully.", true, [])

})

// update key word
const updateKeyWord = catchAsyncError(async (req, res) => {
    let { id, keyword, status } = req.body
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (!mongoose.Types.ObjectId.isValid(id)) throw new ErrorHandler("Please enter valid keyword id", HttpStatus.BAD_REQUEST);
    keyword = keyword.toLowerCase()

    const keyWord = await DetectedKeyword.findOne({ _id: id, isDeleted: 0 });
    if (!keyWord) return response400(res, "Keyword not found.");

    if (keyword) {
        const isMatch = await DetectedKeyword.findOne({
            keyword,
            isDeleted: 0,
            _id: { $ne: id }

        })
        if (isMatch) return response400(res, "Keyword already exits.");

        keyWord.keyword = keyword
    }

    if (status !== undefined) {
        keyWord.status = status
    }

    await keyWord.save()
    return response200(res, "Keyword updated successfully", true, []);

})

// get all key word
const getAllKeyWord = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0 };

    if (search) {
        query.keyword = { $regex: search, $options: 'i' };
    }

    const findQuery = DetectedKeyword.find(query).sort({ createdAt: -1 }).select('_id keyword createdAt status')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "Keyword list loaded successfully", true, data);

});

// delete key word
const deleteKeyWord = catchAsyncError(async (req, res) => {
    const { keywordId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(keywordId)) throw new ErrorHandler("Please enter valid keywordId", HttpStatus.BAD_REQUEST);

    const keyword = await DetectedKeyword.findByIdAndUpdate({ _id: keywordId }, { $set: { isDeleted: 1 } })
    if (!keyword) return response400(res, "Keyword not found.");
    return response200(res, "Keyword deleted successfully", true, []);
});

module.exports = {
    addKeyWord,
    updateKeyWord,
    getAllKeyWord,
    deleteKeyWord
}
