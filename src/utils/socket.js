const socket = require("socket.io");
const Chat = require("../models/Chat");

const initalizeSocket = (server) => {

    const io = socket(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "https://intern-nine-sable.vercel.app",
                "https://intern-bt4no3a4c-geddam-ganesh-rajasekhars-projects.vercel.app",
                "http://54.206.126.238",
            ],
        },
    });

    io.on("connection", (socket) => {
        socket.on("join", ({ userId, targetUserId }) => {
            // Handle join event
            const roomId = [userId, targetUserId].sort().join("-");
            socket.join(roomId);
        });

        socket.on("sendMessage", async ({ username, userId, targetUserId, text }) => {
            // Handle send message event
            try {

                let chat = await Chat.findOne({
                    participants: { $all: [userId, targetUserId] }
                });

                if (!chat) {
                    chat = new Chat({
                        participants: [userId, targetUserId],
                        messages: []
                    });
                }

                chat.messages.push({ sender: userId, text });
                await chat.save();

                const lastMessage = chat.messages[chat.messages.length - 1];
                const roomId = [userId, targetUserId].sort().join("-");
                const emittedMessage = {
                    _id: lastMessage?._id?.toString?.() || lastMessage?._id,
                    sender: userId,
                    text,
                    createdAt: lastMessage?.createdAt,
                };

                io.to(roomId).emit("receiveMessage", emittedMessage);

            } catch (error) {
                console.error("Error sending message:", error);
            }
        });

        socket.on("disconnect", () => {
            // Handle disconnect event
        })
    });
}

module.exports = initalizeSocket;