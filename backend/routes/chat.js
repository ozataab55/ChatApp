const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");

// Sohbet veya grup oluştur
router.post("/create", async (req, res) => {
    try {
        const { isGroup, name, members, admins, groupPicture } = req.body;
        if (isGroup && (!name || !members || members.length < 2)) {
            return res.status(400).json({ message: "Grup için en az 2 üye ve isim gerekli." });
        }
        if (!isGroup && (!members || members.length !== 2)) {
            return res.status(400).json({ message: "Birebir sohbet için 2 üye gerekli." });
        }
        const chat = new Chat({
            isGroup,
            name: isGroup ? name : undefined,
            members,
            admins: isGroup ? admins || [members[0]] : [],
            groupPicture,
        });
        await chat.save();
        // Kullanıcıların group listesine ekle
        await User.updateMany(
            { _id: { $in: members } },
            { $push: { groups: chat._id } }
        );
        res.status(201).json(chat);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Gruba üye ekle
router.post("/:chatId/add-member", async (req, res) => {
    try {
        const { userId } = req.body;
        const chat = await Chat.findByIdAndUpdate(
            req.params.chatId,
            { $addToSet: { members: userId } },
            { new: true }
        );
        if (!chat) return res.status(404).json({ message: "Chat bulunamadı." });
        await User.findByIdAndUpdate(userId, { $addToSet: { groups: chat._id } });
        res.json(chat);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Kullanıcının üye olduğu sohbetleri getir
router.get("/user/:userId", async (req, res) => {
    try {
        let chats = await Chat.find({ members: req.params.userId }).lean();
        // Birebir sohbetlerde aynı kişiyle birden fazla sohbeti engelle
        const seenPairs = new Set();
        chats = chats.filter(chat => {
            if (chat.isGroup) return true;
            if (chat.members.length !== 2) return false;
            const pair = chat.members.map(id => id.toString()).sort().join('-');
            if (seenPairs.has(pair)) return false;
            seenPairs.add(pair);
            return true;
        });
        // Her sohbet için unreadCount, memberCount ve lastMessage ekle
        const chatData = await Promise.all(chats.map(async chat => {
            // Son mesajı bul
            const lastMsg = await Message.findOne({ chatId: chat._id }).sort({ createdAt: -1 }).lean();
            // Okunmamış mesaj sayısı (kullanıcı görmediyse)
            const unreadCount = await Message.countDocuments({
                chatId: chat._id,
                senderId: { $ne: req.params.userId },
                seenBy: { $ne: req.params.userId }
            });
            return {
                ...chat,
                memberCount: chat.members.length,
                lastMessage: lastMsg ? {
                    content: lastMsg.content,
                    timestamp: lastMsg.createdAt,
                    senderId: lastMsg.senderId,
                } : null,
                unreadCount,
            };
        }));
        // Son mesaja göre sırala
        chatData.sort((a, b) => {
            const aTime = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
            const bTime = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
            return bTime - aTime;
        });
        res.json(chatData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Sohbet silme endpointi
router.delete('/:chatId', async (req, res) => {
    try {
        await Chat.findByIdAndDelete(req.params.chatId);
        res.json({ message: 'Sohbet silindi.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 