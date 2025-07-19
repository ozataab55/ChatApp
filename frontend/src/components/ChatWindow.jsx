"use client"

import { useEffect, useState, useRef } from "react"
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Fade,
  useTheme,
  alpha,
  useMediaQuery,
} from "@mui/material"
import {
  Send,
  PersonAdd,
  Group,
  Person,
  MoreVert,
  EmojiEmotions,
  AttachFile,
  Info,
  Image,
  InsertDriveFile,
} from "@mui/icons-material"
import axios from "axios"
import { io } from "socket.io-client"
import AddMemberModal from "./AddMemberModal"

const SOCKET_URL = "http://localhost:5005"

const EMOJI_LIST = ["😀", "😂", "😍", "🥰", "😊", "😎", "🤔", "😢", "😡", "👍", "👎", "❤️", "🔥", "💯", "🎉", "👏"]

const ChatWindow = ({ user, chat, users }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [openAddModal, setOpenAddModal] = useState(false)
  const [members, setMembers] = useState(chat.members || [])
  const [anchorEl, setAnchorEl] = useState(null)
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null)
  const [fileAnchorEl, setFileAnchorEl] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false)

  useEffect(() => {
    socketRef.current = io(SOCKET_URL)

    if (chat?._id) {
      socketRef.current.emit("join", chat._id)
    }

    socketRef.current.on("message", (message) => {
      setMessages((prev) => [...prev, message])
    })

    socketRef.current.on("userTyping", ({ userId, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping ? [...prev.filter((id) => id !== userId), userId] : prev.filter((id) => id !== userId),
      )
    })

    socketRef.current.on("onlineUsers", (users) => {
      setOnlineUsers(users)
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [chat?._id])

  useEffect(() => {
    if (!socketRef.current || !chat?._id) return

    const handleTyping = ({ chatId, userId: typingUserId, isTyping }) => {
      if (chatId === chat._id && typingUserId !== user.id) {
        setIsSomeoneTyping(isTyping)
        if (isTyping) {
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setIsSomeoneTyping(false), 3000)
        }
      }
    }

    socketRef.current.on("typing", handleTyping)
    return () => {
      socketRef.current.off("typing", handleTyping)
    }
  }, [chat?._id, user.id])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`http://localhost:5005/api/messages/chat/${chat._id}`)
        setMessages(res.data)
      } catch (err) {
        console.error("Mesajlar yüklenemedi:", err)
      } finally {
        setLoading(false)
      }
    }

    if (chat?._id) fetchMessages()
    setMembers(chat.members || [])
  }, [chat?._id, chat.members])

  const handleTyping = () => {
    socketRef.current.emit("typing", { chatId: chat._id, userId: user.id, isTyping: true })

    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing", { chatId: chat._id, userId: user.id, isTyping: false })
    }, 1000)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      setSending(true)
      const res = await axios.post("http://localhost:5005/api/messages/send", {
        chatId: chat._id,
        senderId: user.id,
        content: newMessage,
      })

      socketRef.current.emit("newMessage", {
        chatId: chat._id,
        message: res.data,
      })

      // Stop typing
      socketRef.current.emit("typing", { chatId: chat._id, userId: user.id, isTyping: false })
      setNewMessage("")
    } catch (err) {
      console.error("Mesaj gönderilemedi:", err)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (file) => {
    try {
      setSending(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("chatId", chat._id)
      formData.append("senderId", user.id)

      const res = await axios.post("http://localhost:5005/api/messages/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      socketRef.current.emit("newMessage", {
        chatId: chat._id,
        message: res.data,
      })
    } catch (err) {
      console.error("Dosya yüklenemedi:", err)
    } finally {
      setSending(false)
      setFileAnchorEl(null)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleMembersAdded = (newUserIds) => {
    setMembers((prev) => [...prev, ...newUserIds])
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Bugün"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Dün"
    } else {
      return date.toLocaleDateString("tr-TR")
    }
  }

  // Menu handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  // Emoji handlers
  const handleEmojiOpen = (event) => {
    setEmojiAnchorEl(event.currentTarget)
  }

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null)
  }

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji)
    setEmojiAnchorEl(null)
  }

  // File handlers
  const handleFileOpen = (event) => {
    setFileAnchorEl(event.currentTarget)
  }

  const handleFileClose = () => {
    setFileAnchorEl(null)
  }

  const handleImageSelect = () => {
    fileInputRef.current.accept = "image/*"
    fileInputRef.current.click()
    setFileAnchorEl(null)
  }

  const handleDocumentSelect = () => {
    fileInputRef.current.accept = "*"
    fileInputRef.current.click()
    setFileAnchorEl(null)
  }

  // Mesaj kutusunda yazma
  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    if (socketRef.current && chat?._id) {
      socketRef.current.emit("typing", {
        chatId: chat._id,
        userId: user.id,
        isTyping: !!e.target.value,
      })
    }
  }

  // Yardımcı fonksiyon: Birebir sohbetlerde karşıdaki kullanıcıyı bul
  const getOtherUser = () => {
    if (!chat.isGroup && chat.members && chat.members.length === 2 && users) {
      const otherId = chat.members.find((id) => id !== user.id)
      const otherUser = users.find((u) => u._id === otherId)
      return otherUser ? otherUser.displayName : otherId
    }
    return null
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          flexDirection: "column",
          gap: 3,
          bgcolor: "custom.one",
          flex: 1,
        }}
      >
        <CircularProgress color="primary" size={48} thickness={4} />
        <Typography variant="h6" color="text.secondary" fontWeight={500}>
          Mesajlar yükleniyor...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "custom.one",
        flex: 1,
        minWidth: 0,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          bgcolor: "background.paper",
          borderRadius: 0,
          borderBottom: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.1),
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: onlineUsers.includes(chat.partnerId) ? "#4caf50" : "#bdbdbd",
                    border: "2px solid white",
                  }}
                />
              }
            >
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  boxShadow: theme.shadows[3],
                }}
              >
                {chat.isGroup ? <Group /> : <Person />}
              </Avatar>
            </Badge>

            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                color="primary.main"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                {chat.isGroup ? chat.name : getOtherUser() || "Birebir Sohbet"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
                sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
              >
                {chat.isGroup
                  ? `${members.length} üye${typingUsers.length > 0 ? " • yazıyor..." : ""}`
                  : onlineUsers.includes(chat.partnerId)
                    ? "Çevrimiçi"
                    : "Son görülme bilinmiyor"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {chat.isGroup && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAdd />}
                onClick={() => setOpenAddModal(true)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                  boxShadow: theme.shadows[2],
                  "&:hover": {
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                {isMobile ? "Ekle" : "Üye Ekle"}
              </Button>
            )}
            <Tooltip title="Daha fazla">
              <IconButton onClick={handleMenuOpen} sx={{ color: "primary.main" }}>
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 1, sm: 2 },
          bgcolor: alpha(theme.palette.custom.one, 0.3),
          backgroundImage: `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.05)} 25%, transparent 25%),
                           linear-gradient(-45deg, ${alpha(theme.palette.primary.light, 0.05)} 25%, transparent 25%)`,
          backgroundSize: "20px 20px",
          "&::-webkit-scrollbar": {
            width: { xs: "4px", sm: "8px" },
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(theme.palette.primary.main, 0.3),
            borderRadius: "4px",
            "&:hover": {
              background: alpha(theme.palette.primary.main, 0.5),
            },
          },
        }}
      >
        {messages.length === 0 ? (
          <Fade in timeout={800}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  width: { xs: 60, sm: 80 },
                  height: { xs: 60, sm: 80 },
                  boxShadow: theme.shadows[3],
                }}
              >
                {chat.isGroup ? <Group fontSize="large" /> : <Person fontSize="large" />}
              </Avatar>
              <Box textAlign="center">
                <Typography
                  variant="h5"
                  color="text.primary"
                  fontWeight={600}
                  mb={1}
                  sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
                >
                  Henüz mesaj yok
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                  İlk mesajı göndererek sohbeti başlatın
                </Typography>
              </Box>
            </Box>
          </Fade>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.senderId === user.id
              const prevMsg = messages[index - 1]
              const nextMsg = messages[index + 1]

              const showDate =
                !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString()

              const showTime =
                !nextMsg ||
                nextMsg.senderId !== msg.senderId ||
                new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() > 300000

              return (
                <Fade in key={msg._id} timeout={300}>
                  <Box>
                    {showDate && (
                      <Box sx={{ textAlign: "center", my: 3 }}>
                        <Chip
                          label={formatDate(msg.createdAt)}
                          sx={{
                            bgcolor: alpha(theme.palette.background.paper, 0.9),
                            color: "text.secondary",
                            fontWeight: 600,
                            backdropFilter: "blur(10px)",
                            fontSize: { xs: "0.75rem", sm: "0.8rem" },
                          }}
                        />
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                        mb: showTime ? 1 : 0.3,
                      }}
                    >
                      <Paper
                        elevation={2}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          maxWidth: { xs: "85%", sm: "75%" },
                          bgcolor: isOwnMessage ? theme.palette.primary.main : theme.palette.background.paper,
                          color: isOwnMessage ? "white" : "text.primary",
                          borderRadius: 3,
                          borderTopRightRadius: isOwnMessage ? 1 : 3,
                          borderTopLeftRadius: isOwnMessage ? 3 : 1,
                          position: "relative",
                          boxShadow: theme.shadows[3],
                          "&:hover": {
                            boxShadow: theme.shadows[6],
                          },
                          transition: "all 0.2s ease-in-out",
                        }}
                      >
                        {msg.fileUrl ? (
                          <Box>
                            {msg.fileType?.startsWith("image/") ? (
                              <Box
                                component="img"
                                src={msg.fileUrl}
                                alt="Shared image"
                                sx={{
                                  maxWidth: "100%",
                                  maxHeight: { xs: 200, sm: 300 },
                                  borderRadius: 2,
                                  mb: msg.content ? 1 : 0,
                                }}
                              />
                            ) : (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: msg.content ? 1 : 0 }}>
                                <InsertDriveFile />
                                <Typography variant="body2">{msg.fileName || "Dosya"}</Typography>
                              </Box>
                            )}
                            {msg.content && (
                              <Typography
                                variant="body1"
                                sx={{
                                  wordBreak: "break-word",
                                  lineHeight: 1.5,
                                  fontSize: { xs: "0.9rem", sm: "1rem" },
                                }}
                              >
                                {msg.content}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography
                            variant="body1"
                            sx={{
                              wordBreak: "break-word",
                              lineHeight: 1.5,
                              fontSize: { xs: "0.9rem", sm: "1rem" },
                            }}
                          >
                            {msg.content}
                          </Typography>
                        )}

                        {showTime && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              textAlign: "right",
                              mt: 0.5,
                              opacity: 0.7,
                              fontSize: { xs: "0.65rem", sm: "0.7rem" },
                            }}
                          >
                            {formatTime(msg.createdAt)}
                          </Typography>
                        )}
                      </Paper>
                    </Box>
                  </Box>
                </Fade>
              )
            })}

            {typingUsers.length > 0 && (
              <Fade in>
                <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: "background.paper",
                      borderRadius: 3,
                      borderTopLeftRadius: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 0.3 }}>
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            animation: "typing 1.4s infinite",
                            animationDelay: `${i * 0.2}s`,
                            "@keyframes typing": {
                              "0%, 60%, 100%": { transform: "translateY(0)" },
                              "30%": { transform: "translateY(-10px)" },
                            },
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      yazıyor...
                    </Typography>
                  </Paper>
                </Box>
              </Fade>
            )}

            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      <Paper
        elevation={4}
        sx={{
          p: { xs: 1, sm: 2.5 },
          bgcolor: "background.paper",
          borderRadius: 0,
          borderTop: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.1),
          backdropFilter: "blur(10px)",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSend}
          sx={{ display: "flex", gap: { xs: 0.5, sm: 1.5 }, alignItems: "flex-end" }}
        >
          <Tooltip title="Dosya Ekle">
            <IconButton
              onClick={handleFileOpen}
              sx={{ color: "primary.main", mb: 0.5 }}
              size={isMobile ? "small" : "medium"}
            >
              <AttachFile />
            </IconButton>
          </Tooltip>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Mesaj yazın..."
            disabled={sending}
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 4,
                bgcolor: alpha(theme.palette.custom.one, 0.5),
                backdropFilter: "blur(10px)",
                fontSize: { xs: "0.9rem", sm: "1rem" },
                "& fieldset": {
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                },
                "&:hover fieldset": {
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                },
                "&.Mui-focused fieldset": {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2,
                },
              },
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
          />

          <Tooltip title="Emoji">
            <IconButton
              onClick={handleEmojiOpen}
              sx={{ color: "primary.main", mb: 0.5 }}
              size={isMobile ? "small" : "medium"}
            >
              <EmojiEmotions />
            </IconButton>
          </Tooltip>

          <Tooltip title="Gönder">
            <span>
              <IconButton
                type="submit"
                disabled={sending || !newMessage.trim()}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  width: { xs: 44, sm: 52 },
                  height: { xs: 44, sm: 52 },
                  boxShadow: theme.shadows[3],
                  "&:hover": {
                    bgcolor: "primary.dark",
                    boxShadow: theme.shadows[6],
                    transform: "translateY(-1px)",
                  },
                  "&.Mui-disabled": {
                    bgcolor: alpha(theme.palette.action.disabled, 0.3),
                    color: "action.disabled",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {sending ? <CircularProgress size={isMobile ? 20 : 24} color="inherit" /> : <Send />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files[0]) {
            handleFileUpload(e.target.files[0])
          }
        }}
      />

      <Menu
        anchorEl={emojiAnchorEl}
        open={Boolean(emojiAnchorEl)}
        onClose={handleEmojiClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            p: 1,
            maxWidth: { xs: 240, sm: 280 },
          },
        }}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(6, 1fr)", sm: "repeat(8, 1fr)" }, gap: 0.5 }}>
          {EMOJI_LIST.map((emoji, index) => (
            <IconButton
              key={index}
              onClick={() => handleEmojiSelect(emoji)}
              sx={{
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Menu>

      <Menu
        anchorEl={fileAnchorEl}
        open={Boolean(fileAnchorEl)}
        onClose={handleFileClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <MenuItem onClick={handleImageSelect}>
          <Image sx={{ mr: 2, color: "primary.main" }} />
          Resim
        </MenuItem>
        <MenuItem onClick={handleDocumentSelect}>
          <InsertDriveFile sx={{ mr: 2, color: "primary.main" }} />
          Dosya
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Info sx={{ mr: 2 }} />
          Sohbet Bilgileri
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
          Sohbeti Sil
        </MenuItem>
      </Menu>


      {chat.isGroup && (
        <AddMemberModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          chat={chat}
          currentUser={user}
          onMembersAdded={handleMembersAdded}
        />
      )}
    </Box>
  )
}

export default ChatWindow;