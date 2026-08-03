const { Schema, Types, model } = require("mongoose");

const commentSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    post: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    parentComment: {
      type: Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function () {
    const Comment = mongoose.model("Comment");

    const children = await Comment.find({
      parentComment: this._id,
    });

    await Promise.all(
      children.map(child => child.deleteOne())
    );
  }
);

module.exports = model("Comment", commentSchema);
