"use client"

import { useEffect, useState, useRef } from "react"
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  List,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  Badge,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  useTheme,
  alpha,
  Fade,
  Slide,
  Collapse,
  AvatarGroup,
  Stack,
  useMediaQuery,
} from "@mui/material"
import {
  Add,
  Group,
  Person,
  Search,
  MoreVert,
  PushPin,
  Archive,
  Delete,
  VolumeOff,
  Check,
  DoneAll,
  Schedule,
  Close,
  FilterList,
  Settings,
} from "@mui/icons-material"
import axios from "axios"
import CreateChatModal from "./CreateChatModal"
import { io } from "socket.io-client"

const SOCKET_URL = "http://localhost:5005"

const ChatList = ({ user, onSelectChat, onLogout }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [chats, setChats] = useState([])
  const [filteredChats, setFilteredChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [selectedChat, setSelectedChat] = useState(null)
  const [filter, setFilter] = useState("all")
  const [pinnedChats, setPinnedChats] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingChats, setTypingChats] = useState({})
  const [allUsers, setAllUsers] = useState([])
  const searchInputRef = useRef(null)
  const socketRef = useRef(null)
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState(null)

  // Socket.io ile online kullanıcıları dinle
  useEffect(() => {
    socketRef.current = io(SOCKET_URL)
    socketRef.current.emit("userOnline", user.id)
    socketRef.current.on("onlineUsers", (users) => {
      setOnlineUsers(users)
    })
    return () => {
      socketRef.current.disconnect()
    }
  }, [user.id])


  useEffect(() => {
    if (!socketRef.current) return
    const handleTyping = ({ chatId, userId: typingUserId, isTyping }) => {
      setTypingChats((prev) => ({ ...prev, [chatId]: isTyping }))
    }
    socketRef.current.on("typing", handleTyping)
    return () => {
      socketRef.current.off("typing", handleTyping)
    }
  }, [])


  const fetchChats = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`http://localhost:5005/api/chats/user/${user.id}`)
      setChats(res.data)
      setFilteredChats(res.data)
    } catch (err) {
      console.error("Sohbetler yüklenemedi:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChats()
  }, [user.id, pinnedChats])


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5005/api/users")
        setAllUsers(res.data)
      } catch (err) {
        console.error("Kullanıcılar yüklenemedi:", err)
      }
    }
    fetchUsers()
  }, [])


  useEffect(() => {
    let filtered = chats
    if (searchQuery) {
      filtered = filtered.filter(
        (chat) =>
          (chat.isGroup ? chat.name : getOtherUser(chat, user, allUsers) || "Birebir Sohbet")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          chat.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    switch (filter) {
      case "unread":
        filtered = filtered.filter((chat) => chat.unreadCount > 0)
        break
      case "groups":
        filtered = filtered.filter((chat) => chat.isGroup)
        break
      case "archived":
        filtered = filtered.filter((chat) => chat.isArchived)
        break
      default:
        filtered = filtered.filter((chat) => !chat.isArchived)
    }

    const pinned = filtered.filter((chat) => chat.isPinned)
    const unpinned = filtered.filter((chat) => !chat.isPinned)

    pinned.sort((a, b) => {
      const aTime = a.lastMessage && a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0
      const bTime = b.lastMessage && b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0
      return bTime - aTime
    })
    unpinned.sort((a, b) => {
      const aTime = a.lastMessage && a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0
      const bTime = b.lastMessage && b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0
      return bTime - aTime
    })

    setFilteredChats([...pinned, ...unpinned])
  }, [chats, searchQuery, filter, allUsers])

  const toggleSearch = () => {
    setShowSearch(!showSearch)
    if (!showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    } else {
      setSearchQuery("")
    }
  }

  const handleContextMenu = (event, chat) => {
    event.preventDefault()
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY })
    setSelectedChat(chat)
  }

  const closeContextMenu = () => {
    setContextMenu(null)
    setSelectedChat(null)
  }

  const togglePin = (chatId) => {
    setPinnedChats((prev) => (prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]))
    closeContextMenu()
  }

  const handleCreated = (newChat) => {
    fetchChats()
    onSelectChat(newChat)
    setSelectedChatId(newChat._id)
  }

  const handleChatSelect = (chat) => {
    setSelectedChatId(chat._id)
    onSelectChat(chat)
  }

 
  const handleDeleteChat = async () => {
    if (!selectedChat) return
    try {
      await axios.delete(`http://localhost:5005/api/chats/${selectedChat._id}`)
      setChats((prev) => prev.filter((c) => c._id !== selectedChat._id))
      setFilteredChats((prev) => prev.filter((c) => c._id !== selectedChat._id))
      if (selectedChatId === selectedChat._id) {
        setSelectedChatId(null)
        onSelectChat(null)
      }
      closeContextMenu()
    } catch (err) {
      alert("Sohbet silinemedi")
    }
  }


  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = (now - date) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    const diffInDays = diffInHours / 24

    if (diffInMinutes < 1) {
      return "Şimdi"
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}dk`
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    } else if (diffInDays < 7) {
      return date.toLocaleDateString("tr-TR", { weekday: "short" })
    } else {
      return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })
    }
  }

  const getMessageStatusIcon = (status, isOwn) => {
    if (!isOwn) return null
    switch (status) {
      case "sending":
        return <Schedule sx={{ fontSize: 14, color: "text.disabled" }} />
      case "sent":
        return <Check sx={{ fontSize: 14, color: "text.disabled" }} />
      case "delivered":
        return <DoneAll sx={{ fontSize: 14, color: "text.disabled" }} />
      case "read":
        return <DoneAll sx={{ fontSize: 14, color: "primary.main" }} />
      default:
        return null
    }
  }

  const getOtherUser = (chat, user, users) => {
    if (!chat.isGroup && chat.members && chat.members.length === 2 && users && users.length > 0) {
      const myId = String(user.id || user._id)
      const otherId = chat.members.find((id) => String(id) !== myId)
      const otherUser = users.find((u) => String(u._id) === String(otherId))
      return otherUser ? otherUser.displayName : "Bilinmeyen Kullanıcı"
    }
    return null
  }

  const handleSettingsMenuOpen = (event) => {
    setSettingsMenuAnchor(event.currentTarget)
  }
  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null)
  }

  if (loading) {
    return (
      <Box
        sx={{
          width: { xs: "100%", sm: 380 },
          height: "100%",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          borderRight: { xs: "none", sm: "1px solid" },
          borderColor: { xs: "transparent", sm: alpha(theme.palette.divider, 0.1) },
        }}
      >
        <CircularProgress color="primary" size={48} thickness={4} />
        <Typography variant="h6" color="text.secondary" fontWeight={500}>
          Sohbetler yükleniyor...
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: { xs: "100%", sm: 380 },
        maxWidth: "100%",
        minWidth: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: { xs: "none", sm: "1px solid" },
        borderColor: { xs: "transparent", sm: alpha(theme.palette.divider, 0.1) },
        position: "relative",
        boxShadow: { xs: 0, sm: 2 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.1),
          position: "relative",
          zIndex: 10,
        }}
      >
        <Collapse in={!showSearch}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              color="primary.main"
              sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
            >
              Sohbetler
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="Ara">
                <IconButton
                  size="small"
                  onClick={toggleSearch}
                  sx={{
                    color: "primary.main",
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                  }}
                >
                  <Search />
                </IconButton>
              </Tooltip>
              <Tooltip title="Filtrele">
                <IconButton
                  size="small"
                  sx={{
                    color: "primary.main",
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                  }}
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ayarlar">
                <IconButton
                  size="small"
                  sx={{
                    color: "primary.main",
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                  }}
                  onClick={handleSettingsMenuOpen}
                >
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Collapse>

        <Slide direction="down" in={showSearch} mountOnEnter unmountOnExit>
          <Box sx={{ mb: 2.5 }}>
            <TextField
              ref={searchInputRef}
              fullWidth
              placeholder="Sohbetlerde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={toggleSearch}>
                      <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                  "&:hover fieldset": {
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />
          </Box>
        </Slide>

        <Box sx={{ mb: 2, overflowX: "auto", "&::-webkit-scrollbar": { display: "none" } }}>
          <Stack direction="row" spacing={1} sx={{ minWidth: "max-content", pb: 1 }}>
            {[
              { key: "all", label: "Tümü", count: chats.filter((c) => !c.isArchived).length },
              { key: "unread", label: "Okunmamış", count: chats.filter((c) => c.unreadCount > 0).length },
              { key: "groups", label: "Gruplar", count: chats.filter((c) => c.isGroup).length },
            ].map(({ key, label, count }) => (
              <Chip
                key={key}
                label={`${label} (${count})`}
                variant={filter === key ? "filled" : "outlined"}
                color={filter === key ? "primary" : "default"}
                size="small"
                onClick={() => setFilter(key)}
                sx={{
                  fontWeight: filter === key ? 600 : 400,
                  fontSize: { xs: "0.75rem", sm: "0.8rem" },
                  "&:hover": {
                    bgcolor: filter === key ? "primary.dark" : alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              />
            ))}
          </Stack>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setOpenModal(true)}
          fullWidth
          size="large"
          sx={{
            py: { xs: 1.2, sm: 1.8 },
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 3,
            fontSize: { xs: "0.9rem", sm: "1rem" },
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            "&:hover": {
              boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
              transform: "translateY(-2px)",
            },
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          Yeni Sohbet Oluştur
        </Button>
      </Paper>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": {
            width: { xs: "0px", sm: "8px" },
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
          msOverflowStyle: { xs: "none", sm: "auto" },
          scrollbarWidth: { xs: "none", sm: "thin" },
        }}
      >
        {filteredChats.length === 0 ? (
          <Fade in timeout={600}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 3,
                p: 4,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  width: { xs: 80, sm: 100 },
                  height: { xs: 80, sm: 100 },
                }}
              >
                <Group fontSize="large" sx={{ color: "primary.main", fontSize: { xs: 32, sm: 40 } }} />
              </Avatar>
              <Box textAlign="center">
                <Typography
                  variant="h5"
                  color="text.primary"
                  fontWeight={700}
                  mb={1}
                  sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
                >
                  {searchQuery ? "Sonuç bulunamadı" : "Henüz sohbet yok"}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                  {searchQuery ? "Farklı anahtar kelimeler deneyin" : "Yeni bir sohbet oluşturarak başlayın"}
                </Typography>
              </Box>
            </Box>
          </Fade>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredChats.map((chat, index) => (
              <Fade in timeout={200 + index * 50} key={chat._id}>
                <Box>
                  <ListItemButton
                    onClick={() => handleChatSelect(chat)}
                    onContextMenu={(e) => handleContextMenu(e, chat)}
                    selected={selectedChatId === chat._id}
                    sx={{
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 3 },
                      position: "relative",
                      "&.Mui-selected": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderRight: `4px solid ${theme.palette.primary.main}`,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                        },
                      },
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover .chat-actions": {
                        opacity: { xs: 0, sm: 1 },
                        transform: "translateX(0)",
                      },
                    }}
                  >
                    {chat.isPinned && (
                      <PushPin
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          fontSize: { xs: 12, sm: 14 },
                          color: "primary.main",
                          transform: "rotate(45deg)",
                        }}
                      />
                    )}

                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        badgeContent={
                          chat.unreadCount > 0 ? (
                            <Box
                              sx={{
                                bgcolor: chat.isMuted ? "text.secondary" : "error.main",
                                color: "white",
                                borderRadius: "50%",
                                width: { xs: 18, sm: 20 },
                                height: { xs: 18, sm: 20 },
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: { xs: "0.65rem", sm: "0.7rem" },
                                fontWeight: 700,
                                border: "2px solid white",
                                boxShadow: theme.shadows[2],
                              }}
                            >
                              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                            </Box>
                          ) : chat.isOnline ? (
                            <Box
                              sx={{
                                width: { xs: 12, sm: 14 },
                                height: { xs: 12, sm: 14 },
                                borderRadius: "50%",
                                bgcolor: "#4caf50",
                                border: "3px solid white",
                                boxShadow: theme.shadows[2],
                              }}
                            />
                          ) : null
                        }
                      >
                        {chat.isGroup ? (
                          <AvatarGroup max={2} sx={{ width: { xs: 44, sm: 52 }, height: { xs: 44, sm: 52 } }}>
                            <Avatar
                              sx={{ bgcolor: "primary.main", width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}
                            >
                              <Group fontSize="small" />
                            </Avatar>
                            <Avatar
                              sx={{
                                bgcolor: "secondary.main",
                                width: { xs: 28, sm: 32 },
                                height: { xs: 28, sm: 32 },
                              }}
                            >
                              <Person fontSize="small" />
                            </Avatar>
                          </AvatarGroup>
                        ) : (
                          <Avatar
                            sx={{
                              bgcolor: "secondary.main",
                              width: { xs: 44, sm: 52 },
                              height: { xs: 44, sm: 52 },
                              fontSize: { xs: "1rem", sm: "1.2rem" },
                              fontWeight: 700,
                              boxShadow: theme.shadows[3],
                              border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            }}
                          >
                            <Person />
                          </Avatar>
                        )}
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={chat.unreadCount > 0 ? 800 : 600}
                              color="text.primary"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                              }}
                            >
                              {chat.isGroup ? chat.name : getOtherUser(chat, user, allUsers)}
                            </Typography>

                            {chat.isMuted && (
                              <VolumeOff sx={{ fontSize: { xs: 14, sm: 16 }, color: "text.disabled" }} />
                            )}
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                            {getMessageStatusIcon(
                              chat.lastMessage && chat.lastMessage.status,
                              chat.lastMessage && chat.lastMessage.senderId === user.id,
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                fontWeight: chat.unreadCount > 0 ? 600 : 400,
                              }}
                            >
                              {formatLastMessageTime(chat.lastMessage && chat.lastMessage.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {typingChats[chat._id] ? (
                              <Typography
                                component="span"
                                variant="body2"
                                color="primary.main"
                                sx={{
                                  fontStyle: "italic",
                                  fontWeight: 500,
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                }}
                              >
                                yazıyor...
                              </Typography>
                            ) : (
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  fontWeight: chat.unreadCount > 0 ? 500 : 400,
                                  fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                }}
                              >
                                {chat.lastMessage && chat.lastMessage.senderId === user.id ? "Sen: " : ""}
                                {chat.lastMessage && chat.lastMessage.content}
                              </Typography>
                            )}
                          </Box>

                          {chat.isGroup && (
                            <Chip
                              label={`${chat.memberCount} üye`}
                              size="small"
                              variant="outlined"
                              component="span"
                              sx={{
                                fontSize: { xs: "0.65rem", sm: "0.7rem" },
                                height: { xs: 18, sm: 20 },
                                borderColor: alpha(theme.palette.primary.main, 0.2),
                                color: "primary.main",
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                ml: 1,
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                    />

                    <Box
                      className="chat-actions"
                      sx={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%) translateX(10px)",
                        opacity: 0,
                        transition: "all 0.2s ease-in-out",
                        display: { xs: "none", sm: "flex" },
                        gap: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePin(chat._id)
                        }}
                        sx={{
                          bgcolor: "background.paper",
                          boxShadow: theme.shadows[2],
                          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                        }}
                      >
                        <PushPin sx={{ fontSize: 16, color: chat.isPinned ? "primary.main" : "text.secondary" }} />
                      </IconButton>
                    </Box>
                  </ListItemButton>

                  {index < filteredChats.length - 1 && (
                    <Divider
                      sx={{
                        ml: { xs: 8, sm: 10 },
                        borderColor: alpha(theme.palette.divider, 0.05),
                      }}
                    />
                  )}
                </Box>
              </Fade>
            ))}
          </List>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          borderTop: "1px solid",
          borderColor: alpha(theme.palette.divider, 0.1),
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              <Box
                sx={{
                  width: { xs: 12, sm: 14 },
                  height: { xs: 12, sm: 14 },
                  borderRadius: "50%",
                  bgcolor: "#4caf50",
                  border: "3px solid white",
                  boxShadow: theme.shadows[2],
                }}
              />
            }
          >
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                fontSize: { xs: "1rem", sm: "1.2rem" },
                fontWeight: 700,
                boxShadow: theme.shadows[3],
              }}
            >
              {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="text.primary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: { xs: "0.9rem", sm: "1rem" },
              }}
            >
              {user.displayName || user.username}
            </Typography>
            <Typography
              variant="body2"
              color="primary.main"
              fontWeight={500}
              sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
            >
              Çevrimiçi
            </Typography>
          </Box>

          <IconButton
            size="small"
            sx={{
              color: "primary.main",
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
            }}
          >
            <MoreVert />
          </IconButton>
        </Box>
      </Paper>

      <Menu
        open={contextMenu !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={() => togglePin(selectedChat?._id)}>
          <PushPin sx={{ mr: 2, fontSize: 18 }} />
          {selectedChat?.isPinned ? "Sabitlemeyi Kaldır" : "Sabitle"}
        </MenuItem>
        <MenuItem onClick={closeContextMenu}>
          <VolumeOff sx={{ mr: 2, fontSize: 18 }} />
          Sessiz
        </MenuItem>
        <MenuItem onClick={closeContextMenu}>
          <Archive sx={{ mr: 2, fontSize: 18 }} />
          Arşivle
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteChat} sx={{ color: "error.main" }}>
          <Delete sx={{ mr: 2, fontSize: 18 }} />
          Sil
        </MenuItem>
      </Menu>

      <CreateChatModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={handleCreated}
        currentUser={user}
      />

      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={handleSettingsMenuClose}
        PaperProps={{
          sx: { borderRadius: 2, boxShadow: theme.shadows[8], minWidth: 180 },
        }}
      >
        <MenuItem onClick={() => { handleSettingsMenuClose(); onLogout && onLogout(); }} sx={{ color: 'error.main' }}>
          Çıkış Yap
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default ChatList;