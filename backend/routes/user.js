const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Kullanıcı kaydı (register)
router.post("/register", async (req, res) => {
    try {
        const { username, displayName, password, profilePicture } = req.body;
        if (!username || !displayName || !password) {
            return res.status(400).json({ message: "Zorunlu alanlar eksik." });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Kullanıcı adı zaten alınmış." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            displayName,
            password: hashedPassword,
            profilePicture,
        });
        await user.save();
        res.status(201).json({ message: "Kayıt başarılı.", user: { id: user._id, username: user.username, displayName: user.displayName } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Kullanıcı girişi (login)
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Kullanıcı bulunamadı." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Şifre hatalı." });
        }
        res.json({ message: "Giriş başarılı.", user: { id: user._id, username: user.username, displayName: user.displayName } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Tüm kullanıcıları getir
router.get("/", async (req, res) => {
    try {
        const users = await User.find({}, "_id username displayName");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 