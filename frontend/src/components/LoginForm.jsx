// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Divider, Link } from '@mui/material';

const LoginForm = ({ onLogin, onNavigateToRegister }) => {
  const [form, setForm] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(form);
  };

  const handleRegisterClick = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    }
  };

  const handleForgotPassword = () => {
    console.log('Şifremi unuttum tıklandı');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'custom.two',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: { xs: 3, sm: 4, md: 5 },
          bgcolor: 'background.paper',
          borderRadius: 3,
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Box textAlign="center" mb={4}>
          <Typography 
            variant="h4" 
            component="h1" 
            color="primary.main" 
            fontWeight={700} 
            mb={1}
            sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}
          >
            Hoş Geldiniz
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            Hesabınıza giriş yapın
          </Typography>
        </Box>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <Box mb={3}>
            <TextField
              label="Kullanıcı Adı"
              name="username"
              value={form.username}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'primary.light',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'primary.main',
                },
              }}
            />
          </Box>

          <Box mb={4}>
            <TextField
              label="Şifre"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              size="medium"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'primary.light',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'primary.main',
                },
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{
              py: 1.8,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              mb: 3,
              boxShadow: '0px 4px 12px rgba(113, 201, 206, 0.3)',
              '&:hover': {
                boxShadow: '0px 6px 16px rgba(113, 201, 206, 0.4)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Giriş Yap
          </Button>
        </form>

        <Box textAlign="center" mb={3}>
          <Link
            href="#"
            onClick={handleForgotPassword}
            underline="hover"
            color="primary.main"
            sx={{
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Şifremi Unuttum?
          </Link>
        </Box>

        {/* Divider */}
        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            veya
          </Typography>
        </Divider>

        {/* Register Section */}
        <Box textAlign="center">
          <Typography variant="body1" color="text.secondary" mb={2} fontWeight={500}>
            Henüz hesabınız yok mu?
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            size="large"
            onClick={handleRegisterClick}
            sx={{
              py: 1.8,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                backgroundColor: 'primary.main',
                color: 'white',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Kayıt Ol
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;