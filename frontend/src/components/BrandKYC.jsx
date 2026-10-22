import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, Slider, Stack,
  Chip, Alert, Divider, Tab, Tabs, Card, CardContent, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PaletteIcon from '@mui/icons-material/Palette';
import SecurityIcon from '@mui/icons-material/Security';
import StarIcon from '@mui/icons-material/Star';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';

import RefreshIcon from '@mui/icons-material/Refresh';
import { UNBOX_ED_BRAND_DATA } from '../data/defaultBrandData';
import { logActivity } from '../utils/telemetryLogger';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function BrandKYC({ clientData, onRefresh }) {
  const [activeTab, setActiveTab] = useState(0);

  // Helper to load initial state from localStorage or default dossier
  const getInitialFormData = () => {
    try {
      const saved = localStorage.getItem(`bourbon_kyc_${clientData?.name || 'Unbox-ED'}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
    if (clientData && clientData.brand_vision) {
      return clientData;
    }
    return UNBOX_ED_BRAND_DATA;
  };

  // Form State
  const [formData, setFormData] = useState(getInitialFormData);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Temporary inputs for quick adds
  const [newConstraint, setNewConstraint] = useState('');
  const [newAudience, setNewAudience] = useState('');
  const [newPersona, setNewPersona] = useState('');
  const [newHexColor, setNewHexColor] = useState('#4B9BFF');

  // Synchronize state when clientData prop updates
  useEffect(() => {
    const clientName = clientData?.name || formData.name || 'Unbox-ED';
    try {
      const saved = localStorage.getItem(`bourbon_kyc_${clientName}`);
      if (saved) {
        setFormData(JSON.parse(saved));
        return;
      }
    } catch (_) {}

    const source = (clientData && clientData.brand_vision) ? clientData : UNBOX_ED_BRAND_DATA;

    // Normalize USPs products
    const rawProducts = source.usps?.products || [];
    const normalizedProducts = rawProducts.map((p, idx) => {
      if (typeof p === 'string') {
        return { id: `prod_${idx}`, name: p, target_segment: '', key_outcome: '' };
      }
      return {
        id: p.id || `prod_${idx}`,
        name: p.name || 'Product Offering',
        target_segment: p.target_segment || p.student_age_group || '',
        key_outcome: p.key_outcome || p.outcome || ''
      };
    });

    // Normalize Services
    const rawServices = source.usps?.services || [];
    const normalizedServices = rawServices.map((s, idx) => {
      if (typeof s === 'string') {
        return { id: `srv_${idx}`, name: s, delivery_model: '' };
      }
      return {
        id: s.id || `srv_${idx}`,
        name: s.name || 'Service Offering',
        delivery_model: s.delivery_model || s.description || ''
      };
    });

    // Normalize IPs
    const rawIps = source.usps?.ips || [];
    const normalizedIps = rawIps.map((ip, idx) => {
      if (typeof ip === 'string') {
        return { id: `ip_${idx}`, name: ip, description: '' };
      }
      return {
        id: ip.id || `ip_${idx}`,
        name: ip.name || ip.title || 'Proprietary IP',
        description: ip.description || ip.methodology || ''
      };
    });

    // Normalize Micro-KB
    const rawMicroKb = source.micro_kb && source.micro_kb.length > 0 ? source.micro_kb : UNBOX_ED_BRAND_DATA.micro_kb;
    const normalizedMicroKb = rawMicroKb.map((f, idx) => ({
      id: f.id || `fact_${idx}`,
      title: f.title || `Key Fact #${idx + 1}`,
      fact: f.fact || f.core_fact || '',
      proof_metric: f.proof_metric || f.metric || '',
      category: f.category || 'General'
    }));

    // Normalize Visual Config
    const rawVc = source.visual_config || {};
    let palette = ['#FFFFFF', '#0B132B', '#F5A623', '#1C2541'];
    if (rawVc.palette_hexes && rawVc.palette_hexes.length > 0) {
      palette = rawVc.palette_hexes;
    }

    const disallowed = rawVc.disallowed_visual_elements && rawVc.disallowed_visual_elements.length > 0
      ? rawVc.disallowed_visual_elements
      : UNBOX_ED_BRAND_DATA.visual_config.disallowed_visual_elements;

    setFormData({
      name: source.name || 'Unbox-ED',
      industry: source.industry || 'EdTech / 21st-Century Experiential Learning',
      brand_vision: source.brand_vision || UNBOX_ED_BRAND_DATA.brand_vision,
      brand_mission: source.brand_mission || UNBOX_ED_BRAND_DATA.brand_mission,
      brand_focus: source.brand_focus || UNBOX_ED_BRAND_DATA.brand_focus,
      brand_messaging: source.brand_messaging || UNBOX_ED_BRAND_DATA.brand_messaging,
      brand_voice: source.brand_voice || UNBOX_ED_BRAND_DATA.brand_voice,
      tone_formality: source.tone_formality !== undefined ? source.tone_formality : 5,
      market_trajectory: source.market_trajectory || 'High Growth / Modern Disruptor',
      cta_preference: source.cta_preference || 'Book a Free Demo',
      target_audience: source.target_audience || UNBOX_ED_BRAND_DATA.target_audience,
      audience_personas: source.audience_personas || UNBOX_ED_BRAND_DATA.audience_personas,
      donts: source.donts || UNBOX_ED_BRAND_DATA.donts,
      narrative_hooks: source.narrative_hooks || UNBOX_ED_BRAND_DATA.narrative_hooks,
      usps: {
        products: normalizedProducts.length > 0 ? normalizedProducts : UNBOX_ED_BRAND_DATA.usps.products,
        services: normalizedServices.length > 0 ? normalizedServices : UNBOX_ED_BRAND_DATA.usps.services,
        ips: normalizedIps.length > 0 ? normalizedIps : UNBOX_ED_BRAND_DATA.usps.ips
      },
      micro_kb: normalizedMicroKb,
      visual_config: {
        palette_hexes: palette,
        preferred_engine: rawVc.preferred_engine || 'flux',
        art_medium: rawVc.art_medium || UNBOX_ED_BRAND_DATA.visual_config.art_medium,
        tone_lighting: rawVc.tone_lighting || UNBOX_ED_BRAND_DATA.visual_config.tone_lighting,
        art_perspective: rawVc.art_perspective || UNBOX_ED_BRAND_DATA.visual_config.art_perspective,
        art_framing: rawVc.art_framing || UNBOX_ED_BRAND_DATA.visual_config.art_framing,
        env_background: rawVc.env_background || UNBOX_ED_BRAND_DATA.visual_config.env_background,
        env_subjects: rawVc.env_subjects || UNBOX_ED_BRAND_DATA.visual_config.env_subjects,
        demographics_instruction: rawVc.demographics_instruction || UNBOX_ED_BRAND_DATA.visual_config.demographics_instruction,
        disallowed_visual_elements: disallowed
      }
    });
  }, [clientData]);

  const handleSave = async () => {
    setSaving(true);
    const originalClientId = clientData?.name || formData.name;

    // 1. Immediately persist to localStorage for seamless offline & session persistence
    try {
      localStorage.setItem(`bourbon_kyc_${formData.name}`, JSON.stringify(formData));
      localStorage.setItem('bourbon_kyc_Unbox-ED', JSON.stringify(formData));
      logActivity('KYC', 'BRAND_DOSSIER_SAVED', {
        brand: formData.name,
        products_count: formData.usps?.products?.length || 0,
        services_count: formData.usps?.services?.length || 0,
        micro_kb_count: formData.micro_kb?.length || 0
      });
    } catch (_) {}

    // 2. Dispatch to backend API if available
    try {
      const res = await fetch(`${API_BASE}/api/clients/${encodeURIComponent(originalClientId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setMsg({ type: 'success', text: `✅ ${data.message || 'Brand KYC & Micro-KB Dossier saved successfully!'}` });
        if (onRefresh) onRefresh(formData.name);
      } else {
        setMsg({ type: 'success', text: '✅ Brand KYC & Micro-KB Dossier saved to local browser storage.' });
      }
    } catch (err) {
      setMsg({ type: 'success', text: '✅ Brand KYC & Micro-KB Dossier saved successfully to local browser storage!' });
    } finally {
      setSaving(false);
    }
  };

  // --- USP CRUD HANDLERS ---
  const handleAddProduct = () => {
    const newProd = {
      id: `prod_${Date.now()}`,
      name: 'New Product / Module',
      target_segment: 'Key Demographics',
      key_outcome: 'Measurable Student or Customer Outcome'
    };
    setFormData(prev => ({
      ...prev,
      usps: { ...prev.usps, products: [...prev.usps.products, newProd] }
    }));
  };

  const handleUpdateProduct = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      usps: {
        ...prev.usps,
        products: prev.usps.products.map(p => p.id === id ? { ...p, [field]: value } : p)
      }
    }));
  };

  const handleDeleteProduct = (id) => {
    setFormData(prev => ({
      ...prev,
      usps: {
        ...prev.usps,
        products: prev.usps.products.filter(p => p.id !== id)
      }
    }));
  };

  // Services
  const handleAddService = () => {
    const newSrv = {
      id: `srv_${Date.now()}`,
      name: 'Specialized Service Offering',
      delivery_model: 'Direct Consultation & Small-Group Delivery'
    };
    setFormData(prev => ({
      ...prev,
      usps: { ...prev.usps, services: [...prev.usps.services, newSrv] }
    }));
  };

  const handleUpdateService = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      usps: {
        ...prev.usps,
        services: prev.usps.services.map(s => s.id === id ? { ...s, [field]: value } : s)
      }
    }));
  };

  const handleDeleteService = (id) => {
    setFormData(prev => ({
      ...prev,
      usps: {
        ...prev.usps,
        services: prev.usps.services.filter(s => s.id !== id)
      }
    }));
  };

  // Proprietary IPs
  const handleAddIp = () => {
    const newIp = {
      id: `ip_${Date.now()}`,
      name: 'Proprietary Methodology or Framework',
      description: 'Unique IP differentiator not available anywhere else in market'
    };
    setFormData(prev => ({
      ...prev,
      usps: { ...prev.usps, ips: [...prev.usps.ips, newIp] }
    }));
  };

  const handleUpdateIp = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      usps: {
        ...prev.usps,
        ips: prev.usps.ips.map(ip => ip.id === id ? { ...ip, [field]: value } : ip)
      }
    }));
  };

  const handleDeleteIp = (id) => {
    setFormData(prev => ({
      ...prev,
      usps: {
        ...prev.usps,
        ips: prev.usps.ips.filter(ip => ip.id !== id)
      }
    }));
  };

  // --- MICRO-KB (SHORT KB) CRUD HANDLERS ---
  const handleAddMicroKbFact = () => {
    const newFact = {
      id: `fact_${Date.now()}`,
      title: 'Verified Fact / Milestone Hook',
      fact: 'Clear, verifiable statement of truth or statistical finding that ground LLM generations.',
      proof_metric: '98% Success Rate',
      category: 'Evidence'
    };
    setFormData(prev => ({
      ...prev,
      micro_kb: [...prev.micro_kb, newFact]
    }));
  };

  const handleUpdateMicroKbFact = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      micro_kb: prev.micro_kb.map(f => f.id === id ? { ...f, [field]: value } : f)
    }));
  };

  const handleDeleteMicroKbFact = (id) => {
    setFormData(prev => ({
      ...prev,
      micro_kb: prev.micro_kb.filter(f => f.id !== id)
    }));
  };

  // Constraints & Target Audience
  const handleAddConstraint = () => {
    if (!newConstraint.trim()) return;
    setFormData(prev => ({
      ...prev,
      donts: [...prev.donts, newConstraint.trim()]
    }));
    setNewConstraint('');
  };

  const handleDeleteConstraint = (index) => {
    setFormData(prev => ({
      ...prev,
      donts: prev.donts.filter((_, idx) => idx !== index)
    }));
  };

  const handleAddAudience = () => {
    if (!newAudience.trim()) return;
    setFormData(prev => ({
      ...prev,
      target_audience: [...(prev.target_audience || []), newAudience.trim()]
    }));
    setNewAudience('');
  };

  const handleDeleteAudience = (index) => {
    setFormData(prev => ({
      ...prev,
      target_audience: (prev.target_audience || []).filter((_, idx) => idx !== index)
    }));
  };

  const handleAddPersona = () => {
    if (!newPersona.trim()) return;
    setFormData(prev => ({
      ...prev,
      audience_personas: [...(prev.audience_personas || []), newPersona.trim()]
    }));
    setNewPersona('');
  };

  const handleDeletePersona = (index) => {
    setFormData(prev => ({
      ...prev,
      audience_personas: (prev.audience_personas || []).filter((_, idx) => idx !== index)
    }));
  };

  // Palette Swatches
  const handleAddColor = () => {
    if (!newHexColor || !newHexColor.startsWith('#')) return;
    const current = formData.visual_config?.palette_hexes || [];
    if (!current.includes(newHexColor)) {
      setFormData(prev => ({
        ...prev,
        visual_config: {
          ...prev.visual_config,
          palette_hexes: [...current, newHexColor]
        }
      }));
    }
  };

  const handleDeleteColor = (hex) => {
    setFormData(prev => ({
      ...prev,
      visual_config: {
        ...prev.visual_config,
        palette_hexes: (prev.visual_config?.palette_hexes || []).filter(c => c !== hex)
      }
    }));
  };

  // Image Agent Form State & Handlers
  const [newDisallowed, setNewDisallowed] = useState('');
  const [testScenePrompt, setTestScenePrompt] = useState('A confident student presenting an idea at a wooden desk with books');
  const [inspectorTab, setInspectorTab] = useState(0); // 0: FLUX, 1: Gemini
  const [copied, setCopied] = useState(false);

  const handleUpdateVisualConfig = (field, value) => {
    setFormData(prev => ({
      ...prev,
      visual_config: {
        ...(prev.visual_config || {}),
        [field]: value
      }
    }));
  };

  const handleAddDisallowed = (tokenToAdd) => {
    const token = (tokenToAdd || newDisallowed).trim();
    if (!token) return;
    const current = formData.visual_config?.disallowed_visual_elements || [];
    if (!current.includes(token)) {
      handleUpdateVisualConfig('disallowed_visual_elements', [...current, token]);
    }
    setNewDisallowed('');
  };

  const handleDeleteDisallowed = (index) => {
    const current = formData.visual_config?.disallowed_visual_elements || [];
    handleUpdateVisualConfig('disallowed_visual_elements', current.filter((_, idx) => idx !== index));
  };

  const handleCopyPrompt = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Live Prompt Generation Helpers (Demonstrates strict text & logo suppression)
  const getFluxPromptPreview = () => {
    let clean = (testScenePrompt || 'A confident student presenting an idea')
      .replace(/["'][^"']*["']/g, '')
      .replace(/\b(headline|sub-headline|callout text|CTA button|typography|sans-serif|serif|bold font|labeled|caption|text|logo|watermark)\b/gi, '')
      .trim();
    if (formData.name) {
      clean = clean.replace(new RegExp(formData.name, 'gi'), '');
    }
    clean = clean.replace(/[,;\-\s]+/g, ' ').replace(/^[,;\-\s]+|[,;\-\s]+$/g, '');
    
    const vc = formData.visual_config || {};
    const medium = vc.art_medium || 'Photorealistic Commercial Photography';
    const lighting = vc.tone_lighting || 'Natural Morning Daylight, Diffused Soft Illumination';
    const perspective = vc.art_perspective || 'Eye-Level 50mm Lens, Shallow Depth of Field';
    const disallowed = (vc.disallowed_visual_elements || []).join(', ');
    const extraDisallowed = disallowed ? `, ${disallowed}` : '';
    
    return `${clean}, ${medium}, ${lighting}, ${perspective}, 1:1 square aspect ratio. STRICT RESTRICTIONS: absolutely no text, no words, no letters, no numbers, no logos, no watermarks, no typography, no cards with writing, no pseudo-signage, pure clean image without any text${extraDisallowed}.`;
  };

  const getGeminiPromptPreview = () => {
    let clean = (testScenePrompt || 'A confident student presenting an idea')
      .replace(/["'][^"']*["']/g, '')
      .replace(/\b(headline|sub-headline|callout text|CTA button|typography|sans-serif|serif|bold font|labeled|caption|text|logo|watermark)\b/gi, '')
      .trim();
    if (formData.name) {
      clean = clean.replace(new RegExp(formData.name, 'gi'), '');
    }
    clean = clean.replace(/[,;\-\s]+/g, ' ').replace(/^[,;\-\s]+|[,;\-\s]+$/g, '');
    
    const vc = formData.visual_config || {};
    const medium = vc.art_medium || 'Photorealistic Commercial Photography';
    const lighting = vc.tone_lighting || 'Natural Morning Daylight, Diffused Soft Illumination';
    const perspective = vc.art_perspective || 'Eye-Level 50mm Lens, Shallow Depth of Field';
    const disallowed = (vc.disallowed_visual_elements || []).join('; ') || 'no readable text, no letters, no words, no numbers, no logos, no watermarks, no cards';

    return `<ROLE_AND_TONE>
You are a specialized commercial photographer and visual artist.
</ROLE_AND_TONE>

<OBJECTIVE>
Create a high-fidelity 1:1 square visual scene.
</OBJECTIVE>

<STRICT_CONSTRAINTS>
1. DO NOT generate ANY text, words, letters, logos, UI cards, or brand names anywhere in the image.
2. Phase 2 Compositing will separately overlay all headlines, typography, badges, and brand logos.
3. Excluded Elements: ${disallowed}
</STRICT_CONSTRAINTS>

<VISUAL_IDENTITY>
- Medium: ${medium}
- Lighting: ${lighting}
- Perspective: ${perspective}
- Industry Context: ${formData.industry}
</VISUAL_IDENTITY>

<SCENE_DESCRIPTION>
${clean}
</SCENE_DESCRIPTION>`;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* HEADER BAR */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#F0F3F6', letterSpacing: '-0.02em' }}>
              🏢 Enterprise Brand KYC & Micro-KB Dossier
            </Typography>
            <Chip
              label={`Active: ${formData.name}`}
              size="small"
              sx={{ backgroundColor: 'rgba(245, 166, 35, 0.15)', color: '#F5A623', fontWeight: 700 }}
            />
          </Box>
          <Typography variant="subtitle1" sx={{ color: '#94A3B8' }}>
            Decoupled sovereign brand architecture, interactive USPs, Micro-KB fact vault, and negative constraints for 50+ client verticals.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => {
              try {
                localStorage.removeItem(`bourbon_kyc_${formData.name}`);
                localStorage.removeItem('bourbon_kyc_Unbox-ED');
              } catch (_) {}
              setFormData(UNBOX_ED_BRAND_DATA);
              setMsg({ type: 'info', text: 'Brand Dossier reset to official Unbox-ED specifications.' });
            }}
            sx={{
              color: '#94A3B8',
              borderColor: 'rgba(255,255,255,0.15)',
              fontSize: '0.78rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { borderColor: '#F5A623', color: '#F5A623' }
            }}
          >
            Reset to Official Unbox-ED
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              fontWeight: 700,
              px: 3,
              background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
              color: '#121212',
              boxShadow: '0 4px 14px rgba(245, 166, 35, 0.4)'
            }}
          >
            {saving ? 'Saving Changes...' : 'Save Brand Dossier'}
          </Button>
        </Stack>
      </Box>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      {/* TOP NAVIGATION TABS */}
      <Paper sx={{ mb: 3, borderRadius: 2, background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.84rem',
              py: 1.8,
              color: '#94A3B8',
              '&.Mui-selected': { color: '#F5A623' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#F5A623', height: 3 }
          }}
        >
          <Tab icon={<BusinessIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Brand DNA & Identity" />
          <Tab icon={<CategoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`2. Hierarchical USPs (${formData.usps.products.length} Products, ${formData.usps.services.length} Services, ${formData.usps.ips.length} IPs)`} />
          <Tab icon={<MenuBookIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={`3. Sovereign Micro-KB (${formData.micro_kb.length} Quick Facts)`} />
          <Tab icon={<PaletteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="4. Visual DNA & Image Agent Engine" />
        </Tabs>
      </Paper>

      {/* ======================================================== */}
      {/* TAB 0: BRAND DNA & IDENTITY                             */}
      {/* ======================================================== */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* CARD 1: BRAND CORE & INDUSTRY */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2.5, color: '#F5A623', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon /> Brand Core & Industry Classification
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  label="Brand / Client Name (Fully Editable)"
                  fullWidth
                  size="small"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  helperText="Primary brand key across content generator and storage."
                />
                <TextField
                  label="Industry Category / Sector"
                  fullWidth
                  size="small"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. EdTech / 21st-Century Experiential Learning"
                />
                <TextField
                  label="Strategic Brand Vision"
                  fullWidth
                  size="small"
                  value={formData.brand_vision}
                  onChange={(e) => setFormData({ ...formData, brand_vision: e.target.value })}
                  placeholder="e.g. Holistic Future Leaders"
                />
                <TextField
                  label="Core Brand Focus / Signature Offering"
                  fullWidth
                  size="small"
                  value={formData.brand_focus}
                  onChange={(e) => setFormData({ ...formData, brand_focus: e.target.value })}
                  placeholder="e.g. Public speaking, creative sensory writing, financial literacy"
                />
                <TextField
                  label="Brand Mission & Strategic Purpose"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.brand_mission}
                  onChange={(e) => setFormData({ ...formData, brand_mission: e.target.value })}
                  placeholder="Comprehensive statement describing mission and core values."
                />
              </Stack>
            </Paper>
          </Grid>

          {/* CARD 2: VOICE, TONE & MESSAGING */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2.5, color: '#F5A623', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LightbulbIcon /> Brand Voice, Messaging & Conversions
              </Typography>
              <Stack spacing={2.5}>
                <TextField
                  label="Brand Voice Descriptor"
                  fullWidth
                  size="small"
                  value={formData.brand_voice}
                  onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
                  placeholder="e.g. Empathetic, Kind & Inspiring"
                />
                <Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tone Formality Scale:</span>
                    <strong>{formData.tone_formality} / 10 ({formData.tone_formality >= 8 ? 'Academic / Executive' : formData.tone_formality >= 5 ? 'Professional / Empathetic' : 'Playful / Conversational'})</strong>
                  </Typography>
                  <Slider
                    value={formData.tone_formality}
                    min={1}
                    max={10}
                    step={1}
                    onChange={(e, val) => setFormData({ ...formData, tone_formality: val })}
                    sx={{ color: '#F5A623', mt: 1 }}
                  />
                </Box>
                <TextField
                  label="Default Lead-Gen Call to Action (CTA)"
                  fullWidth
                  size="small"
                  value={formData.cta_preference}
                  onChange={(e) => setFormData({ ...formData, cta_preference: e.target.value })}
                  placeholder="e.g. Book a Free Demo"
                />
                <TextField
                  label="Core Value Proposition / Messaging Pitch"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.brand_messaging}
                  onChange={(e) => setFormData({ ...formData, brand_messaging: e.target.value })}
                  placeholder="e.g. Not Just Algorithms. Actual Educators. Real-Life Skills."
                />
              </Stack>
            </Paper>
          </Grid>

          {/* CARD 3: TARGET AUDIENCE & BUYER PERSONAS */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#4B9BFF', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PsychologyIcon sx={{ color: '#4B9BFF' }} /> Target Audience & Buyer Personas
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>
                Defines audience segments and psychological drivers for campaign generation and narrative hooks.
              </Typography>

              {/* Audience Segments */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#E2E8F0', mb: 1 }}>
                Audience Demographics & Segments:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {(formData.target_audience || []).map((aud, idx) => (
                  <Chip
                    key={idx}
                    label={aud}
                    onDelete={() => handleDeleteAudience(idx)}
                    sx={{ backgroundColor: 'rgba(75, 155, 255, 0.15)', color: '#4B9BFF', border: '1px solid rgba(75, 155, 255, 0.3)', fontWeight: 600 }}
                  />
                ))}
              </Box>
              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add target segment (e.g. Parents of Grades 3-10)"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAudience(); } }}
                />
                <Button variant="outlined" size="small" onClick={handleAddAudience} sx={{ borderColor: '#4B9BFF', color: '#4B9BFF' }}>
                  Add
                </Button>
              </Stack>

              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

              {/* Audience Personas */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#E2E8F0', mb: 1 }}>
                Audience Personas & Pain Points:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {(formData.audience_personas || []).map((persona, idx) => (
                  <Chip
                    key={idx}
                    label={persona}
                    onDelete={() => handleDeletePersona(idx)}
                    sx={{ backgroundColor: 'rgba(245, 166, 35, 0.12)', color: '#F5A623', border: '1px solid rgba(245, 166, 35, 0.3)', fontWeight: 600 }}
                  />
                ))}
              </Box>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add persona (e.g. Parents Seeking Real-World Future Skills)"
                  value={newPersona}
                  onChange={(e) => setNewPersona(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPersona(); } }}
                />
                <Button variant="outlined" size="small" onClick={handleAddPersona} sx={{ borderColor: '#F5A623', color: '#F5A623' }}>
                  Add
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* CARD 4: BRAND GUARDRAILS & STRICT PROHIBITIONS */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#FF5252', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon sx={{ color: '#FF5252' }} /> Strict Negative Guardrails ("Brand Don'ts")
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>
                Negative constraints injected into every AI generation prompt to eliminate generic tropes, corporate jargon, and school room clichés.
              </Typography>

              <Stack spacing={1.5} sx={{ mb: 2.5, maxHeight: 260, overflowY: 'auto', pr: 0.5 }}>
                {(formData.donts || []).map((dont, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 1.2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 82, 82, 0.08)',
                      border: '1px solid rgba(255, 82, 82, 0.25)',
                      borderRadius: 1.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningAmberIcon sx={{ color: '#FF5252', fontSize: 18, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: '#F87171', fontWeight: 600, fontSize: '0.8rem' }}>
                        {dont}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleDeleteConstraint(idx)} sx={{ color: '#FF5252', flexShrink: 0 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add negative constraint (e.g. Do not praise rote learning or GPAs)"
                  value={newConstraint}
                  onChange={(e) => setNewConstraint(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddConstraint(); } }}
                />
                <Button variant="outlined" size="small" onClick={handleAddConstraint} sx={{ borderColor: '#FF5252', color: '#FF5252' }}>
                  Add
                </Button>
              </Stack>

              <Alert severity="warning" sx={{ background: 'rgba(255, 82, 82, 0.06)', border: '1px solid rgba(255, 82, 82, 0.2)', color: '#FCA5A5', fontSize: '0.75rem' }}>
                Every single post, brief, and visual prompt automatically audits against these constraints before publishing.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ======================================================== */}
      {/* TAB 1: HIERARCHICAL USPS (PRODUCTS, SERVICES, IPS)       */}
      {/* ======================================================== */}
      {activeTab === 1 && (
        <Stack spacing={3}>
          {/* 1. PRODUCTS */}
          <Paper sx={{ p: 3, background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#F5A623' }}>
                  🎯 1. Commercial Products & Flagship Modules ({formData.usps.products.length})
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Specific standalone offerings, cohorts, courses, or SaaS platform tiers to feature in ad sprints.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                sx={{ color: '#F5A623', borderColor: 'rgba(245, 166, 35, 0.4)' }}
              >
                Add Product Offering
              </Button>
            </Box>

            <Grid container spacing={2}>
              {formData.usps.products.map((prod) => (
                <Grid item xs={12} md={6} key={prod.id}>
                  <Card sx={{ background: 'rgba(20,23,31,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1.5 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <TextField
                          label="Product Name"
                          size="small"
                          fullWidth
                          value={prod.name}
                          onChange={(e) => handleUpdateProduct(prod.id, 'name', e.target.value)}
                          sx={{ mr: 1 }}
                        />
                        <IconButton size="small" onClick={() => handleDeleteProduct(prod.id)} sx={{ color: '#FF5252' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Stack spacing={1.5}>
                        <TextField
                          label="Target Segment / Demographic"
                          size="small"
                          fullWidth
                          value={prod.target_segment}
                          onChange={(e) => handleUpdateProduct(prod.id, 'target_segment', e.target.value)}
                          placeholder="e.g. Grades 3-10, Series A Startups, High-Net-Worth Individuals"
                        />
                        <TextField
                          label="Key Outcome / Value Proposition"
                          size="small"
                          fullWidth
                          multiline
                          rows={2}
                          value={prod.key_outcome}
                          onChange={(e) => handleUpdateProduct(prod.id, 'key_outcome', e.target.value)}
                          placeholder="What quantifiable transformation does the client achieve?"
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {formData.usps.products.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ background: 'rgba(24, 119, 242, 0.1)', color: '#4B9BFF' }}>
                    No products added yet. Click 'Add Product Offering' to define commercial modules for this brand.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* 2. SERVICES */}
          <Paper sx={{ p: 3, background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#4B9BFF' }}>
                  🤝 2. Strategic Services & Delivery Modalities ({formData.usps.services.length})
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  How offerings are delivered: live mentorship, 1:1 cohorts, managed implementation, dedicated SLAs.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddService}
                sx={{ color: '#4B9BFF', borderColor: 'rgba(24, 119, 242, 0.4)' }}
              >
                Add Service Line
              </Button>
            </Box>

            <Grid container spacing={2}>
              {formData.usps.services.map((srv) => (
                <Grid item xs={12} md={6} key={srv.id}>
                  <Card sx={{ background: 'rgba(20,23,31,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1.5 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <TextField
                          label="Service Name"
                          size="small"
                          fullWidth
                          value={srv.name}
                          onChange={(e) => handleUpdateService(srv.id, 'name', e.target.value)}
                          sx={{ mr: 1 }}
                        />
                        <IconButton size="small" onClick={() => handleDeleteService(srv.id)} sx={{ color: '#FF5252' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <TextField
                        label="Delivery Model & Feature Details"
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        value={srv.delivery_model}
                        onChange={(e) => handleUpdateService(srv.id, 'delivery_model', e.target.value)}
                        placeholder="e.g. 100% Handpicked & Founder-Trained Teachers with Anti-Crowded Cohorts"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* 3. PROPRIETARY IPS */}
          <Paper sx={{ p: 3, background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#10B981' }}>
                  💡 3. Proprietary IPs, Frameworks & Methodologies ({formData.usps.ips.length})
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Patented frameworks, assessment matrices, pedagogical systems, or proprietary algorithms.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddIp}
                sx={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                Add Proprietary IP
              </Button>
            </Box>

            <Grid container spacing={2}>
              {formData.usps.ips.map((ip) => (
                <Grid item xs={12} md={6} key={ip.id}>
                  <Card sx={{ background: 'rgba(20,23,31,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 1.5 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <TextField
                          label="Framework / IP Title"
                          size="small"
                          fullWidth
                          value={ip.name}
                          onChange={(e) => handleUpdateIp(ip.id, 'name', e.target.value)}
                          sx={{ mr: 1 }}
                        />
                        <IconButton size="small" onClick={() => handleDeleteIp(ip.id)} sx={{ color: '#FF5252' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <TextField
                        label="Methodology & Proof Point"
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        value={ip.description}
                        onChange={(e) => handleUpdateIp(ip.id, 'description', e.target.value)}
                        placeholder="e.g. 360° Alignment Assessment Matrix measuring soft skills transformation"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Stack>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SOVEREIGN MICRO-KB FACT VAULT                     */}
      {/* ======================================================== */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3, background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#F5A623', display: 'flex', alignItems: 'center', gap: 1 }}>
                <FactCheckIcon /> Sovereign Micro-KB (Short Knowledge Base)
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                A lightweight, sovereign fact repository built directly into this client's KYC. Use this to ground LLM campaigns <strong>without</strong> needing the heavyweight 200-item vector database!
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddMicroKbFact}
              sx={{ background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)', color: '#121212', fontWeight: 700 }}
            >
              Add Micro-KB Fact
            </Button>
          </Box>

          <Grid container spacing={2}>
            {formData.micro_kb.map((f, idx) => (
              <Grid item xs={12} md={6} key={f.id}>
                <Card sx={{ background: 'rgba(20,23,31,0.85)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <TextField
                        label="Fact Title / Hook Headline"
                        size="small"
                        fullWidth
                        value={f.title}
                        onChange={(e) => handleUpdateMicroKbFact(f.id, 'title', e.target.value)}
                        sx={{ mr: 1 }}
                      />
                      <IconButton size="small" onClick={() => handleDeleteMicroKbFact(f.id)} sx={{ color: '#FF5252' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <TextField
                      label="Core Verifiable Fact / Proof Narrative"
                      size="small"
                      fullWidth
                      multiline
                      rows={3}
                      value={f.fact}
                      onChange={(e) => handleUpdateMicroKbFact(f.id, 'fact', e.target.value)}
                      sx={{ mb: 1.5 }}
                      placeholder="e.g. Over 70% of students in traditional classrooms develop chronic speaking anxiety. Our small-group pedagogy eliminates this within 8 sessions."
                    />

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <TextField
                          label="Proof Metric / Statistic"
                          size="small"
                          fullWidth
                          value={f.proof_metric}
                          onChange={(e) => handleUpdateMicroKbFact(f.id, 'proof_metric', e.target.value)}
                          placeholder="e.g. 7 out of 10 or 99.4%"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Domain Category"
                          size="small"
                          fullWidth
                          value={f.category}
                          onChange={(e) => handleUpdateMicroKbFact(f.id, 'category', e.target.value)}
                          placeholder="e.g. Methodology, ROI, Security"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {formData.micro_kb.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center', background: 'rgba(20,23,31,0.5)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ color: '#F0F3F6', fontWeight: 700, mb: 1 }}>
                    No Micro-KB facts configured yet.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 600, mx: 'auto', mb: 2 }}>
                    Enter 3–8 crisp, proven statements of fact above. The Campaign Sprint and Content Director will ground all generated carousels and ad posts directly on these facts with zero hallucinations.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddMicroKbFact}
                    sx={{ color: '#F5A623', borderColor: 'rgba(245, 166, 35, 0.4)' }}
                  >
                    Create First Micro-KB Fact
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* ======================================================== */}
      {/* TAB 3: VISUAL DNA, IMAGE AGENT ENGINE & GUARDRAILS      */}
      {/* ======================================================== */}
      {activeTab === 3 && (
        <Stack spacing={3}>
          {/* SECTION 1: AI IMAGE ENGINE SELECTION & DECOUPLED ARCHITECTURE */}
          <Paper sx={{ p: 3, background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#F5A623', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BoltIcon /> Image Agent Engine & Generation Pipeline
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  Select the primary visual diffusion engine used during Campaign Sprint generation and 1-click Pane refinement.
                </Typography>
              </Box>
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: '1rem !important' }} />}
                label="Two-Phase Decoupled Architecture Enforced"
                size="small"
                sx={{ backgroundColor: 'rgba(245, 166, 35, 0.15)', color: '#F5A623', fontWeight: 700 }}
              />
            </Box>

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} md={4}>
                <Card
                  onClick={() => handleUpdateVisualConfig('preferred_engine', 'flux')}
                  sx={{
                    cursor: 'pointer',
                    p: 2,
                    height: '100%',
                    background: (formData.visual_config?.preferred_engine || 'flux') === 'flux' ? 'rgba(245, 166, 35, 0.1)' : '#14171F',
                    border: (formData.visual_config?.preferred_engine || 'flux') === 'flux' ? '2px solid #F5A623' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#F5A623' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F0F3F6', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      ⚡ Cloudflare FLUX-1-Schnell
                    </Typography>
                    {(formData.visual_config?.preferred_engine || 'flux') === 'flux' && (
                      <CheckCircleIcon sx={{ color: '#F5A623', fontSize: 18 }} />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
                    Fast 4-step distilled diffusion running on Cloudflare Workers AI. Produces sharp 1024x1024 commercial visuals in under 2 seconds.
                  </Typography>
                  <Chip label="Zero-Text Negative Constraints" size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: 'rgba(255,255,255,0.06)', color: '#CBD5E1' }} />
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  onClick={() => handleUpdateVisualConfig('preferred_engine', 'gemini')}
                  sx={{
                    cursor: 'pointer',
                    p: 2,
                    height: '100%',
                    background: formData.visual_config?.preferred_engine === 'gemini' ? 'rgba(75, 155, 255, 0.1)' : '#14171F',
                    border: formData.visual_config?.preferred_engine === 'gemini' ? '2px solid #4B9BFF' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#4B9BFF' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F0F3F6', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      🧠 Google Gemini Image (Imagen)
                    </Typography>
                    {formData.visual_config?.preferred_engine === 'gemini' && (
                      <CheckCircleIcon sx={{ color: '#4B9BFF', fontSize: 18 }} />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
                    Native Google multimodal generative model with XML role prompting and strict decoupled typography boundaries.
                  </Typography>
                  <Chip label="XML Guardrailed Prompting" size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: 'rgba(255,255,255,0.06)', color: '#CBD5E1' }} />
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  onClick={() => handleUpdateVisualConfig('preferred_engine', 'auto')}
                  sx={{
                    cursor: 'pointer',
                    p: 2,
                    height: '100%',
                    background: formData.visual_config?.preferred_engine === 'auto' ? 'rgba(16, 185, 129, 0.1)' : '#14171F',
                    border: formData.visual_config?.preferred_engine === 'auto' ? '2px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#10B981' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F0F3F6', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      🔄 Auto-Fallback Pipeline
                    </Typography>
                    {formData.visual_config?.preferred_engine === 'auto' && (
                      <CheckCircleIcon sx={{ color: '#10B981', fontSize: 18 }} />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
                    Tries Gemini Image first; if quota is hit (HTTP 429), seamlessly dispatches to Cloudflare FLUX with zero user disruption.
                  </Typography>
                  <Chip label="High-Availability Failover" size="small" sx={{ fontSize: '0.68rem', height: 20, bgcolor: 'rgba(255,255,255,0.06)', color: '#CBD5E1' }} />
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(75, 155, 255, 0.2)', color: '#93C5FD' }}>
              <strong>Decoupled Brand Architecture:</strong> Visual diffusion models generate 100% clean, non-typographic background scenery. The Phase 2 Compositor overlays official brand logos and crisp typography deterministically. This guarantees zero distorted letters or hallucinated brand logos.
            </Alert>
          </Paper>

          {/* SECTION 2: PHOTOGRAPHIC MEDIUM, LIGHTING & CAMERA DIRECTION */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#F5A623', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhotoCameraIcon /> Camera & Photographic Medium
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2.5 }}>
                  Defines the physical photographic style injected into every diffusion prompt for this brand.
                </Typography>

                <Stack spacing={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#94A3B8' }}>Art Medium Preset</InputLabel>
                    <Select
                      value={formData.visual_config?.art_medium || 'Photorealistic Commercial Photography'}
                      label="Art Medium Preset"
                      onChange={(e) => handleUpdateVisualConfig('art_medium', e.target.value)}
                    >
                      <MenuItem value="Photorealistic Commercial Photography">Photorealistic Commercial Photography</MenuItem>
                      <MenuItem value="Authentic Editorial Lifestyle Photography">Authentic Editorial Lifestyle Photography</MenuItem>
                      <MenuItem value="Cinematic 35mm Film Still (Soft Natural Grain)">Cinematic 35mm Film Still (Soft Natural Grain)</MenuItem>
                      <MenuItem value="Modern 3D Minimalist Isometric Render">Modern 3D Minimalist Isometric Render</MenuItem>
                      <MenuItem value="Clean Architectural & Interior Design Photography">Clean Architectural & Interior Design Photography</MenuItem>
                      <MenuItem value="High-Tech Studio Product Shot">High-Tech Studio Product Shot</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Custom Art Medium String"
                    fullWidth
                    size="small"
                    value={formData.visual_config?.art_medium || ''}
                    onChange={(e) => handleUpdateVisualConfig('art_medium', e.target.value)}
                    helperText="Injected directly into Phase 1 diffusion prompt."
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#94A3B8' }}>Tone & Lighting Preset</InputLabel>
                    <Select
                      value={formData.visual_config?.tone_lighting || 'Natural Morning Daylight, Diffused Soft Illumination'}
                      label="Tone & Lighting Preset"
                      onChange={(e) => handleUpdateVisualConfig('tone_lighting', e.target.value)}
                    >
                      <MenuItem value="Natural Morning Daylight, Diffused Soft Illumination">Natural Morning Daylight, Diffused Soft Illumination</MenuItem>
                      <MenuItem value="Warm Golden Hour Sunlight with Soft Bokeh">Warm Golden Hour Sunlight with Soft Bokeh</MenuItem>
                      <MenuItem value="High-Key Modern Studio Softbox Lighting">High-Key Modern Studio Softbox Lighting</MenuItem>
                      <MenuItem value="Dramatic Cinematic Rim Light with Cool Ambient Tones">Dramatic Cinematic Rim Light with Cool Ambient Tones</MenuItem>
                      <MenuItem value="Clean Bright Daylight with Minimal Shadows">Clean Bright Daylight with Minimal Shadows</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Custom Lighting & Atmosphere"
                    fullWidth
                    size="small"
                    value={formData.visual_config?.tone_lighting || ''}
                    onChange={(e) => handleUpdateVisualConfig('tone_lighting', e.target.value)}
                    helperText="Atmospheric lighting descriptor."
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: '#94A3B8' }}>Camera Perspective Preset</InputLabel>
                    <Select
                      value={formData.visual_config?.art_perspective || 'Eye-Level 50mm Lens, Shallow Depth of Field'}
                      label="Camera Perspective Preset"
                      onChange={(e) => handleUpdateVisualConfig('art_perspective', e.target.value)}
                    >
                      <MenuItem value="Eye-Level 50mm Lens, Shallow Depth of Field">Eye-Level 50mm Lens, Shallow Depth of Field</MenuItem>
                      <MenuItem value="Cinematic Wide Environmental Shot (24mm Lens)">Cinematic Wide Environmental Shot (24mm Lens)</MenuItem>
                      <MenuItem value="Close-Up Macro Focus with Soft Blurred Background">Close-Up Macro Focus with Soft Blurred Background</MenuItem>
                      <MenuItem value="Dynamic Low-Angle Hero Shot">Dynamic Low-Angle Hero Shot</MenuItem>
                      <MenuItem value="Over-the-Shoulder Focus on Physical Activity">Over-the-Shoulder Focus on Physical Activity</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Custom Lens & Perspective"
                    fullWidth
                    size="small"
                    value={formData.visual_config?.art_perspective || ''}
                    onChange={(e) => handleUpdateVisualConfig('art_perspective', e.target.value)}
                  />
                </Stack>
              </Paper>
            </Grid>

            {/* ENVIRONMENT SETTING & SUBJECT ARCHETYPES */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#F5A623', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TuneIcon /> Setting Framing & Archetype Subjects
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2.5 }}>
                  Define the spatial setting and physical subjects. Used when grounding AI scene generation.
                </Typography>

                <Stack spacing={2.5}>
                  <TextField
                    label="Setting Environment & Background"
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    value={formData.visual_config?.env_background || ''}
                    onChange={(e) => handleUpdateVisualConfig('env_background', e.target.value)}
                    placeholder="e.g. Modern collaborative studio, warm study interior, wooden desk, books and tactile learning materials"
                    helperText="Describe physical furniture, room architecture, and props."
                  />

                  <Box sx={{ p: 2, borderRadius: 1.5, background: 'rgba(245, 166, 35, 0.08)', border: '1px solid rgba(245, 166, 35, 0.3)' }}>
                    <Typography variant="caption" sx={{ color: '#F5A623', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                      <WarningAmberIcon sx={{ fontSize: 16 }} /> STRICT CROSS-CONTAMINATION GUARDRAIL:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'block', lineHeight: 1.4 }}>
                      Describe human subjects, physical actions, and real-world props ONLY. Never include brand names, logos, or slogans here. Phase 2 Compositing automatically stamps the high-res brand logo badge onto the final master deliverable.
                    </Typography>
                  </Box>

                  <TextField
                    label="Archetype Subjects & Physical Action"
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    value={formData.visual_config?.env_subjects || ''}
                    onChange={(e) => handleUpdateVisualConfig('env_subjects', e.target.value)}
                    placeholder="e.g. Confident children engaged in expressive communication, writing journals, and tactile games with mentors"
                    helperText="Focus on emotional posture, genuine interactions, and physical activities."
                  />

                  <TextField
                    label="Demographics & Cultural Representation (AI Image Prompts)"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    value={formData.visual_config?.demographics_instruction || ''}
                    onChange={(e) => handleUpdateVisualConfig('demographics_instruction', e.target.value)}
                    placeholder="e.g. Authentic modern South Asian, Indian children and mentors/teachers. In group photos, maintain majority South Asian students with 1 white child and 1 black child for inclusive representation."
                    helperText="Strictly controls demographic generation across Cloudflare FLUX and Gemini diffusion engines."
                  />

                  {/* BRAND PALETTE SWATCHES */}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ color: '#F5A623', fontWeight: 800 }}>
                    Brand Color Palette Swatches:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {(formData.visual_config?.palette_hexes || []).map((hex, idx) => (
                      <Chip
                        key={idx}
                        label={hex}
                        size="small"
                        onDelete={() => handleDeleteColor(hex)}
                        sx={{
                          backgroundColor: hex,
                          color: ['#FFFFFF', '#F5A623', '#38BDF8', '#00D2FF'].includes(hex) ? '#121212' : '#FFFFFF',
                          fontWeight: 800,
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      />
                    ))}
                  </Stack>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      label="Add Hex Swatch"
                      size="small"
                      value={newHexColor}
                      onChange={(e) => setNewHexColor(e.target.value)}
                      placeholder="#0F172A"
                      sx={{ width: 140 }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddColor}
                      sx={{ color: '#F5A623', borderColor: 'rgba(245, 166, 35, 0.4)' }}
                    >
                      Add
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* SECTION 3: VISUAL NEGATIVE GUARDRAILS & COPYWRITING CONSTRAINTS */}
          <Grid container spacing={3}>
            {/* VISUAL EXCLUSIONS CHIPS */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 1.5, color: '#FF5252', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon /> Visual Anti-Hallucination Guardrails
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
                  Explicit visual tokens excluded from Cloudflare FLUX and Google Gemini diffusion prompts.
                </Typography>

                <Stack spacing={1} sx={{ mb: 2.5 }}>
                  {(formData.visual_config?.disallowed_visual_elements || []).map((token, idx) => (
                    <Chip
                      key={idx}
                      label={token}
                      onDelete={() => handleDeleteDisallowed(idx)}
                      sx={{
                        backgroundColor: 'rgba(255, 82, 82, 0.1)',
                        color: '#FF8A80',
                        border: '1px solid rgba(255, 82, 82, 0.3)',
                        justifyContent: 'space-between',
                        fontWeight: 600,
                        py: 1.5
                      }}
                    />
                  ))}
                </Stack>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add custom visual exclusion (e.g., no logos, no distorted hands)..."
                    value={newDisallowed}
                    onChange={(e) => setNewDisallowed(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDisallowed()}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleAddDisallowed()}
                    sx={{ color: '#FF5252', borderColor: 'rgba(255, 82, 82, 0.4)', minWidth: 80 }}
                  >
                    Add
                  </Button>
                </Box>

                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                  Quick Add Recommended Guardrails:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {[
                    'No readable text or typography',
                    'No brand logos or watermarks',
                    'No fake UI cards or infographics',
                    'No crowded Zoom classrooms',
                    'No distorted hands or blurry faces',
                    'No cartoon or 3D avatars'
                  ].map((preset, idx) => (
                    <Chip
                      key={idx}
                      label={`+ ${preset}`}
                      size="small"
                      onClick={() => handleAddDisallowed(preset)}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#CBD5E1',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        '&:hover': { backgroundColor: 'rgba(245, 166, 35, 0.15)', color: '#F5A623' }
                      }}
                    />
                  ))}
                </Stack>
              </Paper>
            </Grid>

            {/* COPYWRITING NEGATIVE CONSTRAINTS & AUDIENCES */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%', background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 1.5, color: '#FF5252', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon /> Copywriting Negative Constraints ("Don'ts")
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2 }}>
                  Rules enforced by Groq ACID Judge during text synthesis to preserve authenticity.
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  {formData.donts.map((d, idx) => (
                    <Chip
                      key={idx}
                      label={d}
                      onDelete={() => handleDeleteConstraint(idx)}
                      sx={{
                        backgroundColor: 'rgba(255, 82, 82, 0.08)',
                        color: '#FF8A80',
                        border: '1px solid rgba(255, 82, 82, 0.25)',
                        justifyContent: 'space-between',
                        fontWeight: 600,
                        py: 1.5
                      }}
                    />
                  ))}
                </Stack>

                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter copy negative constraint..."
                    value={newConstraint}
                    onChange={(e) => setNewConstraint(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddConstraint()}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddConstraint}
                    sx={{ color: '#FF5252', borderColor: 'rgba(255, 82, 82, 0.4)', minWidth: 80 }}
                  >
                    Add
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#4B9BFF', fontWeight: 800 }}>
                  Target Demographic Segments:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formData.target_audience.map((aud, idx) => (
                    <Chip
                      key={idx}
                      label={aud}
                      size="small"
                      onDelete={() => handleDeleteAudience(idx)}
                      sx={{ backgroundColor: 'rgba(24, 119, 242, 0.15)', color: '#4B9BFF' }}
                    />
                  ))}
                </Stack>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Add audience persona..."
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAudience()}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddAudience}
                    sx={{ color: '#4B9BFF', borderColor: 'rgba(24, 119, 242, 0.4)' }}
                  >
                    Add
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* SECTION 4: REAL-TIME DUAL-ENGINE PROMPT INSPECTOR */}
          <Paper sx={{ p: 3, background: '#0F1218', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#4B9BFF', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityIcon /> Real-Time Dual-Engine Prompt Inspector
                </Typography>
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  Live preview of the exact prompts dispatched to Cloudflare FLUX and Google Gemini Image models. Verify zero cross-contamination before generating.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => handleCopyPrompt(inspectorTab === 0 ? getFluxPromptPreview() : getGeminiPromptPreview())}
                sx={{ color: copied ? '#10B981' : '#4B9BFF', borderColor: copied ? '#10B981' : 'rgba(75, 155, 255, 0.4)' }}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Formatted Prompt'}
              </Button>
            </Box>

            <TextField
              label="Test Action / Scene Input (Type to preview prompt formatting)"
              fullWidth
              size="small"
              value={testScenePrompt}
              onChange={(e) => setTestScenePrompt(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Tabs
              value={inspectorTab}
              onChange={(e, val) => setInspectorTab(val)}
              sx={{
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                mb: 2,
                '& .MuiTab-root': { fontWeight: 700, fontSize: '0.8rem', color: '#94A3B8', '&.Mui-selected': { color: '#4B9BFF' } },
                '& .MuiTabs-indicator': { backgroundColor: '#4B9BFF' }
              }}
            >
              <Tab icon={<BoltIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Cloudflare FLUX-1-Schnell Payload" />
              <Tab icon={<PsychologyIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Google Gemini Image API (XML Structure)" />
            </Tabs>

            {inspectorTab === 0 && (
              <Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: '#090B10',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    color: '#E2E8F0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6
                  }}
                >
                  {getFluxPromptPreview()}
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                  ✅ Notice: Client name "{formData.name}" and all quotes/labels are strictly stripped. Photographic medium, lighting, perspective, and negative constraints are appended automatically.
                </Typography>
              </Box>
            )}

            {inspectorTab === 1 && (
              <Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: '#090B10',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    color: '#38BDF8',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.5
                  }}
                >
                  {getGeminiPromptPreview()}
                </Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                  ✅ Notice: Gemini XML architecture separates &lt;ROLE_AND_TONE&gt;, &lt;STRICT_CONSTRAINTS&gt;, &lt;VISUAL_IDENTITY&gt;, and &lt;SCENE_DESCRIPTION&gt;.
                </Typography>
              </Box>
            )}
          </Paper>
        </Stack>
      )}

    </Box>
  );
}
