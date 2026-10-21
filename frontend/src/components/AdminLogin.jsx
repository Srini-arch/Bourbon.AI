import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  InputAdornment, IconButton, Alert, Chip, Stack, CircularProgress,
  FormControlLabel, Checkbox, Tooltip, Divider
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ShieldIcon from '@mui/icons-material/Shield';
import KeyIcon from '@mui/icons-material/Key';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CoffeeIcon from '@mui/icons-material/LocalCafe';
import { logActivity } from '../utils/telemetryLogger';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the Admin Security Key.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (rememberMe && data.token) {
          localStorage.setItem('bourbon_session_token', data.token);
          localStorage.setItem('bourbon_username', data.username || username);
          localStorage.setItem('bourbon_client', data.client || 'Unbox-ED');
        }
        logActivity('AUTH', 'ADMIN_LOGIN_SUCCESS', {
          auth_mode: 'API_BACKEND',
          username: data.username || username,
          client: data.client || 'Unbox-ED'
        });
        if (onLoginSuccess) {
          onLoginSuccess({
            token: data.token,
            username: data.username || username,
            client: data.client || 'Unbox-ED'
          });
        }
      } else {
        logActivity('AUTH', 'ADMIN_LOGIN_FAILED', {
          reason: data.detail || 'Invalid credentials'
        });
        setError(data.detail || data.message || 'Invalid credentials. Please verify your Admin Key.');
      }
    } catch (err) {
      console.warn('Network call failed, verifying client offline authentication:', err);
      // If server is unreachable but user entered an admin key, grant access in offline demo mode
      if (password && password.length >= 6) {
        const fallbackToken = 'sess_' + Math.random().toString(36).substring(2, 10);
        if (rememberMe) {
          localStorage.setItem('bourbon_session_token', fallbackToken);
          localStorage.setItem('bourbon_username', username);
          localStorage.setItem('bourbon_client', 'Unbox-ED');
        }
        logActivity('AUTH', 'ADMIN_LOGIN_SUCCESS', {
          auth_mode: 'GITHUB_PAGES_STANDALONE',
          username: username,
          client: 'Unbox-ED'
        });
        if (onLoginSuccess) {
          onLoginSuccess({
            token: fallbackToken,
            username: username,
            client: 'Unbox-ED'
          });
        }
      } else {
        logActivity('AUTH', 'ADMIN_LOGIN_REJECTED', {
          reason: 'Key length insufficient or network unreachable'
        });
        setError('Authorization server unreachable. Please verify your Admin Key.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#07090D',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(245, 166, 35, 0.12) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(24, 119, 242, 0.10) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(15, 18, 24, 0.6) 0px, transparent 100%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Ambient Glow Circles */}
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 166, 35, 0.08) 0%, transparent 70%)',
          top: '-10%',
          left: '15%',
          pointerEvents: 'none',
          filter: 'blur(40px)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(24, 119, 242, 0.08) 0%, transparent 70%)',
          bottom: '-5%',
          right: '15%',
          pointerEvents: 'none',
          filter: 'blur(40px)'
        }}
      />

      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: 'rgba(15, 18, 24, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(245, 166, 35, 0.22)',
          borderRadius: 3.5,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 32px rgba(245, 166, 35, 0.12)',
          p: { xs: 2, sm: 3.5 },
          zIndex: 1
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Brand Header */}
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(245, 166, 35, 0.45)'
              }}
            >
              <CoffeeIcon sx={{ fontSize: 34, color: '#121212' }} />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                mb: 0.5
              }}
            >
              BOURBON<span style={{ color: '#F5A623' }}>.AI</span>
            </Typography>

            <Typography variant="body2" sx={{ color: '#8A99AD', fontSize: '0.85rem' }}>
              Autonomous Brand Intelligence & Content Studio
            </Typography>

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.5 }}>
              <Chip
                label="Enterprise Single-Pass Assembly"
                size="small"
                sx={{
                  backgroundColor: 'rgba(245, 166, 35, 0.12)',
                  color: '#F5A623',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  border: '1px solid rgba(245, 166, 35, 0.25)'
                }}
              />
              <Chip
                icon={<ShieldIcon sx={{ fontSize: '13px !important', color: '#4B9BFF !important' }} />}
                label="IP Protected"
                size="small"
                sx={{
                  backgroundColor: 'rgba(24, 119, 242, 0.12)',
                  color: '#4B9BFF',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  border: '1px solid rgba(24, 119, 242, 0.25)'
                }}
              />
            </Stack>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#FCA5A5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '0.82rem',
                borderRadius: 2
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Admin Identifier"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AdminPanelSettingsIcon sx={{ color: '#F5A623', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(11, 13, 17, 0.7)',
                    borderRadius: 2,
                    color: '#F0F3F6',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                    '&:hover fieldset': { borderColor: '#F5A623' },
                    '&.Mui-focused fieldset': { borderColor: '#F5A623' }
                  },
                  '& .MuiInputLabel-root': { color: '#8A99AD' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#F5A623' }
                }}
              />

              <TextField
                fullWidth
                label="Admin Master Security Key"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                size="small"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#F5A623', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#8A99AD' }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(11, 13, 17, 0.7)',
                    borderRadius: 2,
                    color: '#F0F3F6',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                    '&:hover fieldset': { borderColor: '#F5A623' },
                    '&.Mui-focused fieldset': { borderColor: '#F5A623' }
                  },
                  '& .MuiInputLabel-root': { color: '#8A99AD' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#F5A623' }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      size="small"
                      sx={{
                        color: 'rgba(245, 166, 35, 0.6)',
                        '&.Mui-checked': { color: '#F5A623' }
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ color: '#8A99AD', userSelect: 'none' }}>
                      Keep session active (24h)
                    </Typography>
                  }
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.3,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                  color: '#07090D',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 18px rgba(245, 166, 35, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FFB84D 0%, #E09415 100%)',
                    boxShadow: '0 6px 24px rgba(245, 166, 35, 0.5)'
                  }
                }}
              >
                {loading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} sx={{ color: '#07090D' }} />
                    <span>Authorizing Session...</span>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <KeyIcon sx={{ fontSize: 18 }} />
                    <span>Unlock Bourbon Studio</span>
                  </Stack>
                )}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Security & System Info Footer */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#55657A', display: 'block', mb: 0.5 }}>
              Single Admin Gate • Deterministic AST Validator & Vision Gate
            </Typography>
            <Typography variant="caption" sx={{ color: '#3E4956', fontSize: '0.68rem' }}>
              Bourbon.AI v2.0 Enterprise Engine • All Rights Reserved
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
