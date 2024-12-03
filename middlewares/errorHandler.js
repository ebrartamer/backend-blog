const APIError = require("../utils/error");

const errorHandlerMiddleware = (err, req, res, next) => {
    console.log(err);

    if (err instanceof APIError) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
}

module.exports = errorHandlerMiddleware;