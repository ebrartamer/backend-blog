class Response {
    constructor(data = null, message = null) {
        this.data = data;
        this.message = message;
    }

    success(res, statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            data: this.data,
            message: this.message ?? "Process successful"
        });
    }

    error400(res, statusCode = 400) {
        return res.status(statusCode).json({
            success: false,
            message: this.message ?? "Bad request"
        });
    }

    error500(res, statusCode = 500) {
        return res.status(statusCode).json({
            success: false,
            message: this.message ?? "API error occurred"
        });
    }

    error401(res, statusCode = 401) {
        return res.status(statusCode).json({
            success: false,
            message: this.message ?? "Unauthorized"
        });
    }

    error404(res, statusCode = 404) {
        return res.status(statusCode).json({
            success: false,
            message: this.message ?? "Not found"
        });
    }

    error429(res, statusCode = 429) {
        return res.status(statusCode).json({
            success: false,
            message: this.message ?? "Too many requests"
        });
    }

    created(res) {
        return res.status(201).json({
            success: true,
            data: this.data,
            message: this.message ?? "Process successful"
        });
    }

}

module.exports = Response;