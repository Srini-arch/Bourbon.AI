import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, Slider, FormControl,
  InputLabel, Select, MenuItem, Chip, CircularProgress, IconButton, Alert,
  Divider, Stack, Tooltip, Tab, Tabs, Card, CardContent, Switch, FormControlLabel
} from '@mui/material';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BoltIcon from '@mui/icons-material/Bolt';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CodeIcon from '@mui/icons-material/Code';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TuneIcon from '@mui/icons-material/Tune';
import LayersIcon from '@mui/icons-material/Layers';
import SecurityIcon from '@mui/icons-material/Security';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PaletteIcon from '@mui/icons-material/Palette';
import GridOnIcon from '@mui/icons-material/GridOn';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function BbnWorkstation({ clientData, onOpenSettings }) {
  // BBN Package list & current selection
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState('');
  
  // Current active BBN package data
  const [bbnData, setBbnData] = useState(null);
  const [loadingPackage, setLoadingPackage] = useState(false);
  const [savingPackage, setSavingPackage] = useState(false);
  const [publishingDeliverable, setPublishingDeliverable] = useState(false);
  const [publishedResult, setPublishedResult] = useState(null);

  // Workstation navigation tab
  const [workTab, setWorkTab] = useState(0); // 0: Phase 2 Compositing, 1: Phase 1 GenAI & Prompt Deltas, 2: Swarm Audit & Governance, 3: Raw BBN Manifest

  // Phase 1 Generative state
  const [refinePrompt, setRefinePrompt] = useState('Natural morning daylight, subtle bokeh');
  const [refiningVisual, setRefiningVisual] = useState(false);
  const [aiEngine, setAiEngine] = useState('flux');

  // Phase 2 Compositing state
  const [templateType, setTemplateType] = useState('ambient_bottom');
  const [mainHeadline, setMainHeadline] = useState('Raise Money-Smart Kids.');
  const [accentCallout, setAccentCallout] = useState('Unbox It.');
  const [fontSize, setFontSize] = useState(44);
  const [accentFontSize, setAccentFontSize] = useState(52);
  const [bannerOpacity, setBannerOpacity] = useState(0.88);
  const [accentColor, setAccentColor] = useState('#F5A623');
  const [copyText, setCopyText] = useState('');
  const [ctaText, setCtaText] = useState('Claim Free Interactive Session');

  // Preview & Canvas controls
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState(false);

  // Raw JSON Manifest state
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // Notifications
  const [toastMsg, setToastMsg] = useState(null);
  const [toastSeverity, setToastSeverity] = useState('success');

  const previewAbortRef = useRef(null);

  const showToast = (msg, sev = 'success') => {
    setToastMsg(msg);
    setToastSeverity(sev);
  };

  // 1. Fetch available BBN packages
  const fetchBbnPackages = async (targetToSelect = null) => {
    setLoadingPackages(true);
    try {
      const res = await fetch(`${API_BASE}/api/bbn/files`);
      const data = await res.json();
      if (data.status === 'ok' && data.packages) {
        setPackages(data.packages);
        const defaultPath = targetToSelect || (data.packages.length > 0 ? data.packages[0].file_path : '');
        if (defaultPath && (!selectedFilePath || targetToSelect)) {
          setSelectedFilePath(defaultPath);
          loadBbnPackage(defaultPath);
        }
      }
    } catch (err) {
      console.error('Failed to load BBN packages:', err);
      showToast('Could not reach backend to list .bbn packages', 'error');
    } finally {
      setLoadingPackages(false);
    }
  };

  // 2. Load specific BBN Package
  const loadBbnPackage = async (filePath) => {
    if (!filePath) return;
    setLoadingPackage(true);
    try {
      const res = await fetch(`${API_BASE}/api/bbn/file?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.status === 'ok' && data.bbn_data) {
        const d = data.bbn_data;
        setBbnData(d);
        setSelectedFilePath(filePath);

        // Populate Phase 1 state
        const p1 = d.phase_1_genai || {};
        setAiEngine(p1.engine || 'flux');

        // Populate Phase 2 state
        const p2 = d.phase_2_compositing || {};
        const typo = p2.typography || {};
        setTemplateType(p2.template_type || 'ambient_bottom');
        setMainHeadline(typo.main_headline || 'Raise Money-Smart Kids.');
        setAccentCallout(typo.accent_callout || 'Unbox It.');
        setFontSize(typo.font_size || 44);
        setAccentFontSize(typo.accent_font_size || 52);
        setAccentColor(typo.accent_color || '#F5A623');
        setBannerOpacity(p2.banner?.opacity !== undefined ? p2.banner.opacity : 0.88);
        setCopyText(p2.copy || '');
        setCtaText(p2.cta || 'Claim Free Interactive Session');

        // Check if already published
        if (p2.published_master_url) {
          setPublishedResult({
            published_url: p2.published_master_url,
            message: 'Loaded published master asset.'
          });
        } else {
          setPublishedResult(null);
        }

        // Populate JSON text
        setJsonText(JSON.stringify(d, null, 2));
        setJsonError(null);

        showToast(`Loaded BBN package: ${d.project_meta?.title || filePath}`);
      } else {
        showToast(data.detail || 'Failed to load BBN package', 'error');
      }
    } catch (err) {
      console.error('Failed to load package:', err);
      showToast('Error loading BBN file.', 'error');
    } finally {
      setLoadingPackage(false);
    }
  };

  useEffect(() => {
    fetchBbnPackages('outputs/clients/client_unbox_ed_05/campaign_1_pane3_action.bbn');
  }, []);

  // 3. Debounced Live Canvas Preview Rendering
  const updateCanvasPreview = async () => {
    if (!bbnData) return;
    const rawAsset = bbnData.phase_1_genai?.raw_asset_path || 'outputs/flux_test_image.png';

    if (previewAbortRef.current) {
      previewAbortRef.current.abort();
    }
    const controller = new AbortController();
    previewAbortRef.current = controller;

    setLoadingPreview(true);
    try {
      const res = await fetch(`${API_BASE}/api/compositor/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          image_path: rawAsset,
          template_type: templateType,
          main_headline: mainHeadline,
          accent_callout: accentCallout,
          font_size: fontSize,
          accent_font_size: accentFontSize,
          banner_opacity: bannerOpacity,
          accent_color_hex: accentColor
        })
      });
      const data = await res.json();
      if (data.preview_data_url) {
        setPreviewDataUrl(data.preview_data_url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to update live composite preview:', err);
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (bbnData) {
      const timer = setTimeout(() => {
        updateCanvasPreview();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [
    bbnData?.phase_1_genai?.raw_asset_path,
    templateType,
    mainHeadline,
    accentCallout,
    fontSize,
    accentFontSize,
    bannerOpacity,
    accentColor
  ]);

  // Keep internal bbnData in sync with local UI field adjustments
  const syncLocalEditsToBbnData = () => {
    if (!bbnData) return null;
    const updated = JSON.parse(JSON.stringify(bbnData));
    
    // Phase 1
    if (!updated.phase_1_genai) updated.phase_1_genai = {};
    updated.phase_1_genai.engine = aiEngine;

    // Phase 2
    if (!updated.phase_2_compositing) updated.phase_2_compositing = {};
    updated.phase_2_compositing.template_type = templateType;
    if (!updated.phase_2_compositing.typography) updated.phase_2_compositing.typography = {};
    updated.phase_2_compositing.typography.main_headline = mainHeadline;
    updated.phase_2_compositing.typography.accent_callout = accentCallout;
    updated.phase_2_compositing.typography.font_size = fontSize;
    updated.phase_2_compositing.typography.accent_font_size = accentFontSize;
    updated.phase_2_compositing.typography.accent_color = accentColor;
    if (!updated.phase_2_compositing.banner) updated.phase_2_compositing.banner = {};
    updated.phase_2_compositing.banner.opacity = bannerOpacity;
    updated.phase_2_compositing.banner.style = templateType === 'ambient_bottom' ? 'hermite_gradient' : 'frosted_glass';
    updated.phase_2_compositing.copy = copyText;
    updated.phase_2_compositing.cta = ctaText;

    return updated;
  };

  // 4. Save Package (.bbn)
  const handleSavePackage = async () => {
    const updated = syncLocalEditsToBbnData();
    if (!updated) return;
    setSavingPackage(true);
    try {
      const res = await fetch(`${API_BASE}/api/bbn/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: selectedFilePath,
          bbn_data: updated
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setBbnData(data.bbn_data);
        setJsonText(JSON.stringify(data.bbn_data, null, 2));
        showToast(`Saved package to ${data.file_path}!`);
        fetchBbnPackages(selectedFilePath);
      } else {
        showToast(data.detail || 'Save failed', 'error');
      }
    } catch (err) {
      console.error('Failed to save BBN file:', err);
      showToast('Error saving package.', 'error');
    } finally {
      setSavingPackage(false);
    }
  };

  // 5. Phase 1 Swarm Visual Refinement (Prompt Delta with Composition Lock)
  const handleRefineVisual = async () => {
    if (!refinePrompt.trim() || !bbnData) return;
    setRefiningVisual(true);
    try {
      const updated = syncLocalEditsToBbnData();
      const res = await fetch(`${API_BASE}/api/bbn/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: selectedFilePath,
          modification_prompt: refinePrompt,
          engine: aiEngine,
          bbn_data: updated
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setBbnData(data.bbn_data);
        setJsonText(JSON.stringify(data.bbn_data, null, 2));
        showToast(`Visual Refined via ${data.engine_used.toUpperCase()}! Applied delta with composition lock.`);
      } else {
        showToast(data.detail || 'Refinement failed', 'error');
      }
    } catch (err) {
      console.error('Refine failed:', err);
      showToast('Refinement request failed.', 'error');
    } finally {
      setRefiningVisual(false);
    }
  };

  // 6. Phase 2 Master Publication (300 DPI Render & Production Lock)
  const handlePublishDeliverable = async () => {
    const updated = syncLocalEditsToBbnData();
    if (!updated) return;
    setPublishingDeliverable(true);
    try {
      const res = await fetch(`${API_BASE}/api/bbn/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: selectedFilePath,
          bbn_data: updated
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setBbnData(data.bbn_data);
        setPublishedResult(data);
        if (data.preview_data_url) {
          setPreviewDataUrl(data.preview_data_url);
        }
        setJsonText(JSON.stringify(data.bbn_data, null, 2));
        showToast(`🚀 Published 300 DPI Master Deliverable! Package locked for production.`);
        fetchBbnPackages(selectedFilePath);
      } else {
        showToast(data.detail || 'Publication failed', 'error');
      }
    } catch (err) {
      console.error('Publish error:', err);
      showToast('Publication failed.', 'error');
    } finally {
      setPublishingDeliverable(false);
    }
  };

  // 7. Handle Raw JSON Manifest Updates
  const handleJsonChange = (newVal) => {
    setJsonText(newVal);
    try {
      const parsed = JSON.parse(newVal);
      setJsonError(null);
      setBbnData(parsed);

      // Synchronize input fields
      const p1 = parsed.phase_1_genai || {};
      const p2 = parsed.phase_2_compositing || {};
      const typo = p2.typography || {};

      if (p1.engine) setAiEngine(p1.engine);
      if (p2.template_type) setTemplateType(p2.template_type);
      if (typo.main_headline) setMainHeadline(typo.main_headline);
      if (typo.accent_callout) setAccentCallout(typo.accent_callout);
      if (typo.font_size) setFontSize(typo.font_size);
      if (typo.accent_font_size) setAccentFontSize(typo.accent_font_size);
      if (typo.accent_color) setAccentColor(typo.accent_color);
      if (p2.banner?.opacity !== undefined) setBannerOpacity(p2.banner.opacity);
      if (p2.copy !== undefined) setCopyText(p2.copy);
      if (p2.cta !== undefined) setCtaText(p2.cta);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  // 8. Create a New BBN Package
  const handleCreateNewPackage = () => {
    const timestamp = Date.now();
    const newId = `bbn_${timestamp.toString(16)}`;
    const newPackage = {
      schema_version: "2.5",
      project_meta: {
        bbn_id: newId,
        client_id: clientData?.client_id || "client_unbox_ed_05",
        campaign_id: "camp_custom_q4",
        title: "Pane 1: Attention & Hook - New Package",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lock_status: "DRAFT_EDITABLE"
      },
      brand_governance: {
        client_name: clientData?.name || "Unbox-ED",
        enforce_strict_palette: true,
        allowed_hex_codes: ["#FFFFFF", "#0B132B", "#F5A623", "#1C2541"],
        mandatory_badges: ["standard_card_203x69"],
        disallowed_terms: ["guarantee 100%", "cheap", "no risk"]
      },
      phase_1_genai: {
        engine: "flux",
        base_prompt: "Young Indian student smiling in a modern educational environment, cinematic 1:1, photoreal",
        prompt_deltas: [],
        combined_prompt: "Young Indian student smiling in a modern educational environment, cinematic 1:1, photoreal",
        raw_asset_path: "outputs/flux_test_image.png",
        raw_asset_url: "/outputs/flux_test_image.png",
        asset_hash: "sha256:default",
        aspect_ratio: "1:1",
        seed: Math.floor(Math.random() * 1000000)
      },
      phase_2_compositing: {
        template_type: "ambient_bottom",
        typography: {
          main_headline: "Discover Natural Confidence.",
          font_size: 44,
          font_family: "Segoe UI Bold",
          accent_callout: "Unbox It.",
          accent_font_size: 52,
          accent_color: "#F5A623"
        },
        banner: {
          style: "hermite_gradient",
          opacity: 0.88
        },
        branding: {
          badge: "standard_card_203x69"
        },
        copy: "Help your child explore experiential learning cohorts led by dedicated educators.",
        cta: "Book a Free 1-on-1 Cohort Session",
        published_master_url: ""
      },
      swarm_audit_trail: {
        consensus_score: 9.6,
        debate_rounds: 3,
        critique_history: [
          {
            agent: "BrandEnforcerAgent",
            verdict: "APPROVED",
            notes: "Initial template conforms to Unbox-ED strict color tokens and standard 203x69 badge."
          }
        ]
      }
    };

    const newPath = `outputs/clients/${newPackage.project_meta.client_id}/${newId}.bbn`;
    setBbnData(newPackage);
    setSelectedFilePath(newPath);
    setJsonText(JSON.stringify(newPackage, null, 2));
    setTemplateType("ambient_bottom");
    setMainHeadline("Discover Natural Confidence.");
    setAccentCallout("Unbox It.");
    setFontSize(44);
    setAccentFontSize(52);
    setBannerOpacity(0.88);
    setAccentColor("#F5A623");
    setCopyText(newPackage.phase_2_compositing.copy);
    setCtaText(newPackage.phase_2_compositing.cta);
    setPublishedResult(null);
    showToast(`Initialized fresh BBN package template (${newId}). Click Save to persist.`);
  };

  // Check Disallowed Terms for Brand Governance
  const checkForDisallowedTerms = () => {
    if (!bbnData?.brand_governance?.disallowed_terms) return [];
    const forbidden = bbnData.brand_governance.disallowed_terms;
    const combined = `${mainHeadline} ${accentCallout} ${copyText} ${ctaText}`.toLowerCase();
    return forbidden.filter(term => combined.includes(term.toLowerCase()));
  };

  const detectedForbiddenTerms = checkForDisallowedTerms();
  const isLocked = bbnData?.project_meta?.lock_status === 'LOCKED_FOR_PRODUCTION';
  const consensusScore = bbnData?.swarm_audit_trail?.consensus_score || 9.5;

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
      {toastMsg && (
        <Alert severity={toastSeverity} sx={{ mb: 2 }} onClose={() => setToastMsg(null)}>
          {toastMsg}
        </Alert>
      )}

      {/* WORKSTATION COMMAND BAR & PACKAGE SELECTOR */}
      <Paper sx={{ p: 2, mb: 2.5, borderRadius: 2, background: 'rgba(18, 21, 28, 0.95)', border: '1px solid rgba(245, 166, 35, 0.25)' }}>
        <Grid container spacing={2} alignItems="center">
          
          {/* Active Package Dropdown */}
          <Grid item xs={12} md={4.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 1.5,
                  background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#121212',
                  boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)'
                }}
              >
                <LayersIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Active .BBN Package</InputLabel>
                  <Select
                    value={selectedFilePath}
                    label="Active .BBN Package"
                    onChange={(e) => loadBbnPackage(e.target.value)}
                  >
                    {packages.map((pkg) => (
                      <MenuItem key={pkg.file_path} value={pkg.file_path}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {pkg.title || pkg.filename}
                          </Typography>
                          <Stack direction="row" spacing={0.5}>
                            <Chip
                              label={pkg.template_type}
                              size="small"
                              sx={{ fontSize: '0.65rem', height: 18, background: 'rgba(255,255,255,0.06)' }}
                            />
                            <Chip
                              label={pkg.lock_status === 'LOCKED_FOR_PRODUCTION' ? 'LOCKED' : 'DRAFT'}
                              size="small"
                              color={pkg.lock_status === 'LOCKED_FOR_PRODUCTION' ? 'success' : 'warning'}
                              sx={{ fontSize: '0.65rem', height: 18 }}
                            />
                          </Stack>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Grid>

          {/* Quick Badges & Actions */}
          <Grid item xs={12} md={7.5}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.2, flexWrap: 'wrap' }}>
              
              {/* Lock Status Chip */}
              <Chip
                icon={isLocked ? <LockIcon sx={{ fontSize: '14px !important' }} /> : <LockOpenIcon sx={{ fontSize: '14px !important' }} />}
                label={isLocked ? 'LOCKED FOR PRODUCTION' : 'DRAFT EDITABLE'}
                color={isLocked ? 'success' : 'warning'}
                variant="outlined"
                size="small"
                sx={{ fontWeight: 800, fontSize: '0.72rem' }}
              />

              {/* Swarm Consensus Score */}
              <Chip
                icon={<VerifiedUserIcon sx={{ fontSize: '14px !important' }} />}
                label={`Consensus: ${consensusScore.toFixed(1)}/10`}
                sx={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontWeight: 800,
                  fontSize: '0.72rem'
                }}
                size="small"
              />

              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => loadBbnPackage(selectedFilePath)}
                disabled={loadingPackage}
                sx={{ borderColor: 'rgba(245,166,35,0.3)', color: '#F5A623', fontSize: '0.75rem' }}
              >
                Reload
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreateNewPackage}
                sx={{ borderColor: 'rgba(0,210,255,0.3)', color: '#00D2FF', fontSize: '0.75rem' }}
              >
                New .BBN
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={savingPackage ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                onClick={handleSavePackage}
                disabled={savingPackage || isLocked}
                sx={{
                  background: '#1877F2',
                  '&:hover': { background: '#166FE5' },
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
              >
                {savingPackage ? 'Saving...' : 'Save Package'}
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={publishingDeliverable ? <CircularProgress size={14} color="inherit" /> : <RocketLaunchIcon />}
                onClick={handlePublishDeliverable}
                disabled={publishingDeliverable}
                sx={{
                  background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                  color: '#121212',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  boxShadow: '0 4px 14px rgba(245, 166, 35, 0.4)'
                }}
              >
                {publishingDeliverable ? 'Publishing...' : '🚀 Publish 300 DPI'}
              </Button>

            </Box>
          </Grid>

        </Grid>
      </Paper>

      {/* DETECTED BRAND GOVERNANCE VIOLATION WARNING */}
      {detectedForbiddenTerms.length > 0 && (
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>
          <strong>Brand Governance Violation Detected:</strong> The copy contains disallowed terms: &quot;{detectedForbiddenTerms.join(', ')}&quot;. Unbox-ED strict governance prohibits promotional guarantees or cheapening vocabulary.
        </Alert>
      )}

      {/* MAIN WORKSTATION WORKSPACE (2-COLUMN GRID) */}
      <Grid container spacing={2.5}>
        
        {/* LEFT COLUMN: PHASE WORKSPACES & CONTROLS (5 / 12) */}
        <Grid item xs={12} lg={5.2}>
          <Paper sx={{ p: 2.2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* WORKSTATION TABS */}
            <Tabs
              value={workTab}
              onChange={(e, val) => setWorkTab(val)}
              textColor="primary"
              indicatorColor="primary"
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab
                label="🎨 Phase 2: Compositing"
                sx={{ fontSize: '0.74rem', textTransform: 'none', fontWeight: 700 }}
              />
              <Tab
                label="⚡ Phase 1: GenAI & Deltas"
                sx={{ fontSize: '0.74rem', textTransform: 'none', fontWeight: 700 }}
              />
              <Tab
                label="🛡️ Swarm Audit"
                sx={{ fontSize: '0.74rem', textTransform: 'none', fontWeight: 700 }}
              />
              <Tab
                label="💻 .BBN Manifest"
                sx={{ fontSize: '0.74rem', textTransform: 'none', fontWeight: 700 }}
              />
            </Tabs>

            {/* TAB 0: PHASE 2 COMPOSITING & TYPOGRAPHY */}
            {workTab === 0 && (
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: '#F5A623', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
                  Phase 2 Layout & Typography Engine
                </Typography>

                <Stack spacing={2}>
                  {/* Template Archetype Selector */}
                  <FormControl fullWidth size="small">
                    <InputLabel>Layout Template Archetype</InputLabel>
                    <Select
                      value={templateType}
                      label="Layout Template Archetype"
                      onChange={(e) => setTemplateType(e.target.value)}
                    >
                      <MenuItem value="ambient_bottom">Ambient Bottom Hermite Banner (Campaign 1 Standard)</MenuItem>
                      <MenuItem value="top_overlay">Top Frosted Header Bar (Campaign 2 Standard)</MenuItem>
                      <MenuItem value="top_header_bar">Dedicated Top Header Bar with Navy Trim</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Split Headline Inputs */}
                  <Grid container spacing={1.5}>
                    <Grid item xs={7.5}>
                      <TextField
                        label="Main Headline (White Text)"
                        size="small"
                        fullWidth
                        value={mainHeadline}
                        onChange={(e) => setMainHeadline(e.target.value)}
                        helperText="Primary statement (Segoe UI Bold)"
                      />
                    </Grid>
                    <Grid item xs={4.5}>
                      <TextField
                        label="Accent Brand Callout"
                        size="small"
                        fullWidth
                        value={accentCallout}
                        onChange={(e) => setAccentCallout(e.target.value)}
                        helperText="e.g. 'Unbox It.'"
                      />
                    </Grid>
                  </Grid>

                  {/* Typographic Sliders */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Main Font Size: <strong>{fontSize}px</strong>
                      </Typography>
                      <Slider
                        value={fontSize}
                        min={32}
                        max={54}
                        step={1}
                        size="small"
                        onChange={(e, val) => setFontSize(val)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Accent Font Size: <strong>{accentFontSize}px</strong>
                      </Typography>
                      <Slider
                        value={accentFontSize}
                        min={40}
                        max={62}
                        step={1}
                        size="small"
                        onChange={(e, val) => setAccentFontSize(val)}
                      />
                    </Grid>
                  </Grid>

                  {/* Banner Opacity & Accent Color */}
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Banner Opacity: <strong>{Math.round(bannerOpacity * 100)}%</strong>
                      </Typography>
                      <Slider
                        value={bannerOpacity}
                        min={0.6}
                        max={1.0}
                        step={0.02}
                        size="small"
                        onChange={(e, val) => setBannerOpacity(val)}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 0.5 }}>
                        Accent Color: <strong>{accentColor}</strong>
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {['#F5A623', '#00D2FF', '#FFFFFF', '#4CAF50'].map(c => (
                          <Box
                            key={c}
                            onClick={() => setAccentColor(c)}
                            sx={{
                              width: 22, height: 22, borderRadius: '50%',
                              backgroundColor: c, cursor: 'pointer',
                              border: accentColor === c ? '2px solid #FFFFFF' : '1px solid rgba(0,0,0,0.4)',
                              boxShadow: accentColor === c ? `0 0 8px ${c}` : 'none'
                            }}
                          />
                        ))}
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Ad Copy & CTA */}
                  <TextField
                    label="Ad Story Copy"
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    value={copyText}
                    onChange={(e) => setCopyText(e.target.value)}
                  />

                  <TextField
                    label="Primary CTA Button"
                    size="small"
                    fullWidth
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                  />

                  {/* Brand Badging Specs */}
                  <Paper sx={{ p: 1.2, background: 'rgba(11, 13, 17, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ color: '#F0F3F6', fontWeight: 700, display: 'block' }}>
                          Standard Card Badge: 203×69px
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.68rem' }}>
                          Auto-centered Unbox-ED logo with crisp padding (14px H / 9px V, radius=6px)
                        </Typography>
                      </Box>
                      <Chip label="ENFORCED" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </Stack>
                  </Paper>
                </Stack>
              </Box>
            )}

            {/* TAB 1: PHASE 1 GENAI & PROMPT DELTAS */}
            {workTab === 1 && (
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: '#00D2FF', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
                  Phase 1 Raw GenAI Asset & Composition Lock
                </Typography>

                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>AI Generation Engine</InputLabel>
                    <Select
                      value={aiEngine}
                      label="AI Generation Engine"
                      onChange={(e) => setAiEngine(e.target.value)}
                    >
                      <MenuItem value="flux">⚡ Cloudflare FLUX-1-Schnell (Fast & Photoreal)</MenuItem>
                      <MenuItem value="gemini">🌟 Google Gemini Imagen</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Base Visual Prompt"
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    value={bbnData?.phase_1_genai?.base_prompt || ''}
                    InputProps={{ readOnly: isLocked }}
                    onChange={(e) => {
                      if (!bbnData) return;
                      const next = { ...bbnData };
                      if (!next.phase_1_genai) next.phase_1_genai = {};
                      next.phase_1_genai.base_prompt = e.target.value;
                      setBbnData(next);
                    }}
                    helperText="Underlying 1:1 photoreal scene framing"
                  />

                  {/* Refinement Prompt Delta Card */}
                  <Paper sx={{ p: 1.8, background: 'rgba(0, 210, 255, 0.05)', border: '1px dashed rgba(0, 210, 255, 0.35)', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#00D2FF', fontWeight: 800, display: 'block', mb: 1 }}>
                      ⚡ Refine Asset with Prompt Delta (Preserves Composition)
                    </Typography>
                    
                    <TextField
                      fullWidth
                      size="small"
                      label="Prompt Modification Delta"
                      placeholder="e.g. Natural morning daylight, subtle bokeh, student smiling..."
                      value={refinePrompt}
                      onChange={(e) => setRefinePrompt(e.target.value)}
                      disabled={isLocked}
                      sx={{ mb: 1.5 }}
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      size="small"
                      startIcon={refiningVisual ? <CircularProgress size={14} color="inherit" /> : <BoltIcon />}
                      onClick={handleRefineVisual}
                      disabled={refiningVisual || isLocked}
                      sx={{
                        background: 'linear-gradient(135deg, #00D2FF 0%, #0077FF 100%)',
                        fontWeight: 800,
                        fontSize: '0.76rem'
                      }}
                    >
                      {refiningVisual ? 'Synthesizing Refined Visual...' : 'Apply Prompt Delta with Lock'}
                    </Button>
                  </Paper>

                  {/* Prompt Delta Evolution History */}
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, display: 'block', mb: 0.8 }}>
                      Refinement Delta Evolution History:
                    </Typography>
                    <Stack spacing={0.8}>
                      {(bbnData?.phase_1_genai?.prompt_deltas || []).length === 0 ? (
                        <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                          No refinement deltas recorded yet. Initial master seed.
                        </Typography>
                      ) : (
                        bbnData.phase_1_genai.prompt_deltas.map((delta, i) => (
                          <Paper key={i} sx={{ p: 1, background: 'rgba(15, 18, 24, 0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1.5 }}>
                            <Typography variant="caption" sx={{ color: '#00D2FF', fontWeight: 700, display: 'block' }}>
                              Round {i + 1}:
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#E2E8F0', fontSize: '0.73rem' }}>
                              &quot;{delta}&quot;
                            </Typography>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  </Box>

                  {/* Technical Asset Metadata */}
                  <Paper sx={{ p: 1.2, background: 'rgba(11, 13, 17, 0.6)', borderRadius: 1.5 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Raw Asset Path:</Typography>
                        <Typography variant="caption" sx={{ color: '#E2E8F0', display: 'block', wordBreak: 'break-all' }}>
                          {bbnData?.phase_1_genai?.raw_asset_path || 'outputs/flux_test_image.png'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Aspect Ratio / Seed:</Typography>
                        <Typography variant="caption" sx={{ color: '#F5A623', fontWeight: 700, display: 'block' }}>
                          {bbnData?.phase_1_genai?.aspect_ratio || '1:1'} • Seed: {bbnData?.phase_1_genai?.seed || '551920'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Stack>
              </Box>
            )}

            {/* TAB 2: SWARM AUDIT & BRAND GOVERNANCE */}
            {workTab === 2 && (
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 800, textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
                  Swarm Intelligence Consensus & Brand Radar
                </Typography>

                <Stack spacing={2}>
                  {/* Consensus Meter */}
                  <Card sx={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#10B981' }}>
                            {consensusScore.toFixed(1)} / 10.0
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            Multi-Agent Swarm Consensus ({bbnData?.swarm_audit_trail?.debate_rounds || 3} Debate Rounds)
                          </Typography>
                        </Box>
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                          label="CONSENSUS REACHED"
                          color="success"
                          sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Brand Token Verification */}
                  <Paper sx={{ p: 1.5, background: 'rgba(11, 13, 17, 0.6)', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, display: 'block', mb: 1 }}>
                      Strict Token Palette Adherence:
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {(bbnData?.brand_governance?.allowed_hex_codes || ['#FFFFFF', '#0B132B', '#F5A623', '#1C2541']).map(hex => (
                        <Box key={hex} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 14, height: 14, borderRadius: 1, backgroundColor: hex, border: '1px solid rgba(255,255,255,0.2)' }} />
                          <Typography variant="caption" sx={{ color: '#E2E8F0', fontSize: '0.7rem' }}>{hex}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>

                  {/* Critic Audit History */}
                  <Typography variant="caption" sx={{ color: '#F0F3F6', fontWeight: 800, display: 'block' }}>
                    Agent Critique Audit Log:
                  </Typography>

                  <Stack spacing={1.2}>
                    {(bbnData?.swarm_audit_trail?.critique_history || []).map((critique, idx) => (
                      <Paper key={idx} sx={{ p: 1.4, background: 'rgba(20, 24, 32, 0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F5A623', fontSize: '0.8rem' }}>
                            🤖 {critique.agent}
                          </Typography>
                          <Chip
                            label={critique.verdict}
                            size="small"
                            color={critique.verdict === 'APPROVED' ? 'success' : 'warning'}
                            sx={{ fontSize: '0.65rem', height: 18, fontWeight: 800 }}
                          />
                        </Stack>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem', lineHeight: 1.4, display: 'block' }}>
                          {critique.notes}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Box>
            )}

            {/* TAB 3: RAW .BBN MANIFEST EDITOR */}
            {workTab === 3 && (
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#00D2FF', fontWeight: 800 }}>
                    💻 Canonical .BBN Package Manifest (v2.5)
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 13 }} />}
                    onClick={() => {
                      navigator.clipboard.writeText(jsonText);
                      showToast('Copied .BBN JSON to clipboard!');
                    }}
                    sx={{ fontSize: '0.7rem', color: '#94A3B8', py: 0.2 }}
                  >
                    Copy JSON
                  </Button>
                </Box>

                {jsonError && (
                  <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.72rem' }}>
                    JSON Syntax Error: {jsonError}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: '0.74rem',
                      backgroundColor: 'rgba(5, 7, 10, 0.85)',
                      color: '#00D2FF',
                      lineHeight: 1.45
                    }
                  }}
                />
              </Box>
            )}

          </Paper>
        </Grid>

        {/* RIGHT COLUMN: LIVE CANVAS & DELIVERABLE HUB (6.8 / 12) */}
        <Grid item xs={12} lg={6.8}>
          <Paper sx={{ p: 2.2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* CANVAS TOOLBAR */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  🖥️ Live Interactive Master Canvas
                </Typography>
                <Chip
                  label="1:1 Canvas (1024×1024)"
                  size="small"
                  sx={{ fontSize: '0.68rem', height: 20, background: 'rgba(245,166,35,0.1)', color: '#F5A623' }}
                />
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={showGridOverlay}
                      onChange={(e) => setShowGridOverlay(e.target.checked)}
                    />
                  }
                  label={<Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>Grid</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={showSafeZoneOverlay}
                      onChange={(e) => setShowSafeZoneOverlay(e.target.checked)}
                    />
                  }
                  label={<Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>Safe Zones</Typography>}
                />
              </Stack>
            </Box>

            {/* THE LIVE COMPOSITED CANVAS */}
            <Box
              sx={{
                flexGrow: 1,
                minHeight: 460,
                backgroundColor: '#040608',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 166, 35, 0.3)',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9)'
              }}
            >
              {/* Sync Status Badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  bgcolor: 'rgba(11, 13, 17, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid',
                  borderColor: loadingPreview ? 'rgba(245, 166, 35, 0.6)' : 'rgba(16, 185, 129, 0.5)',
                  px: 1.2,
                  py: 0.4,
                  borderRadius: 1.5,
                  zIndex: 5
                }}
              >
                {loadingPreview ? (
                  <>
                    <CircularProgress size={12} sx={{ color: '#F5A623' }} />
                    <Typography variant="caption" sx={{ color: '#F5A623', fontSize: '0.7rem', fontWeight: 700 }}>
                      Rendering Hermite Composite...
                    </Typography>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon sx={{ color: '#10B981', fontSize: 14 }} />
                    <Typography variant="caption" sx={{ color: '#10B981', fontSize: '0.7rem', fontWeight: 700 }}>
                      Live Synced
                    </Typography>
                  </>
                )}
              </Box>

              {/* Grid Overlay */}
              {showGridOverlay && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 4,
                    backgroundImage: 'linear-gradient(to right, rgba(0, 210, 255, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 210, 255, 0.15) 1px, transparent 1px)',
                    backgroundSize: '33.333% 33.333%'
                  }}
                />
              )}

              {/* Safe Zone Overlay */}
              {showSafeZoneOverlay && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 24, left: 28, right: 28, bottom: 24,
                    border: '1px dashed rgba(245, 166, 35, 0.6)',
                    pointerEvents: 'none',
                    zIndex: 4
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#F5A623', background: 'rgba(0,0,0,0.7)', px: 0.5, position: 'absolute', top: 4, left: 4 }}>
                    Safe Typography Margin
                  </Typography>
                </Box>
              )}

              {/* Main Image Display */}
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Live BBN Master Composite Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Stack alignItems="center" spacing={1}>
                  <CircularProgress size={28} sx={{ color: '#F5A623' }} />
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    Initializing Pillow/NumPy rendering pipeline...
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* PUBLISHED MASTER DELIVERABLE CARD */}
            {publishedResult && (
              <Box sx={{ mt: 2, p: 1.5, borderRadius: 1.5, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#10B981', fontWeight: 800, lineHeight: 1.1 }}>
                      300 DPI Deliverable Locked & Published!
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Deliverable Asset: {publishedResult.published_url}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<DownloadIcon />}
                  href={publishedResult.published_url}
                  download
                  target="_blank"
                  sx={{
                    background: '#10B981',
                    '&:hover': { background: '#059669' },
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.72rem'
                  }}
                >
                  Download Master
                </Button>
              </Box>
            )}

            {/* DELIVERABLE METRICS & FAST ACTIONS FOOTER */}
            <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Canvas Resolution</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#F0F3F6' }}>1024×1024 (1:1)</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Brand Logo Badge</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#4B9BFF' }}>203×69px Card</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Compositing Hermite</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#F5A623' }}>{templateType}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      if (!previewDataUrl) return;
                      const a = document.createElement('a');
                      a.href = previewDataUrl;
                      a.download = `${bbnData?.project_meta?.bbn_id || 'bbn_master'}_1080x1080.png`;
                      a.click();
                      showToast('Downloaded current 1080×1080 PNG!');
                    }}
                    sx={{ borderColor: 'rgba(245, 166, 35, 0.4)', color: '#F5A623', fontSize: '0.72rem' }}
                  >
                    Quick PNG
                  </Button>
                </Grid>
              </Grid>
            </Box>

          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}
