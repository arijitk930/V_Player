import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { validateMongoId } from "../utils/validateMongoId.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination

  // Extract query parameters from the request. Set default values: page=1, limit=10 if not provided
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  // Convert page and limit to numbers (they come as strings from URL)
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  // Validate page number - must be 1 or greater
  if (pageNumber < 1 || isNaN(pageNumber)) {
    throw new ApiError(400, "Invalid page number");
  }

  // Validate limit - must be between 1 and 100
  if (limitNumber < 1 || limitNumber > 100 || isNaN(limitNumber)) {
    throw new ApiError(400, "limit must be between 1 and 100");
  }

  // Calculate how many videos to skip for pagination. Example: page 2 with limit 10 means skip first 10 videos
  const skip = (pageNumber - 1) * limitNumber;

  // Build the filter conditions for MongoDB query
  const matchCondition = {};

  // If userId is provided, filter videos by that user
  if (userId) {
    validateMongoId(userId, "User ID");
    matchCondition.owner = new mongoose.Types.ObjectId(userId);
  }

  // If search query is provided, search in title OR description
  if (query) {
    matchCondition.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  matchCondition.isPublished = true; // Only show published videos (not drafts)

  const sortOptions = {}; // Build sorting options

  // If sortBy is provided, sort by the specified field
  if (sortBy) {
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1; // 'asc' = ascending (1), anything else = descending (-1)
  } else {
    sortOptions.createdAt = -1; // Default: sort by creation date, newest first
  }

  // MongoDB aggregation pipeline to fetch videos
  const videos = await Video.aggregate([
    {
      $match: matchCondition, // Step 1: Filter videos based on our conditions
    },
    {
      $sort: sortOptions, // Step 2: Sort the filtered videos
    },
    {
      $skip: skip, // Step 3: Skip videos for pagination (like OFFSET in SQL)
    },
    {
      $limit: limitNumber, // Step 4: Limit the number of results (like LIMIT in SQL)
    },
    {
      $lookup: {
        // Step 5: Join with users collection to get owner details
        from: "users", // Collection to join with
        localField: "owner", // Field in videos collection
        foreignField: "_id", //Field in  users collection
        as: "owner", // Name for the joined data
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
  ]);

  if (!videos || videos.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos: [],
          pagination: {
            totalVideos: 0,
            totalPages: 0,
            currentPage: 0,
            limit: limitNumber,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        "No videos found"
      )
    );
  }

  const totalVideos = await Video.countDocuments(matchCondition); // Count total videos matching our filters (for pagination)

  const totalPages = Math.ceil(totalVideos / limitNumber); // Calculate total pages needed. Example: 25 videos with limit 10 = 3 pages

  // Send successful response with videos and pagination info
  return res.status(200).json(
    200,
    {
      videos: videos,
      pagination: {
        totalVideos,
        totalPages,
        currentPage: pageNumber,
        limitNumber: limitNumber,
        hasNextPage: pageNumber < totalPages ? true : false,
        hasPrevPage: pageNumber > 1 ? true : false,
      },
    },
    "Videos fetched successfully"
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
