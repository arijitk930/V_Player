import { isValidObjectId } from "mongoose"
import { ApiError } from "./ApiError.js"

// helper function to validate MongoDB ObjectId format and existence
export const validateMongoId = (id, fieldName = 'ID') => {
    // Check if videoId exists and is not just whitespace
    if (!id?.trim()) {
        throw new ApiError(400, `${fieldName} is missing`)
    }

    // Validate that videoId is a valid MongoDB ObjectId format (24 hex characters). This prevents unnecessary database queries with invalid IDs
    if (!isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${fieldName}`)
    }
}