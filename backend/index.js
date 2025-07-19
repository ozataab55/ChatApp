const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 5005;

app.use(cors());
app.use(bodyParser.json());

// MongoDB bağlantısı
mongoose.connect("mongodb://localhost:27017/chatdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log(err));

// Route'ları import et ve ekle
const chatRoutes = require("./routes/chat");
const messageRoutes = require("./routes/message");
const userRoutes = require("./routes/user");

app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  }
});
app.set('io', io);

const onlineUsers = new Set();

io.on('connection', (socket) => {
  // Kullanıcı bağlanınca id'sini bildirir
  socket.on('userOnline', (userId) => {
    onlineUsers.add(userId);
    io.emit('onlineUsers', Array.from(onlineUsers));
  });

  // Odaya katılım ve mesaj eventleri
  socket.on('join', (chatId) => {
    socket.join(chatId);
  });

  socket.on('newMessage', (data) => {
    io.to(data.chatId).emit('message', data.message);
  });

  // Typing (yazıyor) event'i
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    socket.to(chatId).emit('typing', { chatId, userId, isTyping });
  });

  // Bağlantı kopunca kullanıcıyı çıkar
  socket.on('disconnect', () => {
    // Her bağlantı için userId'yi saklamamız gerek
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('onlineUsers', Array.from(onlineUsers));
    }
  });

  // userId'yi socket objesine kaydet
  socket.on('userOnline', (userId) => {
    socket.userId = userId;
  });
});

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});