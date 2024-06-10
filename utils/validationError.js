const HttpStatus = require("./HttpStatus");

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.status = HttpStatus.BAD_REQUEST;
    }
}
module.exports = ValidationError