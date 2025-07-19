const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    isGroup: {
        type: Boolean,
        default: false,
    },
    name: {
        type: String,
        required: function() { return this.isGroup; }, // Grupsa zorunlu
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    groupPicture: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat; 