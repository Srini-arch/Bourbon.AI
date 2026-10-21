import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, Tabs, Tab,
  Chip, CircularProgress, IconButton, Alert, Divider, Stack, Tooltip,
  Card, CardContent, InputAdornment, FormControl, InputLabel, Select,
  MenuItem, Switch, FormControlLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Link
} from '@mui/material';

import KeyIcon from '@mui/icons-material/Key';
import SpeedIcon from '@mui/icons-material/Speed';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BoltIcon from '@mui/icons-material/Bolt';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function ImageAgentSettings({ clientData }) {
  const [activeSubTab, setActiveSubTab] = useState(0);

  // --- 1. CREDENTIALS STATE ---
  const [keysData, setKeysData] = useState({
    gemini_api_key: '',
    cloudflare_account_id: '',
    cloudflare_api_token: '',
    groq_api_key: '',
    sarvam_api_key: ''
  });
  const [showKey, setShowKey] = useState({
    gemini: false,
    cloudflare_token: false,
    groq: false,
    sarvam: false
  });
  const [keyStatus, setKeyStatus] = useState({});
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysFeedback, setKeysFeedback] = useState(null);

  // --- 2. PIPELINE CONFIG STATE ---
  const [imageConfig, setImageConfig] = useState({
    default_engine: 'gemini',
    gemini_model: 'gemini-3.1-flash-image',
    auto_fallback_to_flux: true,
    thinking_level: 'High',
    aspect_ratio: '1:1',
    default_style: 'industry_standard',
    negative_prompt: 'no text, no letters, no logos, no watermarks, no distorted limbs, no blurry faces'
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState(null);

  // --- 3. DIAGNOSTICS & PROBE STATE ---
  const [probePrompt, setProbePrompt] = useState('A glowing sapphire crystal on obsidian, 1:1, photorealistic');
  const [probingEngine, setProbingEngine] = useState(null); // 'gemini_image', 'flux_image', 'groq_acid', 'gemini_vision'
  const [probeResults, setProbeResults] = useState({});
  const [runningAllProbes, setRunningAllProbes] = useState(false);

  // --- 4. TELEMETRY LOGS ---
  const [probeLogs, setProbeLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch initial keys and config
  const fetchKeys = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/keys`);
      const data = await res.json();
      if (data.keys) {
        setKeysData({
          gemini_api_key: data.keys.gemini_api_key || '',
          cloudflare_account_id: data.keys.cloudflare_account_id || '',
          cloudflare_api_token: data.keys.cloudflare_api_token || '',
          groq_api_key: data.keys.groq_api_key || '',
          sarvam_api_key: data.keys.sarvam_api_key || ''
        });
        setKeyStatus(data.keys);
      }
    } catch (err) {
      console.error('Failed to load API keys:', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/image-config`);
      const data = await res.json();
      if (data.config) {
        setImageConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load image config:', err);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings/logs?limit=25`);
      const data = await res.json();
      if (data.logs) {
        setProbeLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchConfig();
    fetchLogs();
  }, []);

  // Save updated credentials
  const handleSaveKeys = async () => {
    setSavingKeys(true);
    setKeysFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/settings/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keysData)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setKeysFeedback({ type: 'success', text: `Credentials saved & synced in-memory! Updated: ${data.updated.join(', ')}` });
        fetchKeys();
      } else {
        setKeysFeedback({ type: 'error', text: data.detail || 'Failed to save credentials' });
      }
    } catch (err) {
      setKeysFeedback({ type: 'error', text: String(err) });
    } finally {
      setSavingKeys(false);
    }
  };

  // Save pipeline configuration
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setConfigFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/api/settings/image-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageConfig)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setConfigFeedback({ type: 'success', text: 'Image Agent pipeline routing saved successfully!' });
      } else {
        setConfigFeedback({ type: 'error', text: data.detail || 'Failed to save config' });
      }
    } catch (err) {
      setConfigFeedback({ type: 'error', text: String(err) });
    } finally {
      setSavingConfig(false);
    }
  };

  // Execute diagnostic probe against an engine
  const runProbe = async (engineName, customKey = null) => {
    setProbingEngine(engineName);
    try {
      const res = await fetch(`${API_BASE}/api/settings/test-engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: engineName,
          custom_key: customKey || (engineName === 'gemini_image' ? keysData.gemini_api_key : null),
          prompt: probePrompt,
          model: engineName === 'gemini_image' ? imageConfig.gemini_model : null
        })
      });
      const result = await res.json();
      setProbeResults(prev => ({
        ...prev,
        [engineName]: result
      }));
      fetchLogs();
      return result;
    } catch (err) {
      const errRes = {
        status: 'error',
        engine: engineName,
        latency_ms: 0,
        http_status: 500,
        message: String(err),
        error_code: 'NETWORK_ERROR'
      };
      setProbeResults(prev => ({ ...prev, [engineName]: errRes }));
      return errRes;
    } finally {
      setProbingEngine(null);
    }
  };

  // Run sequential benchmark across all 4 engines
  const handleRunAllProbes = async () => {
    setRunningAllProbes(true);
    await runProbe('gemini_image');
    await runProbe('flux_image');
    await runProbe('groq_acid');
    await runProbe('gemini_vision');
    setRunningAllProbes(false);
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      
      {/* HEADER BAR */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#F0F3F6', letterSpacing: '-0.02em' }}>
              🎨 Image Agent & Engine Settings
            </Typography>
            <Chip
              label="System Architect Suite"
              size="small"
              sx={{ backgroundColor: 'rgba(245, 166, 35, 0.15)', color: '#F5A623', fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Configure provider API keys, test live multimodal engine quotas, and control visual generation pipeline routing.
          </Typography>
        </Box>

        {/* ACTIVE ENGINE BADGE */}
        <Paper
          sx={{
            px: 2,
            py: 1,
            borderRadius: 2,
            background: 'rgba(20, 23, 31, 0.85)',
            border: '1px solid rgba(245, 166, 35, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600 }}>
              ACTIVE PRIMARY ENGINE
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#F5A623', fontWeight: 800 }}>
              {imageConfig.default_engine === 'gemini' && 'Google Gemini (gemini-3.1-flash-image)'}
              {imageConfig.default_engine === 'flux' && 'Cloudflare FLUX-1-Schnell (Direct)'}
              {imageConfig.default_engine === 'gemini_strict' && 'Google Gemini (Strict Mode)'}
            </Typography>
          </Box>
          <Chip
            size="small"
            icon={<BoltIcon sx={{ fontSize: '14px !important' }} />}
            label={imageConfig.auto_fallback_to_flux ? 'Flux Fallback Armed' : 'No Fallback'}
            sx={{
              backgroundColor: imageConfig.auto_fallback_to_flux ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: imageConfig.auto_fallback_to_flux ? '#10B981' : '#EF4444',
              fontWeight: 700,
              fontSize: '0.72rem'
            }}
          />
        </Paper>
      </Box>

      {/* MULTI-LAYERED SUB-TABS NAVIGATION */}
      <Paper sx={{ mb: 3, borderRadius: 2, background: 'rgba(15, 18, 24, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Tabs
          value={activeSubTab}
          onChange={(e, val) => setActiveSubTab(val)}
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: '#F5A623', height: 3 },
            '& .MuiTab-root': {
              color: '#94A3B8',
              fontWeight: 600,
              fontSize: '0.88rem',
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': { color: '#F5A623' }
            }
          }}
        >
          <Tab icon={<KeyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Provider API Keys & Vault" />
          <Tab icon={<SpeedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="2. Live Engine Diagnostics & Prober" />
          <Tab icon={<TuneIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="3. Image Agent Pipeline Routing" />
          <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="4. Telemetry & Probe Audit Logs" />
        </Tabs>
      </Paper>

      {/* =========================================================================
          SUB-TAB 1: PROVIDER API KEYS & VAULT
         ========================================================================= */}
      {activeSubTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              
              <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                    🔑 Credentials & Inference Keys Vault
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Keys are securely saved to your local <code style={{ color: '#F5A623' }}>.env</code> file and synced in-memory immediately.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={savingKeys ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveKeys}
                  disabled={savingKeys}
                  sx={{
                    background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                    color: '#121212',
                    fontWeight: 800,
                    px: 2.5
                  }}
                >
                  Save & Sync Credentials
                </Button>
              </Box>

              {keysFeedback && (
                <Alert
                  severity={keysFeedback.type}
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => setKeysFeedback(null)}
                >
                  {keysFeedback.text}
                </Alert>
              )}

              {/* 1. GOOGLE GEMINI API KEY */}
              <Card sx={{ mb: 2.5, background: 'rgba(15, 18, 24, 0.8)', border: '1px solid rgba(245, 166, 35, 0.25)', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesomeIcon sx={{ color: '#F5A623', fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                        Google Gemini API Key (Prepaid / Pay-As-You-Go)
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={keyStatus.has_gemini_key ? 'Configured' : 'Missing'}
                      color={keyStatus.has_gemini_key ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2, lineHeight: 1.5 }}>
                    Used by the Image Agent for <strong>gemini-3.1-flash-image</strong> and multimodal Vision audits.
                    <span style={{ color: '#F5A623', display: 'block', marginTop: 2 }}>
                      ⚠️ <strong>Note:</strong> Google AI Studio Free Tier has a quota limit of <code>0</code> for Image Generation models. A Billing-enabled / Prepaid Google Cloud project is required for Gemini Image Generation API.
                    </span>
                  </Typography>

                  <Grid container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, sm: 8.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="AIzaSy..."
                        type={showKey.gemini ? 'text' : 'password'}
                        value={keysData.gemini_api_key}
                        onChange={(e) => setKeysData(prev => ({ ...prev, gemini_api_key: e.target.value }))}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setShowKey(prev => ({ ...prev, gemini: !prev.gemini }))}
                              >
                                {showKey.gemini ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3.5 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={probingEngine === 'gemini_image' ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                        onClick={() => runProbe('gemini_image', keysData.gemini_api_key)}
                        disabled={probingEngine === 'gemini_image'}
                        sx={{ color: '#F5A623', borderColor: 'rgba(245, 166, 35, 0.4)', fontWeight: 700, height: 40 }}
                      >
                        Test Key Probe
                      </Button>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Link
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: '#00D2FF', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                    >
                      Open Google AI Studio Keys Console <OpenInNewIcon sx={{ fontSize: 13 }} />
                    </Link>
                  </Box>
                </CardContent>
              </Card>

              {/* 2. CLOUDFLARE WORKERS AI & FLUX */}
              <Card sx={{ mb: 2.5, background: 'rgba(15, 18, 24, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudQueueIcon sx={{ color: '#FA8C16', fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                        Cloudflare Workers AI (FLUX-1-Schnell Engine)
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={keyStatus.has_cloudflare_token ? 'Configured (Verified)' : 'Missing'}
                      color={keyStatus.has_cloudflare_token ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>
                    Powers zero-downtime fallback and direct dedicated photorealistic 1024x1024 square image generation (~2.5s latency).
                  </Typography>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Account ID"
                        value={keysData.cloudflare_account_id}
                        onChange={(e) => setKeysData(prev => ({ ...prev, cloudflare_account_id: e.target.value }))}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="API Token"
                        type={showKey.cloudflare_token ? 'text' : 'password'}
                        value={keysData.cloudflare_api_token}
                        onChange={(e) => setKeysData(prev => ({ ...prev, cloudflare_api_token: e.target.value }))}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setShowKey(prev => ({ ...prev, cloudflare_token: !prev.cloudflare_token }))}
                              >
                                {showKey.cloudflare_token ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2.5 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={probingEngine === 'flux_image' ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                        onClick={() => runProbe('flux_image')}
                        disabled={probingEngine === 'flux_image'}
                        sx={{ color: '#FA8C16', borderColor: 'rgba(250, 140, 22, 0.4)', fontWeight: 700, height: 40 }}
                      >
                        Test Flux
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 3. GROQ LPU & ACID AUDITOR */}
              <Card sx={{ mb: 2.5, background: 'rgba(15, 18, 24, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BoltIcon sx={{ color: '#00D2FF', fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                        Groq LPU Swarm & ACID Auditor Key
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={keyStatus.has_groq_key ? 'Operational' : 'Missing'}
                      color={keyStatus.has_groq_key ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>
                    Drives 500+ tok/s high-speed drafting and real-time ACID compliance scoring on Llama-3.3-70B / GPT-OSS-120B.
                  </Typography>

                  <Grid container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, sm: 9 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="gsk_..."
                        type={showKey.groq ? 'text' : 'password'}
                        value={keysData.groq_api_key}
                        onChange={(e) => setKeysData(prev => ({ ...prev, groq_api_key: e.target.value }))}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setShowKey(prev => ({ ...prev, groq: !prev.groq }))}
                              >
                                {showKey.groq ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        startIcon={probingEngine === 'groq_acid' ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                        onClick={() => runProbe('groq_acid')}
                        disabled={probingEngine === 'groq_acid'}
                        sx={{ color: '#00D2FF', borderColor: 'rgba(0, 210, 255, 0.4)', fontWeight: 700, height: 40 }}
                      >
                        Test Groq
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 4. SARVAM AI */}
              <Card sx={{ background: 'rgba(15, 18, 24, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 18 }}>🇮🇳</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                        Sarvam AI Key (Regional Indian Voice & Indic LLM)
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={keyStatus.has_sarvam_key ? 'Configured' : 'Missing'}
                      color={keyStatus.has_sarvam_key ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="sk_..."
                    type={showKey.sarvam ? 'text' : 'password'}
                    value={keysData.sarvam_api_key}
                    onChange={(e) => setKeysData(prev => ({ ...prev, sarvam_api_key: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setShowKey(prev => ({ ...prev, sarvam: !prev.sarvam }))}
                          >
                            {showKey.sarvam ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </CardContent>
              </Card>

            </Paper>
          </Grid>

          {/* SIDEBAR ARCHITECT GUIDANCE */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(245, 166, 35, 0.15)', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F5A623', mb: 1 }}>
                💡 System Architect Insights
              </Typography>
              <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 2, lineHeight: 1.6 }}>
                <strong>Why was your Google key failing?</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.5, lineHeight: 1.6 }}>
                1. <strong>System Env Hijacking:</strong> Windows environment variables previously assigned a Google Search key to <code>GOOGLE_API_KEY</code>, which hijacked the Gemini SDK. We have added explicit runtime synchronization.
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.5, lineHeight: 1.6 }}>
                2. <strong>Free-Tier Quota Limit:</strong> Free Google AI Studio keys return <code>RESOURCE_EXHAUSTED (limit: 0)</code> for preview image models. A prepaid Google Cloud billing account is required.
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1.6 }}>
                3. <strong>Zero-Downtime Fallback:</strong> If Gemini is unreachable or exhausted, our engine automatically switches to Cloudflare FLUX-1-Schnell so your campaign workflow never halts.
              </Typography>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F0F3F6', mb: 1.5 }}>
                ⚡ Quick Engine Switcher
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>
                Want to switch immediately to Cloudflare FLUX while configuring your prepaid Gemini key?
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setImageConfig(prev => ({ ...prev, default_engine: 'flux' }));
                  handleSaveConfig();
                }}
                sx={{ color: '#FA8C16', borderColor: '#FA8C16', fontWeight: 700, mb: 1 }}
              >
                Set Cloudflare FLUX as Default
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setImageConfig(prev => ({ ...prev, default_engine: 'gemini' }));
                  handleSaveConfig();
                }}
                sx={{ color: '#F5A623', borderColor: '#F5A623', fontWeight: 700 }}
              >
                Set Google Gemini as Default
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* =========================================================================
          SUB-TAB 2: LIVE ENGINE DIAGNOSTICS & MODEL PROBER
         ========================================================================= */}
      {activeSubTab === 1 && (
        <Box>
          {/* Probe prompt bar */}
          <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F0F3F6', mb: 1 }}>
              🧪 Live Probe Prompt Configuration
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 8.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Diagnostic Probe Prompt"
                  value={probePrompt}
                  onChange={(e) => setProbePrompt(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={runningAllProbes ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  onClick={handleRunAllProbes}
                  disabled={runningAllProbes}
                  sx={{
                    background: 'linear-gradient(135deg, #00D2FF 0%, #0070F3 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    height: 40
                  }}
                >
                  Run Full Engine Benchmark
                </Button>
              </Grid>
            </Grid>

            {/* Quick Chips */}
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: '#64748B', alignSelf: 'center' }}>Samples:</Typography>
              {[
                'A glowing sapphire crystal on obsidian, 1:1, photorealistic',
                'Indian school child reading in modern bright classroom, 1:1',
                'Futuristic robotic mentor teaching math, clean vector illustration',
                'Minimalist golden hour coffee cup on walnut desk, cinematic'
              ].map((p, idx) => (
                <Chip
                  key={idx}
                  label={p.slice(0, 36) + '...'}
                  size="small"
                  onClick={() => setProbePrompt(p)}
                  sx={{ cursor: 'pointer', fontSize: '0.72rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                />
              ))}
            </Stack>
          </Paper>

          {/* DIAGNOSTIC CARDS GRID */}
          <Grid container spacing={3}>
            
            {/* 1. GOOGLE GEMINI IMAGE PROBE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(245, 166, 35, 0.25)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesomeIcon sx={{ color: '#F5A623', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                        Google Gemini Image API
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Model: <code>{imageConfig.gemini_model}</code> (Google AI Studio / Cloud)
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={probingEngine === 'gemini_image' ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                    onClick={() => runProbe('gemini_image')}
                    disabled={probingEngine === 'gemini_image'}
                    sx={{ background: '#F5A623', color: '#121212', fontWeight: 800 }}
                  >
                    Run Probe
                  </Button>
                </Box>

                <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                {probeResults.gemini_image ? (
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Chip
                        size="small"
                        icon={probeResults.gemini_image.status === 'ok' ? <CheckCircleIcon /> : <ErrorIcon />}
                        label={`HTTP ${probeResults.gemini_image.http_status} (${probeResults.gemini_image.latency_ms}ms)`}
                        color={probeResults.gemini_image.status === 'ok' ? 'success' : 'error'}
                        sx={{ fontWeight: 700 }}
                      />
                      {probeResults.gemini_image.error_code && (
                        <Chip
                          size="small"
                          label={probeResults.gemini_image.error_code}
                          variant="outlined"
                          color="error"
                          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      )}
                    </Box>

                    <Alert
                      severity={probeResults.gemini_image.status === 'ok' ? 'success' : 'warning'}
                      sx={{ mb: 2, borderRadius: 2 }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {probeResults.gemini_image.message}
                      </Typography>
                      {probeResults.gemini_image.suggested_fix && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.8, color: '#CBD5E1' }}>
                          👉 <strong>Recommended Fix:</strong> {probeResults.gemini_image.suggested_fix}
                        </Typography>
                      )}
                    </Alert>

                    {probeResults.gemini_image.thumbnail_url && (
                      <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Live 1:1 Output Thumbnail:
                        </Typography>
                        <Box
                          component="img"
                          src={probeResults.gemini_image.thumbnail_url}
                          alt="Gemini Output"
                          sx={{
                            width: 180,
                            height: 180,
                            borderRadius: 2,
                            objectFit: 'cover',
                            border: '2px solid #F5A623',
                            boxShadow: '0 4px 16px rgba(245, 166, 35, 0.3)'
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#64748B', flexGrow: 1 }}>
                    <Typography variant="body2">No probe executed yet. Click "Run Probe" to test your Google API key.</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* 2. CLOUDFLARE FLUX-1-SCHNELL PROBE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(250, 140, 22, 0.25)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudQueueIcon sx={{ color: '#FA8C16', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                        Cloudflare FLUX-1-Schnell
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Model: <code>@cf/black-forest-labs/flux-1-schnell</code> (Workers AI)
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={probingEngine === 'flux_image' ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                    onClick={() => runProbe('flux_image')}
                    disabled={probingEngine === 'flux_image'}
                    sx={{ background: '#FA8C16', color: '#fff', fontWeight: 800 }}
                  >
                    Run Probe
                  </Button>
                </Box>

                <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                {probeResults.flux_image ? (
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Chip
                        size="small"
                        icon={probeResults.flux_image.status === 'ok' ? <CheckCircleIcon /> : <ErrorIcon />}
                        label={`HTTP ${probeResults.flux_image.http_status} (${probeResults.flux_image.latency_ms}ms)`}
                        color={probeResults.flux_image.status === 'ok' ? 'success' : 'error'}
                        sx={{ fontWeight: 700 }}
                      />
                      <Chip
                        size="small"
                        label="1024x1024 Photorealistic"
                        variant="outlined"
                        sx={{ color: '#FA8C16', borderColor: '#FA8C16', fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    </Box>

                    <Alert
                      severity={probeResults.flux_image.status === 'ok' ? 'success' : 'error'}
                      sx={{ mb: 2, borderRadius: 2 }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {probeResults.flux_image.message}
                      </Typography>
                    </Alert>

                    {probeResults.flux_image.thumbnail_url && (
                      <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
                          Live 1024x1024 Output Thumbnail:
                        </Typography>
                        <Box
                          component="img"
                          src={probeResults.flux_image.thumbnail_url}
                          alt="Flux Output"
                          sx={{
                            width: 180,
                            height: 180,
                            borderRadius: 2,
                            objectFit: 'cover',
                            border: '2px solid #FA8C16',
                            boxShadow: '0 4px 16px rgba(250, 140, 22, 0.3)'
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#64748B', flexGrow: 1 }}>
                    <Typography variant="body2">No probe executed yet. Click "Run Probe" to test Cloudflare FLUX.</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* 3. GROQ ACID AUDITOR PROBE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(0, 210, 255, 0.25)', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BoltIcon sx={{ color: '#00D2FF', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                        Groq LPU ACID Compliance Auditor
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Model: <code>openai/gpt-oss-120b</code> / <code>llama-3.3-70b</code>
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={probingEngine === 'groq_acid' ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                    onClick={() => runProbe('groq_acid')}
                    disabled={probingEngine === 'groq_acid'}
                    sx={{ background: '#00D2FF', color: '#121212', fontWeight: 800 }}
                  >
                    Run Probe
                  </Button>
                </Box>

                <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                {probeResults.groq_acid ? (
                  <Box>
                    <Chip
                      size="small"
                      icon={probeResults.groq_acid.status === 'ok' ? <CheckCircleIcon /> : <ErrorIcon />}
                      label={`HTTP ${probeResults.groq_acid.http_status} (${probeResults.groq_acid.latency_ms}ms)`}
                      color={probeResults.groq_acid.status === 'ok' ? 'success' : 'error'}
                      sx={{ fontWeight: 700, mb: 1.5 }}
                    />
                    <Alert severity={probeResults.groq_acid.status === 'ok' ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">{probeResults.groq_acid.message}</Typography>
                    </Alert>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748B', py: 3, textAlign: 'center' }}>
                    Click "Run Probe" to measure Groq LPU latency and response.
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* 4. GEMINI VISION AUDITOR PROBE */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(16, 185, 129, 0.25)', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                        Google Gemini Vision Auditor
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Model: <code>gemini-2.5-flash</code> (Multimodal OCR & Adjudication)
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={probingEngine === 'gemini_vision' ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
                    onClick={() => runProbe('gemini_vision')}
                    disabled={probingEngine === 'gemini_vision'}
                    sx={{ background: '#10B981', color: '#121212', fontWeight: 800 }}
                  >
                    Run Probe
                  </Button>
                </Box>

                <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                {probeResults.gemini_vision ? (
                  <Box>
                    <Chip
                      size="small"
                      icon={probeResults.gemini_vision.status === 'ok' ? <CheckCircleIcon /> : <ErrorIcon />}
                      label={`HTTP ${probeResults.gemini_vision.http_status} (${probeResults.gemini_vision.latency_ms}ms)`}
                      color={probeResults.gemini_vision.status === 'ok' ? 'success' : 'error'}
                      sx={{ fontWeight: 700, mb: 1.5 }}
                    />
                    <Alert severity={probeResults.gemini_vision.status === 'ok' ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">{probeResults.gemini_vision.message}</Typography>
                    </Alert>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748B', py: 3, textAlign: 'center' }}>
                    Click "Run Probe" to test Gemini Vision multimodal capability.
                  </Typography>
                )}
              </Paper>
            </Grid>

          </Grid>
        </Box>
      )}

      {/* =========================================================================
          SUB-TAB 3: IMAGE AGENT PIPELINE ROUTING
         ========================================================================= */}
      {activeSubTab === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              
              <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                    🎨 Visual Generation Pipeline Architecture
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Controls default engine routing, aspect ratios, thinking parameters, and negative prompts for all campaigns.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={savingConfig ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  sx={{
                    background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                    color: '#121212',
                    fontWeight: 800,
                    px: 2.5
                  }}
                >
                  Save Pipeline Config
                </Button>
              </Box>

              {configFeedback && (
                <Alert
                  severity={configFeedback.type}
                  sx={{ mb: 3, borderRadius: 2 }}
                  onClose={() => setConfigFeedback(null)}
                >
                  {configFeedback.text}
                </Alert>
              )}

              {/* 1. DEFAULT ENGINE ROUTING */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F5A623', mb: 1 }}>
                PRIMARY INFERENCE ENGINE
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  {
                    id: 'gemini',
                    title: 'Google Gemini (Primary with Cloudflare Flux Auto-Fallback)',
                    sub: 'Recommended. Uses Gemini 3.1 Flash Image. Automatically falls back to Cloudflare Flux if free quota is 0.',
                    color: '#F5A623'
                  },
                  {
                    id: 'flux',
                    title: 'Cloudflare FLUX-1-Schnell (Direct Dedicated)',
                    sub: 'Fastest (~2.5s). Pure 1024x1024 photorealistic output directly without checking Gemini.',
                    color: '#FA8C16'
                  },
                  {
                    id: 'gemini_strict',
                    title: 'Google Gemini Strict Mode (No Fallback)',
                    sub: 'Fails immediately if Gemini quota is exceeded without triggering Flux.',
                    color: '#EF4444'
                  }
                ].map(opt => {
                  const selected = imageConfig.default_engine === opt.id;
                  return (
                    <Grid size={{ xs: 12 }} key={opt.id}>
                      <Paper
                        onClick={() => setImageConfig(prev => ({ ...prev, default_engine: opt.id }))}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          borderRadius: 2,
                          background: selected ? 'rgba(245, 166, 35, 0.1)' : 'rgba(15, 18, 24, 0.7)',
                          border: selected ? `2px solid ${opt.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                          transition: 'all 0.2s ease',
                          '&:hover': { borderColor: opt.color }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: selected ? opt.color : '#F0F3F6' }}>
                            {opt.title}
                          </Typography>
                          {selected && <CheckCircleIcon sx={{ color: opt.color, fontSize: 20 }} />}
                        </Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                          {opt.sub}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>

              {/* 2. PARAMETERS */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gemini Model Version</InputLabel>
                    <Select
                      value={imageConfig.gemini_model}
                      label="Gemini Model Version"
                      onChange={(e) => setImageConfig(prev => ({ ...prev, gemini_model: e.target.value }))}
                    >
                      <MenuItem value="gemini-3.1-flash-image">gemini-3.1-flash-image (Latest)</MenuItem>
                      <MenuItem value="gemini-2.5-flash-image">gemini-2.5-flash-image</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Thinking Config Level</InputLabel>
                    <Select
                      value={imageConfig.thinking_level}
                      label="Thinking Config Level"
                      onChange={(e) => setImageConfig(prev => ({ ...prev, thinking_level: e.target.value }))}
                    >
                      <MenuItem value="High">High (Deep reasoning)</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low (Fastest)</MenuItem>
                      <MenuItem value="Off">Off</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Aspect Ratio</InputLabel>
                    <Select
                      value={imageConfig.aspect_ratio}
                      label="Aspect Ratio"
                      onChange={(e) => setImageConfig(prev => ({ ...prev, aspect_ratio: e.target.value }))}
                    >
                      <MenuItem value="1:1">1:1 Square (1024×1024) [Standard]</MenuItem>
                      <MenuItem value="4:5">4:5 Vertical (Instagram)</MenuItem>
                      <MenuItem value="16:9">16:9 Landscape (Hero Banner)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* 3. NEGATIVE PROMPT GUARDRAILS */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F0F3F6', mb: 0.8 }}>
                  Brand Safety & Negative Prompts
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  value={imageConfig.negative_prompt}
                  onChange={(e) => setImageConfig(prev => ({ ...prev, negative_prompt: e.target.value }))}
                  helperText="These keywords are injected into every prompt to prevent text hallucination or distorted visuals."
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={imageConfig.auto_fallback_to_flux}
                    onChange={(e) => setImageConfig(prev => ({ ...prev, auto_fallback_to_flux: e.target.checked }))}
                    color="warning"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#CBD5E1' }}>
                    Enable Automatic Zero-Downtime Fallback to Cloudflare FLUX-1-Schnell on Gemini 429 Quota Exceeded
                  </Typography>
                }
              />

            </Paper>
          </Grid>

          {/* ACTIVE BRAND SUMMARY */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F0F3F6', mb: 1 }}>
                🎯 Active Brand Context
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                Current brand whose visual guidelines are enforced:
              </Typography>

              <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(15, 18, 24, 0.8)', border: '1px solid rgba(245, 166, 35, 0.2)', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#F5A623' }}>
                  {clientData?.name || 'Unbox-ED'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                  Industry: {clientData?.industry || 'edtech'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                  Voice: {clientData?.brand_voice || 'Warm, authoritative, inspiring'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                  Primary Product: {clientData?.usps?.products?.[0]?.name || 'Orator Unbox-ED'}
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.5 }}>
                When you click "Generate AI Image" in Creative Studio, the prompt combines the post narrative, brand visual guidelines, and your active engine configuration above.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* =========================================================================
          SUB-TAB 4: TELEMETRY & PROBE AUDIT LOGS
         ========================================================================= */}
      {activeSubTab === 3 && (
        <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(18, 21, 28, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                📊 Real-Time Diagnostic Telemetry & Audit Logs
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                Live record of generation requests, latency benchmarks, and quota events across all engines.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={loadingLogs ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
              onClick={fetchLogs}
              sx={{ color: '#F5A623', borderColor: 'rgba(245, 166, 35, 0.4)', fontWeight: 700 }}
            >
              Refresh Logs
            </Button>
          </Box>

          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#14171F', color: '#94A3B8', fontWeight: 700 }}>Timestamp</TableCell>
                  <TableCell sx={{ backgroundColor: '#14171F', color: '#94A3B8', fontWeight: 700 }}>Engine / Model</TableCell>
                  <TableCell sx={{ backgroundColor: '#14171F', color: '#94A3B8', fontWeight: 700 }}>Latency</TableCell>
                  <TableCell sx={{ backgroundColor: '#14171F', color: '#94A3B8', fontWeight: 700 }}>HTTP Status</TableCell>
                  <TableCell sx={{ backgroundColor: '#14171F', color: '#94A3B8', fontWeight: 700 }}>Diagnostic Message</TableCell>
                  <TableCell sx={{ backgroundColor: '#14171F', color: '#94A3B8', fontWeight: 700 }}>Thumbnail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {probeLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
                      No probe telemetry recorded yet. Run a probe in Sub-Tab 2 to populate live data.
                    </TableCell>
                  </TableRow>
                ) : (
                  probeLogs.map((log, idx) => (
                    <TableRow key={idx} hover sx={{ '&:hover': { backgroundColor: 'rgba(245, 166, 35, 0.04)' } }}>
                      <TableCell sx={{ color: '#64748B', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {log.timestamp || 'Just now'}
                      </TableCell>
                      <TableCell sx={{ color: '#F0F3F6', fontWeight: 600 }}>
                        {log.engine}
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem' }}>
                          {log.model}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: log.latency_ms < 1500 ? '#10B981' : log.latency_ms < 4000 ? '#F5A623' : '#EF4444', fontWeight: 700 }}>
                        {log.latency_ms} ms
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={log.http_status}
                          color={log.status === 'ok' ? 'success' : 'error'}
                          sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#CBD5E1', fontSize: '0.8rem', maxWidth: 380 }}>
                        {log.message}
                        {log.suggested_fix && (
                          <Typography variant="caption" sx={{ color: '#F5A623', display: 'block', mt: 0.3 }}>
                            {log.suggested_fix}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.thumbnail_url ? (
                          <Box
                            component="img"
                            src={log.thumbnail_url}
                            alt="thumb"
                            sx={{ width: 44, height: 44, borderRadius: 1, objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: '#64748B' }}>—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

    </Box>
  );
}
