"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  Radio,
  Box,
  Typography,
  Avatar,
  List,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Chip,
  IconButton,
  InputAdornment,
  Divider,
  Paper,
  Fade,
  Slide,
  CircularProgress,
  useTheme,
  alpha,
  Stack,
} from "@mui/material"
import { Search, Close, Group, Person, Add, PhotoCamera, EmojiEmotions } from "@mui/icons-material"
import axios from "axios"

const CreateChatModal = ({ open, onClose, onCreated, currentUser }) => {
  const theme = useTheme()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [step, setStep] = useState(1) 
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      axios
        .get("http://localhost:5005/api/users")
        .then((res) => {
          const filteredUsers = res.data.filter((u) => u._id !== currentUser.id)
          setUsers(filteredUsers)
          setFilteredUsers(filteredUsers)
        })
        .catch(() => {
          setUsers([])
          setFilteredUsers([])
        })

      setSelectedUsers([])
      setIsGroup(false)
      setGroupName("")
      setSearchQuery("")
      setStep(1)
      setError("")
    }
  }, [open, currentUser.id])

  useEffect(() => {
    if (searchQuery) {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const handleUserSelect = (userId) => {
    if (isGroup) {
      setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
    } else {
      setSelectedUsers([userId])
    }
  }

const handleNext = () => {
  if (step === 1) {
    setStep(2)
  } else if (step === 2 && !isGroup && selectedUsers.length === 1) {
    handleCreate()
  } else if (step === 2 && isGroup && selectedUsers.length > 0) {
    setStep(3)
  } else if (step === 3 && isGroup) {
    handleCreate()
  }
}

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleCreate = async () => {
    if ((isGroup && (selectedUsers.length < 1 || !groupName.trim())) || (!isGroup && selectedUsers.length !== 1)) {
      setError(isGroup ? "Grup adı ve en az 1 kişi seçmelisiniz." : "Bir kişi seçmelisiniz.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const members = [currentUser.id, ...selectedUsers]
      const body = isGroup ? { isGroup: true, name: groupName, members } : { isGroup: false, members }

      const res = await axios.post("http://localhost:5005/api/chats/create", body)
      onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || "Sohbet oluşturulamadı. Lütfen tekrar deneyin.")
      console.error("Sohbet oluşturulamadı:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const removeSelectedUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId))
  }

  const getUserById = (userId) => users.find((u) => u._id === userId)

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={window.innerWidth < 600} // Mobilde tam ekran
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          boxShadow: theme.shadows[24],
          overflow: "hidden",
          width: "100vw",
          maxWidth: "100vw",
          minWidth: 0,
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          bgcolor: "primary.main",
          color: "common.white",
          position: "relative",
          fontSize: { xs: "1.1rem", sm: "1.25rem" },
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "common.white", color: "primary.main" }}>
              {step === 1 ? <Add /> : isGroup ? <Group /> : <Person />}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} component="div">
                {step === 1 ? "Yeni Sohbet" : step === 2 ? "Kişi Seç" : "Grup Detayları"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }} component="div">
                {step === 1
                  ? "Sohbet tipini seçin"
                  : step === 2
                    ? `${selectedUsers.length} kişi seçildi`
                    : "Grup bilgilerini girin"}
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={handleClose} sx={{ color: "common.white" }}>
            <Close />
          </IconButton>
        </Box>

        {/* Progress Indicator */}
        <Box sx={{ height: 4, bgcolor: alpha("#ffffff", 0.2) }}>
          <Box
            sx={{
              height: "100%",
              bgcolor: "common.white",
              width: `${(step / (isGroup ? 3 : 2)) * 100}%`,
              transition: "width 0.3s ease-in-out",
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 0 }, minHeight: { xs: 200, sm: 400 } }}>
        {error && (
          <Box sx={{ p: 2 }}>
            <Typography color="error" variant="body2" fontWeight={600} textAlign="center">
              {error}
            </Typography>
          </Box>
        )}
        {step === 1 && (
          <Fade in timeout={300}>
            <Box sx={{ p: { xs: 2, sm: 4 } }}>
              <Typography
                variant="h6"
                fontWeight={600}
                mb={3}
                textAlign="center"
                component="div"
                sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
              >
                Hangi tür sohbet oluşturmak istiyorsunuz?
              </Typography>

              <Stack spacing={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `2px solid ${!isGroup ? theme.palette.primary.main : "transparent"}`,
                    bgcolor: !isGroup ? alpha(theme.palette.primary.main, 0.05) : "transparent",
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      transform: "translateY(-2px)",
                      boxShadow: theme.shadows[4],
                    },
                  }}
                  onClick={() => setIsGroup(false)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "secondary.main" }}>
                      <Person />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600} component="div">
                        Birebir Sohbet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="div">
                        Tek bir kişiyle özel sohbet başlatın
                      </Typography>
                    </Box>
                    <Radio checked={!isGroup} onChange={() => setIsGroup(false)} sx={{ color: "primary.main" }} />
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `2px solid ${isGroup ? theme.palette.primary.main : "transparent"}`,
                    bgcolor: isGroup ? alpha(theme.palette.primary.main, 0.05) : "transparent",
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      transform: "translateY(-2px)",
                      boxShadow: theme.shadows[4],
                    },
                  }}
                  onClick={() => setIsGroup(true)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      <Group />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={600} component="div">
                        Grup Sohbeti
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="div">
                        Birden fazla kişiyle grup oluşturun
                      </Typography>
                    </Box>
                    <Radio checked={isGroup} onChange={() => setIsGroup(true)} sx={{ color: "primary.main" }} />
                  </Box>
                </Paper>
              </Stack>
            </Box>
          </Fade>
        )}

        {step === 2 && (
          <Fade in timeout={300}>
            <Box>
              <Box sx={{ p: 3, pb: 0 }}>
                <TextField
                  fullWidth
                  placeholder="Kişi ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                />
              </Box>

              {selectedUsers.length > 0 && (
                <Box sx={{ p: 3, pb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1} component="div">
                    Seçilen Kişiler ({selectedUsers.length})
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                    {selectedUsers.map((userId) => {
                      const user = getUserById(userId)
                      return user ? (
                        <Chip
                          key={userId}
                          avatar={<Avatar sx={{ bgcolor: "primary.main" }}>{user.displayName.charAt(0)}</Avatar>}
                          label={user.displayName}
                          onDelete={() => removeSelectedUser(userId)}
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            "& .MuiChip-deleteIcon": {
                              color: "primary.main",
                            },
                          }}
                        />
                      ) : null
                    })}
                  </Stack>
                </Box>
              )}

              <Divider />

              <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                {filteredUsers.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary" component="div">
                      {searchQuery ? "Kullanıcı bulunamadı" : "Kullanıcı yok"}
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {filteredUsers.map((user, index) => (
                      <Slide in timeout={200 + index * 50} key={user._id}>
                        <ListItemButton
                          onClick={() => handleUserSelect(user._id)}
                          sx={{
                            py: 2,
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "secondary.main" }}>
                              {user.displayName.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>

                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight={600} component="div">
                                {user.displayName}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary" component="div">
                                @{user.username}
                              </Typography>
                            }
                          />

                          {isGroup ? (
                            <Checkbox checked={selectedUsers.includes(user._id)} sx={{ color: "primary.main" }} />
                          ) : (
                            <Radio checked={selectedUsers.includes(user._id)} sx={{ color: "primary.main" }} />
                          )}
                        </ListItemButton>
                      </Slide>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          </Fade>
        )}

        {step === 3 && isGroup && (
          <Fade in timeout={300}>
            <Box sx={{ p: 4 }}>
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Box sx={{ position: "relative", display: "inline-block" }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: "primary.main",
                      fontSize: "2rem",
                      fontWeight: 700,
                      boxShadow: theme.shadows[4],
                    }}
                  >
                    {groupName.charAt(0).toUpperCase() || <Group fontSize="large" />}
                  </Avatar>
                  <IconButton
                    sx={{
                      position: "absolute",
                      bottom: -5,
                      right: -5,
                      bgcolor: "background.paper",
                      boxShadow: theme.shadows[2],
                      "&:hover": { bgcolor: "background.paper" },
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 20, color: "primary.main" }} />
                  </IconButton>
                </Box>
              </Box>

              <TextField
                label="Grup Adı"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton>
                        <EmojiEmotions sx={{ color: "primary.main" }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />

              <Typography variant="subtitle2" color="text.secondary" mb={2} component="div">
                Grup Üyeleri ({selectedUsers.length + 1})
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2,
                  maxHeight: 150,
                  overflowY: "auto",
                }}
              >
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                      {currentUser.displayName?.charAt(0) || currentUser.username?.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" component="div">
                      {currentUser.displayName || currentUser.username} (Sen)
                    </Typography>
                    <Chip label="Admin" size="small" color="primary" />
                  </Box>

                  {selectedUsers.map((userId) => {
                    const user = getUserById(userId)
                    return user ? (
                      <Box key={userId} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
                          {user.displayName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" component="div">
                          {user.displayName}
                        </Typography>
                      </Box>
                    ) : null
                  })}
                </Stack>
              </Paper>
            </Box>
          </Fade>
        )}
      </DialogContent>

      <DialogActions sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Button onClick={step === 1 ? handleClose : handleBack} disabled={loading} sx={{ fontWeight: 600 }}>
            {step === 1 ? "İptal" : "Geri"}
          </Button>

          <Button
            onClick={handleNext}
            variant="contained"
            disabled={loading || (step === 2 && selectedUsers.length === 0) || (step === 3 && !groupName.trim())}
            sx={{
              fontWeight: 600,
              px: 4,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              "&:hover": {
                boxShadow: theme.shadows[4],
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : step === 1 ? (
              "Devam Et"
            ) : step === 2 && !isGroup ? (
              "Sohbet Oluştur"
            ) : step === 2 ? (
              "Devam Et"
            ) : (
              "Grup Oluştur"
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default CreateChatModal
