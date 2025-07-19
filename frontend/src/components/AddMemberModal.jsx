"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
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
  TextField,
  Divider,
  Slide,
  CircularProgress,
  useTheme,
  alpha,
  Stack,
  Alert,
} from "@mui/material"
import { Search, Close, PersonAdd, Check, Warning, People } from "@mui/icons-material"
import axios from "axios"

const AddMemberModal = ({ open, onClose, chat, currentUser, onMembersAdded }) => {
  const theme = useTheme()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && chat) {
      setLoading(true)
      setError("")

      axios
        .get("http://localhost:5005/api/users")
        .then((res) => {
    
          const notInGroup = res.data.filter((u) => !chat.members.includes(u._id) && u._id !== currentUser.id)
          setUsers(notInGroup)
          setFilteredUsers(notInGroup)
        })
        .catch((err) => {
          setUsers([])
          setFilteredUsers([])
          setError("Kullanıcılar yüklenirken hata oluştu")
        })
        .finally(() => {
          setLoading(false)
        })

      setSelectedUsers([])
      setSearchQuery("")
    }
  }, [open, chat, currentUser.id]) // Updated dependency list

  // Arama filtresi
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

  // Kullanıcı seçimini yönet
  const handleUserSelect = (userId) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const removeSelectedUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId))
  }

  const getUserById = (userId) => users.find((u) => u._id === userId)

  const handleAdd = async () => {
    if (selectedUsers.length === 0) {
      setError("En az bir kullanıcı seçmelisiniz.")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Paralel olarak tüm kullanıcıları ekle
      const promises = selectedUsers.map((userId) =>
        axios.post(`http://localhost:5005/api/chats/${chat._id}/add-member`, { userId }),
      )

      await Promise.all(promises)
      onMembersAdded(selectedUsers)
      onClose()
    } catch (err) {
      setError("Üyeler eklenirken hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }


  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={window.innerWidth < 600}
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
      {/* Header */}
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
              <PersonAdd />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} component="div">
                Gruba Üye Ekle
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }} component="div">
                {chat?.name || "Grup"} • {selectedUsers.length} kişi seçildi
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={handleClose} sx={{ color: "common.white" }} disabled={loading}>
            <Close />
          </IconButton>
        </Box>
        {loading && (
          <Box sx={{ height: 4, bgcolor: alpha("#ffffff", 0.2) }}>
            <Box
              sx={{
                height: "100%",
                bgcolor: "common.white",
                width: "100%",
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 1 },
                  "50%": { opacity: 0.5 },
                  "100%": { opacity: 1 },
                },
              }}
            />
          </Box>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, sm: 0 }, minHeight: { xs: 200, sm: 400 } }}>
     
        {error && (
          <Box sx={{ p: 3, pb: 0 }}>
            <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        <Box sx={{ p: 3, pb: error ? 3 : 0 }}>
          <TextField
            fullWidth
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
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
              Seçilen Kullanıcılar ({selectedUsers.length})
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
                    disabled={loading}
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

        {selectedUsers.length > 0 && <Divider />}

        {loading && users.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary" component="div">
              Kullanıcılar yükleniyor...
            </Typography>
          </Box>
        ) : users.length === 0 ? (
 
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                mx: "auto",
                mb: 2,
              }}
            >
              <People fontSize="large" />
            </Avatar>
            <Typography variant="h6" fontWeight={600} mb={1} component="div">
              Eklenebilecek Kullanıcı Yok
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              Tüm kullanıcılar zaten bu grupta bulunuyor.
            </Typography>
          </Box>
        ) : (
  
          <Box sx={{ maxHeight: 350, overflowY: "auto" }}>
            {filteredUsers.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: "warning.main",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <Warning />
                </Avatar>
                <Typography variant="body1" color="text.secondary" component="div">
                  "{searchQuery}" için kullanıcı bulunamadı
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredUsers.map((user, index) => (
                  <Slide in timeout={200 + index * 50} key={user._id}>
                    <ListItemButton
                      onClick={() => handleUserSelect(user._id)}
                      disabled={loading}
                      sx={{
                        py: 2,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        },
                        "&.Mui-disabled": {
                          opacity: 0.6,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: selectedUsers.includes(user._id) ? "primary.main" : "secondary.main",
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          {selectedUsers.includes(user._id) ? <Check /> : user.displayName.charAt(0).toUpperCase()}
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

                      <Checkbox
                        checked={selectedUsers.includes(user._id)}
                        disabled={loading}
                        sx={{
                          color: "primary.main",
                          "&.Mui-checked": {
                            color: "primary.main",
                          },
                        }}
                      />
                    </ListItemButton>
                  </Slide>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

    
      <DialogActions sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <Box>
            {selectedUsers.length > 0 && (
              <Typography variant="body2" color="text.secondary" component="div">
                {selectedUsers.length} kullanıcı seçildi
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={handleClose} disabled={loading} sx={{ fontWeight: 600 }}>
              İptal
            </Button>

            <Button
              onClick={handleAdd}
              variant="contained"
              disabled={loading || selectedUsers.length === 0 || users.length === 0}
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
                <>
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                  Ekleniyor...
                </>
              ) : (
                `${selectedUsers.length > 0 ? `${selectedUsers.length} Kişiyi ` : ""}Ekle`
              )}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default AddMemberModal
