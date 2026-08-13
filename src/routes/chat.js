const { Router } = require("express");
const authenticate = require("../middleware/authenticate");
const Chat = require("../models/Chat");

const chatRouter = Router();

chatRouter.get("/:targetId", authenticate, async (req, res, next) => {
    const userId = req.user._id;
    const targetId = req.params.targetId;

    try {
        let chat = await Chat.findOne({
            participants: { $all: [userId, targetId] }
        });

        if (!chat) {
            chat = new Chat({
                participants: [userId, targetId],
                messages: []
            });

            await chat.save();
        }

        await chat.populate(
            "participants",
            "username profilePicture"
        );

        const chatObject = chat.toObject();

        const targetUser = chatObject.participants.find(
            (participant) =>
                participant._id.toString() !== userId.toString()
        );

        const response = {
            _id: chatObject._id,
            messages: chatObject.messages,
            targetUser
        };

        res.status(200).json(response);

    } catch (error) {
        console.error("Error fetching chat:", error);
        next(error);
    }
});
module.exports = chatRouter;