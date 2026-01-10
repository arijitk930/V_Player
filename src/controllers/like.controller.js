import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateMongoId } from "../utils/validateMongoId.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  const { videoId } = req.params;

  validateMongoId(videoId, "Video ID");
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);

    await Video.findOneAndUpdate(
      {
        _id: videoId,
        likes: { $gt: 0 },
      },
      {
        $inc: { likes: -1 },
      }
    );
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  const like = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  await Video.findByIdAndUpdate(videoId, {
    $inc: { likes: 1 },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, like, "Video Liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on comment
  const { commentId } = req.params;

  validateMongoId(commentId, "Comment ID");

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);

    await Comment.findOneAndUpdate(
      {
        _id: commentId,
        likes: { $gt: 0 },
      },
      {
        $inc: { likes: -1 },
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Like removed successfully"));
  }

  const like = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  await Comment.findByIdAndUpdate(commentId, {
    $inc: { likes: 1 },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, like, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  const { tweetId } = req.params;
  validateMongoId(tweetId, "Tweet ID");

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);

    await Tweet.findOneAndUpdate(
      {
        _id: tweetId,
        likes: { $gt: 0 },
      },
      {
        $inc: { likes: -1 },
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet Like removed successfully"));
  }

  const like = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  await Tweet.findByIdAndUpdate(tweetId, {
    $inc: { likes: 1 },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, like, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.find({
    likedBy: req.user?._id,
    video: { $exists: true }, // '$exists: true' ensures we only fetch likes that are linked to a video field
  })
    .select("video")
    .populate({
      path: "video",
      select: "thumbnail title views owner",
      populate: {
        path: "owner",
        select: "fullName",
      },
    });

  if (likedVideos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, likedVideos, "No liked videos found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
