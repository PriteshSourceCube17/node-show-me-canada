const HttpStatus = require("../../utils/HttpStatus")

const response201 = (res, message = "Created successfully", success = true, response) => {
    return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message,
        success,
        data: response || []
    })
}

const response200 = (res, message = "fetch successfully", success = true, response) => {
    return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        success,
        message,
        data: response || []
    })
}

const response400 = (res, message = "Bad Request") => {
    return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        success: false,
        message
    })
}

const response401 = (res, message = "Unauthorized Request") => {
    return res.status(HttpStatus.UNAUTHORIZED).json({
        statusCode: HttpStatus.UNAUTHORIZED,
        success: false,
        message
    })
}

const response500 = (res, message = "Internal Server Error") => {
    return res.status(HttpStatus.ERROR).json({
        statusCode: HttpStatus.ERROR,
        success: false,
        message
    })
}

module.exports = { response201, response200, response400, response401, response500 }