// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Divider, Link } from '@mui/material';

const RegisterForm = ({ onRegister, onNavigateToLogin }) => {
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    password: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(form);
  };

  const handleLoginClick = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'custom.one',
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
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography 
            variant="h4" 
            component="h1" 
            color="primary.main" 
            fontWeight={700} 
            mb={1}
            sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}
          >
            Hesap Oluşturun
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            Yeni hesabınızı oluşturun
          </Typography>
        </Box>

        {/* Register Form */}
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

          <Box mb={3}>
            <TextField
              label="Ad Soyad"
              name="displayName"
              value={form.displayName}
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

          <Box mb={3}>
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
              mb: 4,
              boxShadow: '0px 4px 12px rgba(113, 201, 206, 0.3)',
              '&:hover': {
                boxShadow: '0px 6px 16px rgba(113, 201, 206, 0.4)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Hesap Oluştur
          </Button>
        </form>

        {/* Login Link - Sadece text link olarak */}
        <Box textAlign="center" mt={3}>
          <Typography variant="body1" color="text.secondary" mb={2} fontWeight={500}>
            Zaten hesabınız var mı?
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            size="large"
            onClick={handleLoginClick}
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
            Giriş Yap
          </Button>
        </Box>

        {/* Terms and Privacy */}
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
            Kayıt olarak{' '}
            <Link href="#" color="primary.main" underline="hover" sx={{ fontWeight: 500 }}>
              Kullanım Şartları
            </Link>
            {' '}ve{' '}
            <Link href="#" color="primary.main" underline="hover" sx={{ fontWeight: 500 }}>
              Gizlilik Politikası
            </Link>
            'nı kabul etmiş olursunuz.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterForm;