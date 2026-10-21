import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  TextField, Button, Grid, Stack, Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function ClientRegistrationModal({ open, onClose, onClientCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Edtech',
    username: '',
    password: '',
    brand_voice: 'Empathetic & Kind',
    brand_vision: 'Holistic Future Leaders',
    brand_mission: 'Empowering students through critical 21st-century experiential skills.',
    brand_focus: 'Speaking, Writing, and Financial Literacy',
    brand_messaging: 'Real-world practical breakthroughs outside traditional rote learning.',
    cta_preference: 'Book a Free Demo',
    target_audience: 'Parents, Guardians, Educators',
    donts: 'Do not praise rote learning.\nDo not use corporate buzzwords.',
    products: 'Orator Masterclass, Writing Studio, Financial Literacy',
    services: '1:1 Mentorship, Small Group Cohorts'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) {
      setError('Brand Name, Username, and Password are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        industry: formData.industry,
        username: formData.username.trim(),
        password: formData.password.trim(),
        brand_voice: formData.brand_voice,
        brand_vision: formData.brand_vision,
        brand_mission: formData.brand_mission,
        brand_focus: formData.brand_focus,
        brand_messaging: formData.brand_messaging,
        cta_preference: formData.cta_preference,
        target_audience: formData.target_audience.split(',').map(s => s.trim()).filter(Boolean),
        donts: formData.donts.split('\n').map(s => s.trim()).filter(Boolean),
        products: formData.products.split(',').map(s => s.trim()).filter(Boolean),
        services: formData.services.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await fetch(`${API_BASE}/api/clients/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'ok') {
        throw new Error(data.detail || 'Failed to register brand');
      }

      onClientCreated(formData.name.trim());
      onClose();
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to register client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#0F1218',
          border: '1px solid rgba(245, 166, 35, 0.3)',
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon sx={{ color: '#F5A623' }} /> ➕ Register & Provision New Multi-Tenant Brand
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack spacing={2} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Brand Name"
                placeholder="e.g. StemAcademy"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Industry</InputLabel>
                <Select
                  value={formData.industry}
                  label="Industry"
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                >
                  <MenuItem value="Edtech">Edtech</MenuItem>
                  <MenuItem value="Fintech">Fintech</MenuItem>
                  <MenuItem value="Enterprise SaaS">Enterprise SaaS</MenuItem>
                  <MenuItem value="Healthcare">Healthcare</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Admin Username"
                placeholder="e.g. stem_admin"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="password"
                label="Admin Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Brand Focus"
                value={formData.brand_focus}
                onChange={(e) => setFormData({ ...formData, brand_focus: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Primary CTA"
                value={formData.cta_preference}
                onChange={(e) => setFormData({ ...formData, cta_preference: e.target.value })}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Brand Mission"
            value={formData.brand_mission}
            onChange={(e) => setFormData({ ...formData, brand_mission: e.target.value })}
          />

          <TextField
            fullWidth
            size="small"
            label="Commercial Offerings / Products (comma separated)"
            value={formData.products}
            onChange={(e) => setFormData({ ...formData, products: e.target.value })}
          />

          <TextField
            fullWidth
            size="small"
            label="Target Audience (comma separated)"
            value={formData.target_audience}
            onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
          />

          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Brand Don'ts / Negative Constraints (one per line)"
            value={formData.donts}
            onChange={(e) => setFormData({ ...formData, donts: e.target.value })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: '#94A3B8' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ fontWeight: 800, px: 3 }}
        >
          {loading ? 'Provisioning Brand...' : '🚀 Provision Brand & Vector Memory'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
