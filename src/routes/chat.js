const { Router } = require("express");
const authenticate = require("../middleware/authenticate");
const Chat = require("../models/Chat");
const Connection = require("../models/Connection");

const chatRouter = Router();

chatRouter.get("/users", authenticate, async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Get all chats for the logged-in user, sorted by last message timestamp
        const chats = await Chat.find({
            participants: userId
        })
            .populate("participants", "username profilePicture")
            .sort({ "messages.createdAt": -1 })
            .lean();

        // Transform chats to get the other participant and latest message
        const chatUsers = chats.map(chat => {
            const targetUser = chat.participants.find(
                participant => participant._id.toString() !== userId.toString()
            );

            const lastMessage = chat.messages.length > 0
                ? chat.messages[chat.messages.length - 1]
                : null;

            return {
                _id: chat._id,
                targetUser,
                lastMessage,
                updatedAt: chat.updatedAt
            };
        });

        // Sort by last message timestamp (most recent first)
        chatUsers.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.updatedAt || 0;
            const timeB = b.lastMessage?.createdAt || b.updatedAt || 0;
            return new Date(timeB) - new Date(timeA);
        });

        res.status(200).json(chatUsers);
    } catch (error) { 
        console.error("Error fetching chat users:", error);
        next(error);
    }
})

chatRouter.get("/connections", authenticate, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const mongoose = require("mongoose");

        // Get all chats for the current user to find who they're already chatting with
        const userChats = await Chat.find({
            participants: userId
        }).select("participants").lean();

        // Extract all user IDs already in chats (excluding self)
        const chatParticipants = new Set();
        userChats.forEach(chat => {
            chat.participants.forEach(participantId => {
                if (participantId.toString() !== userId.toString()) {
                    chatParticipants.add(participantId.toString());
                }
            });
        });

        // Get all accepted connections using efficient aggregation pipeline
        const connections = await Connection.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(userId), status: "accepted" },
                        { receiver: new mongoose.Types.ObjectId(userId), status: "accepted" }
                    ]
                }
            },
            {
                $addFields: {
                    otherUserId: {
                        $cond: [
                            { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                            "$receiver",
                            "$sender"
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "otherUserId",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: "$userInfo"
            },
            {
                $project: {
                    _id: "$userInfo._id",
                    username: "$userInfo.username",
                    email: "$userInfo.email",
                    profilePicture: "$userInfo.profilePicture"
                }
            }
        ]);

        // Filter out connections that are already in chats
        const availableConnections = connections.filter(
            user => !chatParticipants.has(user._id.toString())
        );

        res.status(200).json(availableConnections);
    } catch (error) { 
        console.error("Error fetching chat connections:", error);
        next(error);
    }
})

chatRouter.get("/:targetId", authenticate, async (req, res, next) => {
    const userId = req.user._id;
    const targetId = req.params.targetId;
    const mongoose = require("mongoose");

    // Validate if targetId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return next(new (require("../utils/AppError"))("Invalid target user ID", 400));
    }

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