const { Schema, model, Types, default: mongoose } = require("mongoose");

const likeSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    post: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

likeSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = mongoose.model("Like", likeSchema);