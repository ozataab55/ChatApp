const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Chat = require("../models/Chat");

// Mesaj gönder
router.post("/send", async (req, res) => {
    try {
        const { chatId, senderId, content, type } = req.body;
        const message = new Message({
            chatId,
            senderId,
            content,
            type: type || "text",
        });
        await message.save();
        // Socket.io ile ilgili odaya mesajı yayınla
        const io = req.app.get('io');
        if (io) {
            io.to(chatId).emit('message', message);
        }
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Bir sohbete ait mesajları getir
router.get("/chat/:chatId", async (req, res) => {
    try {
        const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 