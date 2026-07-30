const { Schema, model, Types } = require("mongoose");

const connectionSchema = new Schema(
  {
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

connectionSchema.index(
  {
    sender: 1,
    receiver: 1,
  },
  {
    unique: true,
  },
);

module.exports = model("Connection", connectionSchema);
