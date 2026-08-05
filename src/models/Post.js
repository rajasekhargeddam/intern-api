const mongoose = require("mongoose");
const validator = require("validator");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      trim: true,
      required: [true, "Post content is required"],
      maxlength: [2000, "Post content cannot exceed 2000 characters"],
      default: "",
    },

    images: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          publicId: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
      validate: {
        validator: (images) => images.length <= 4,
        message: "A post can contain a maximum of 4 images.",
      },
    },

    hashtags: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
        },
      ],
      default: [],
      validate: {
        validator: (hashtags) => hashtags.length <= 10,
        message: "A post can contain a maximum of 10 hashtags.",
      },
    },

    links: {
      type: [
        {
          type: String,
          validate: {
            validator: (url) => validator.isURL(url),
            message: "Invalid URL",
          },
        },
      ],
      default: [],
      validate: {
        validator: (links) => links.length <= 5,
        message: "A post can contain a maximum of 5 links.",
      },
    },
  },
  {
    timestamps: true,
  },
);

postSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    const Like = require("./Like");
    const Comment = require("./Comment");

    await Promise.all([
      Like.deleteMany({ post: this._id }),
      Comment.deleteMany({ post: this._id }),
    ]);
  }
);

module.exports = mongoose.model("Post", postSchema);
