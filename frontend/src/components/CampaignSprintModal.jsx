import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  TextField, Button, FormControl, InputLabel, Select, MenuItem, Chip,
  Stack, Grid, Paper, CircularProgress, Alert, Divider, Slider,
  LinearProgress, ToggleButton, ToggleButtonGroup, Tooltip
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BoltIcon from '@mui/icons-material/Bolt';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import LayersIcon from '@mui/icons-material/Layers';
import RefreshIcon from '@mui/icons-material/Refresh';
import LanguageIcon from '@mui/icons-material/Language';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

// Carousel pane quick selections (supports 1 to 20 panes)
const CAROUSEL_QUICK_COUNTS = [1, 3, 5, 7, 10, 15, 20];
// Strictly limited to 10 posts maximum per generation to ensure quality & Groq SLA
const BATCH_QUICK_COUNTS = [1, 2, 3, 5, 7, 10];

export default function CampaignSprintModal({
  open,
  onClose,
  clientData,
  initialTrend = '',
  initialBrief = null,
  onCampaignGenerated
}) {
  // Campaign Architecture: 'carousel' (1-20 slides) or 'batch' (1-10 posts max)
  const [campaignType, setCampaignType] = useState('carousel');
  const [carouselPanes, setCarouselPanes] = useState(3); // 1 to 20 panes
  const [batchCount, setBatchCount] = useState(5); // 1 to 10
  const [campaignTitle, setCampaignTitle] = useState('');

  // Grounding & Topic State
  const [program, setProgram] = useState('');
  const [groundingMode, setGroundingMode] = useState('kyc'); // 'kyc', 'hybrid', 'deep_kb'
  const [kbTopics, setKbTopics] = useState([]);
  const [selectedKbTopic, setSelectedKbTopic] = useState('');
  const [trendSignal, setTrendSignal] = useState(initialTrend || '');
  const [funnelStage, setFunnelStage] = useState('Awareness (TOFU)');
  const [hook, setHook] = useState('Contrarian/Unconventional Take');
  const [cta, setCta] = useState(clientData?.cta_preference || 'Book a Free 1-on-1 Demo');
  const [engine, setEngine] = useState('cloudflare');

  // Live Swarm Intelligence State (On-Demand, Never Auto-Polling)
  const [swarmTrends, setSwarmTrends] = useState([]);
  const [loadingSwarm, setLoadingSwarm] = useState(false);
  const [swarmQueryInput, setSwarmQueryInput] = useState('');
  const [swarmLastUpdated, setSwarmLastUpdated] = useState(null);
  const [swarmError, setSwarmError] = useState(null);

  // Execution State
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [error, setError] = useState(null);

  // On-demand swarm fetcher (cached by default, live on explicit refresh)
  const handleFetchSwarmTrends = async (forceRefresh = false, customQuery = null) => {
    setLoadingSwarm(true);
    setSwarmError(null);
    try {
      const clientName = clientData?.name || 'Unbox-ED';
      let url = `${API_BASE}/api/trends/swarm_suggestions?client_name=${encodeURIComponent(clientName)}`;
      if (forceRefresh) url += '&force_refresh=true';
      const q = customQuery !== null ? customQuery : swarmQueryInput;
      if (q && q.trim()) url += `&query=${encodeURIComponent(q.trim())}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.trends && Array.isArray(data.trends)) {
        setSwarmTrends(data.trends);
        setSwarmLastUpdated(data.updated_at ? new Date(data.updated_at).toLocaleTimeString() : new Date().toLocaleTimeString());
        if (data.trends.length > 0 && !trendSignal) {
          setTrendSignal(data.trends[0].title);
        }
      }
    } catch (err) {
      console.error('Failed to fetch live swarm signals:', err);
      setSwarmError('Could not reach live swarm network. Check connection.');
    } finally {
      setLoadingSwarm(false);
    }
  };

  // Sync initial trend or initial brief if passed
  useEffect(() => {
    if (initialBrief) {
      if (initialBrief.title || initialBrief.campaign_title) {
        setCampaignTitle(initialBrief.title || initialBrief.campaign_title);
      }
      if (initialBrief.featured_product) setProgram(initialBrief.featured_product);
      if (initialBrief.kb_topic) setSelectedKbTopic(initialBrief.kb_topic);
      if (initialBrief.trend_signal) setTrendSignal(initialBrief.trend_signal);
      if (initialBrief.hook) setHook(initialBrief.hook);
      if (initialBrief.cta) setCta(initialBrief.cta);
      if (initialBrief.mode === 'Hybrid Fusion') {
        setGroundingMode('hybrid');
      } else if (initialBrief.mode === 'Strict KB (Brand Authority)') {
        setGroundingMode('deep_kb');
      } else if (initialBrief.mode === 'Strict Trends (Newsjacking)') {
        setGroundingMode('trend');
      } else {
        setGroundingMode('kyc');
      }
    } else if (initialTrend) {
      setTrendSignal(typeof initialTrend === 'object' ? initialTrend.title : initialTrend);
      setGroundingMode('trend');
    }
  }, [initialTrend, initialBrief]);

  // Load cached swarm trends when hybrid or trend mode is opened
  useEffect(() => {
    if ((groundingMode === 'hybrid' || groundingMode === 'trend') && swarmTrends.length === 0) {
      handleFetchSwarmTrends(false);
    }
  }, [groundingMode, clientData?.name]);

  // Fetch verified facts from KB
  useEffect(() => {
    const q = clientData?.name ? `?client_name=${encodeURIComponent(clientData.name)}` : '';
    fetch(`${API_BASE}/api/kb/topics${q}`)
      .then(r => r.json())
      .then(d => {
        if (d.topics && d.topics.length > 0) {
          setKbTopics(d.topics);
          setSelectedKbTopic(d.topics[0].id);
        }
      })
      .catch(err => console.error('Failed to load KB topics:', err));
  }, [clientData?.name]);

  // Set default program from client data (default to All Offerings & USPs)
  useEffect(() => {
    if (clientData?.usps?.products && clientData.usps.products.length > 0) {
      setProgram('all_offerings_and_usps');
    } else if (clientData?.brand_focus) {
      setProgram(clientData.brand_focus);
    }
  }, [clientData]);

  const effectiveCount = campaignType === 'carousel' ? carouselPanes : batchCount;

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setProgressStep(`Initializing Multi-Agent Engine & Semantic RAG Grounding for ${effectiveCount} ${campaignType === 'carousel' ? 'panes' : 'posts'}...`);

    const timer1 = setTimeout(() => {
      setProgressStep(`1/4: Drafting initial sequence (${effectiveCount} items) via Llama 3.3...`);
    }, 1500);

    const timer2 = setTimeout(() => {
      setProgressStep(`2/4: Running Groq ACID Adjudicator (Brand Voice, Negative Constraints, Fact Alignment)...`);
    }, 10000);

    const timer3 = setTimeout(() => {
      setProgressStep(`3/4: Compiling canonical .bbn manifests (Schema v2.5) with Hermite compositing parameters...`);
    }, 22000);

    const timer4 = setTimeout(() => {
      setProgressStep(`4/4: Persisting .bbn manifests to disk and loading campaign into Workstation...`);
    }, 34000);

    const clearTimers = () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };

    try {
      const sourceModeString = groundingMode === 'kyc'
        ? 'Brand KYC (Pure USPs & Micro-KB)'
        : groundingMode === 'trend'
        ? 'Internet Research (Live Swarm Trends)'
        : groundingMode === 'deep_kb'
        ? 'Brand Database (Approved Facts)'
        : 'Hybrid Fusion (Verified Trends)';

      const resolvedTopic = groundingMode === 'deep_kb'
        ? selectedKbTopic
        : (program || 'all_offerings_and_usps');

      const isAllUSPs = resolvedTopic === 'all_offerings_and_usps' || resolvedTopic.toLowerCase().includes('all');
      const resolvedTitle = campaignTitle.trim() || (
        campaignType === 'carousel'
          ? (isAllUSPs 
              ? `${clientData?.name || 'Brand'} ${carouselPanes}-Slide Portfolio Masterclass (All USPs)`
              : `${clientData?.name || 'Brand'} ${carouselPanes}-Slide Carousel: ${resolvedTopic}`)
          : (isAllUSPs
              ? `${clientData?.name || 'Brand'} ${batchCount}-Post Portfolio Ad Sprint (All USPs)`
              : `${clientData?.name || 'Brand'} ${batchCount}-Post Sprint: ${resolvedTopic}`)
      );

      const payload = {
        client_name: clientData?.name || 'Unbox-ED',
        campaign_title: resolvedTitle,
        campaign_type: campaignType,
        funnel_stage: funnelStage,
        source_mode: sourceModeString,
        format_type: campaignType === 'carousel' ? `${carouselPanes}-Slide Meta Carousel` : 'Social Post / Ad Batch',
        kb_topic: resolvedTopic,
        trend_signal: (groundingMode === 'hybrid' || groundingMode === 'trend') ? trendSignal : 'No active trends',
        hook: hook,
        cta: cta,
        num_posts: effectiveCount,
        engine: engine
      };

      const res = await fetch(`${API_BASE}/api/campaign/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'ok') {
        throw new Error(data.detail || 'Execution failed on server');
      }

      clearTimers();
      setProgressStep('Complete! Saved .bbn manifests to disk. Opening Studio...');

      setTimeout(() => {
        onCampaignGenerated(data);
        onClose();
        setLoading(false);
      }, 500);

    } catch (err) {
      clearTimers();
      console.error('Campaign sprint error:', err);
      setError(err.message || 'Failed to execute campaign sprint');
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
          boxShadow: '0 16px 48px rgba(0,0,0,0.85)',
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 166, 35, 0.4)'
            }}
          >
            <LayersIcon sx={{ color: '#121212', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#F0F3F6', lineHeight: 1.1 }}>
              Custom Campaign Sprint Designer
            </Typography>
            <Typography variant="caption" sx={{ color: '#F5A623', fontWeight: 600 }}>
              1–20 Slide Carousels or 1–10 Custom Posts • Canonical .BBN Output • Multi-Agent Pipeline
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<VerifiedUserIcon />}
          label="Canonical .BBN (v2.5)"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)', py: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={56} sx={{ color: '#F5A623', mb: 3 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#F0F3F6', mb: 1 }}>
              {progressStep}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 500, mx: 'auto', mb: 3 }}>
              Multi-Agent Orchestrator is synthesizing {effectiveCount} distinct pieces of content, running the Groq ACID adjudicator, and compiling canonical .bbn manifests.
            </Typography>
            <Box sx={{ width: '60%', mx: 'auto' }}>
              <LinearProgress color="warning" />
            </Box>
          </Box>
        ) : (
          <Stack spacing={2.5}>

            {/* 1. Campaign Structure & Volume Selection */}
            <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(20,23,31,0.6)', border: '1px solid rgba(245,166,35,0.2)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F5A623', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon sx={{ fontSize: 18 }} /> 1. Select Campaign Architecture & Volume
              </Typography>
              
              <Grid container spacing={2}>
                {/* 3, 4, 5 SLIDE CAROUSEL GENERATOR */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    onClick={() => setCampaignType('carousel')}
                    sx={{
                      p: 2,
                      height: '100%',
                      cursor: 'pointer',
                      border: campaignType === 'carousel' ? '2px solid #F5A623' : '1px solid rgba(255,255,255,0.1)',
                      background: campaignType === 'carousel' ? 'rgba(245, 166, 35, 0.12)' : 'rgba(11,13,17,0.5)',
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                        <ViewCarouselIcon sx={{ color: '#F5A623', fontSize: 28 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                            Interactive Carousel Generator
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            Sequential storytelling across 1 to 20 panes ({carouselPanes} selected)
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1, lineHeight: 1.4 }}>
                        {carouselPanes === 1 && '1 Pane: Single High-Impact Sovereign Fact & CTA'}
                        {carouselPanes === 2 && '2 Panes: Provocation & Tension → Sovereign Solution'}
                        {carouselPanes === 3 && '3 Panes: Hook & Tension → Sovereign Fact → Primary CTA'}
                        {carouselPanes === 4 && '4 Panes: Hook → Deep Proof / Science → Client Transformation → Primary CTA'}
                        {carouselPanes === 5 && '5 Panes: Comprehensive Masterclass & Multi-Angle Framework'}
                        {carouselPanes > 5 && `${carouselPanes} Panes: Extended Deep-Dive Masterclass Narrative Sequence`}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {CAROUSEL_QUICK_COUNTS.map(cnt => (
                          <Chip
                            key={cnt}
                            label={`${cnt}p`}
                            size="small"
                            clickable
                            color={campaignType === 'carousel' && carouselPanes === cnt ? 'warning' : 'default'}
                            variant={campaignType === 'carousel' && carouselPanes === cnt ? 'filled' : 'outlined'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCampaignType('carousel');
                              setCarouselPanes(cnt);
                            }}
                            sx={{ fontWeight: 700, minWidth: 38 }}
                          />
                        ))}
                      </Stack>
                      <Box sx={{ px: 0.5 }} onClick={(e) => e.stopPropagation()}>
                        <Slider
                          value={carouselPanes}
                          min={1}
                          max={20}
                          step={1}
                          valueLabelDisplay="auto"
                          onChange={(e, val) => {
                            setCampaignType('carousel');
                            setCarouselPanes(val);
                          }}
                          sx={{
                            color: '#F5A623',
                            height: 4,
                            '& .MuiSlider-thumb': {
                              width: 14,
                              height: 14,
                              boxShadow: '0 0 8px rgba(245,166,35,0.6)'
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* CUSTOM POST BATCH GENERATOR (STRICTLY 1-10 POSTS MAX) */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    onClick={() => setCampaignType('batch')}
                    sx={{
                      p: 2,
                      height: '100%',
                      cursor: 'pointer',
                      border: campaignType === 'batch' ? '2px solid #00D2FF' : '1px solid rgba(255,255,255,0.1)',
                      background: campaignType === 'batch' ? 'rgba(0, 210, 255, 0.12)' : 'rgba(11,13,17,0.5)',
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                        <DynamicFeedIcon sx={{ color: '#00D2FF', fontSize: 28 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                            Custom Posts Batch (1–10 Posts Max)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            High-velocity ad variations capped for quality & SLA
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                        Generates independent single-image ad creatives. Strictly capped at 10 to ensure zero hallucination & fast execution.
                      </Typography>
                    </Box>

                    <Box onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0.6} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {BATCH_QUICK_COUNTS.map(cnt => (
                          <Chip
                            key={cnt}
                            label={`${cnt} ${cnt === 1 ? 'Post' : 'Posts'}`}
                            size="small"
                            clickable
                            color={campaignType === 'batch' && batchCount === cnt ? 'info' : 'default'}
                            variant={campaignType === 'batch' && batchCount === cnt ? 'filled' : 'outlined'}
                            onClick={() => {
                              setCampaignType('batch');
                              setBatchCount(cnt);
                            }}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        ))}
                      </Stack>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Slider
                          value={batchCount}
                          min={1}
                          max={10}
                          step={1}
                          onChange={(e, val) => {
                            setCampaignType('batch');
                            setBatchCount(val);
                          }}
                          sx={{ color: '#00D2FF', py: 0.5 }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#00D2FF', minWidth: 32, textAlign: 'right' }}>
                          {batchCount}/10
                        </Typography>
                      </Stack>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Optional Custom Campaign Title */}
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Campaign Title (Optional - Auto-generated if blank)"
                  placeholder={campaignType === 'carousel' ? `e.g. ${clientData?.name || 'Brand'} ${carouselPanes}-Slide Carousel Masterclass` : `e.g. ${clientData?.name || 'Brand'} ${batchCount}-Post Ad Sprint`}
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                />
              </Box>
            </Box>

            {/* 2. Knowledge Grounding Mode */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F5A623', mb: 1 }}>
                2. Intelligence Grounding Source (Decoupled Sovereign KYC)
              </Typography>
              <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                <Grid item xs={3}>
                  <Paper
                    onClick={() => setGroundingMode('kyc')}
                    sx={{
                      p: 1.4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: groundingMode === 'kyc' ? '2px solid #F5A623' : '1px solid rgba(255,255,255,0.1)',
                      background: groundingMode === 'kyc' ? 'rgba(245, 166, 35, 0.15)' : 'rgba(20,23,31,0.5)',
                      borderRadius: 2
                    }}
                  >
                    <VerifiedUserIcon sx={{ color: '#F5A623', fontSize: 22, mb: 0.3 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                      Brand KYC Grounding
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.66rem', display: 'block' }}>
                      Pure USPs & Micro-KB
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper
                    onClick={() => {
                      setGroundingMode('hybrid');
                      if (swarmTrends.length === 0) handleFetchSwarmTrends(false);
                    }}
                    sx={{
                      p: 1.4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: groundingMode === 'hybrid' ? '2px solid #4CAF50' : '1px solid rgba(255,255,255,0.1)',
                      background: groundingMode === 'hybrid' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(20,23,31,0.5)',
                      borderRadius: 2
                    }}
                  >
                    <BoltIcon sx={{ color: '#4CAF50', fontSize: 22, mb: 0.3 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                      Hybrid Fusion
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.66rem', display: 'block' }}>
                      Micro-KB + Live Swarm
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper
                    onClick={() => {
                      setGroundingMode('trend');
                      if (swarmTrends.length === 0) handleFetchSwarmTrends(false);
                    }}
                    sx={{
                      p: 1.4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: groundingMode === 'trend' ? '2px solid #00D2FF' : '1px solid rgba(255,255,255,0.1)',
                      background: groundingMode === 'trend' ? 'rgba(0, 210, 255, 0.15)' : 'rgba(20,23,31,0.5)',
                      borderRadius: 2
                    }}
                  >
                    <LanguageIcon sx={{ color: '#00D2FF', fontSize: 22, mb: 0.3 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                      Live Swarm Trend
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.66rem', display: 'block' }}>
                      Newsjack viral signal
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper
                    onClick={() => setGroundingMode('deep_kb')}
                    sx={{
                      p: 1.4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: groundingMode === 'deep_kb' ? '2px solid #9C27B0' : '1px solid rgba(255,255,255,0.1)',
                      background: groundingMode === 'deep_kb' ? 'rgba(156, 39, 176, 0.12)' : 'rgba(20,23,31,0.5)',
                      borderRadius: 2
                    }}
                  >
                    <MenuBookIcon sx={{ color: '#9C27B0', fontSize: 22, mb: 0.3 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                      Deep KB Archive
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.66rem', display: 'block' }}>
                      Optional doc repo
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Dynamic Grounding Controls */}
              {groundingMode !== 'deep_kb' && groundingMode !== 'trend' && (
                <Box sx={{ mb: 1.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Featured Offering, USP or Micro-KB Fact</InputLabel>
                    <Select
                      value={program}
                      label="Featured Offering, USP or Micro-KB Fact"
                      onChange={(e) => setProgram(e.target.value)}
                    >
                      <MenuItem value="all_offerings_and_usps" sx={{ fontWeight: 800, color: '#F5A623', background: 'rgba(245,166,35,0.08)' }}>
                        🌟 All Offerings & USPs (Full Brand Portfolio & Multi-Pillar Ecosystem)
                      </MenuItem>
                      <Divider sx={{ my: 0.5 }} />

                      {(clientData?.usps?.products || []).map((p, idx) => {
                        const pName = typeof p === 'object' ? p.name : p;
                        const pOutcome = typeof p === 'object' ? (p.target_segment || p.key_outcome) : '';
                        return (
                          <MenuItem key={`p_${idx}`} value={pName}>
                            📦 Product: {pName} {pOutcome ? `— (${pOutcome})` : ''}
                          </MenuItem>
                        );
                      })}
                      {(clientData?.usps?.services || []).map((s, idx) => {
                        const sName = typeof s === 'object' ? s.name : s;
                        const sModel = typeof s === 'object' ? s.delivery_model : '';
                        return (
                          <MenuItem key={`s_${idx}`} value={sName}>
                            🤝 Service: {sName} {sModel ? `— (${sModel})` : ''}
                          </MenuItem>
                        );
                      })}
                      {(clientData?.usps?.ips || []).map((ip, idx) => {
                        const ipName = typeof ip === 'object' ? ip.name : ip;
                        const ipDesc = typeof ip === 'object' ? ip.description : '';
                        return (
                          <MenuItem key={`ip_${idx}`} value={ipName}>
                            💡 IP: {ipName} {ipDesc ? `— (${ipDesc})` : ''}
                          </MenuItem>
                        );
                      })}
                      {(clientData?.micro_kb || []).map((f, idx) => (
                        <MenuItem key={`f_${idx}`} value={f.title || f.id}>
                          📜 Sovereign Fact: {f.title} {f.proof_metric ? `— [${f.proof_metric}]` : ''}
                        </MenuItem>
                      ))}
                      {(!clientData?.usps?.products || clientData.usps.products.length === 0) &&
                       (!clientData?.micro_kb || clientData.micro_kb.length === 0) && (
                        <MenuItem value={clientData?.brand_focus || clientData?.name || 'Core Offering'}>
                          {clientData?.brand_focus || clientData?.name || 'Core Offering'}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>

                  {/* Visual Portfolio Distribution Breakdown when All Offerings is selected */}
                  {(program === 'all_offerings_and_usps' || !program) && (
                    <Box sx={{ mt: 1, p: 1.25, borderRadius: 2, background: 'rgba(245, 166, 35, 0.08)', border: '1px solid rgba(245, 166, 35, 0.25)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#F5A623', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
                        <AutoAwesomeIcon sx={{ fontSize: 13 }} /> Multi-USP Distribution: All {effectiveCount} {campaignType === 'carousel' ? 'panes' : 'posts'} will dynamically spotlight distinct offerings in rotation:
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {(clientData?.usps?.products || []).map((p, idx) => (
                          <Chip
                            key={`p_chip_${idx}`}
                            size="small"
                            label={`📦 ${typeof p === 'object' ? p.name : p}`}
                            sx={{ background: 'rgba(245, 166, 35, 0.2)', color: '#F0F3F6', fontWeight: 600, fontSize: '0.68rem', height: 22 }}
                          />
                        ))}
                        {(clientData?.usps?.services || []).map((s, idx) => (
                          <Chip
                            key={`s_chip_${idx}`}
                            size="small"
                            label={`🤝 ${typeof s === 'object' ? s.name : s}`}
                            sx={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', fontWeight: 600, fontSize: '0.68rem', height: 22 }}
                          />
                        ))}
                        {(clientData?.usps?.ips || []).map((ip, idx) => (
                          <Chip
                            key={`ip_chip_${idx}`}
                            size="small"
                            label={`💡 ${typeof ip === 'object' ? ip.name : ip}`}
                            sx={{ background: 'rgba(168, 85, 247, 0.2)', color: '#C084FC', fontWeight: 600, fontSize: '0.68rem', height: 22 }}
                          />
                        ))}
                        {(clientData?.micro_kb || []).map((f, idx) => (
                          <Chip
                            key={`f_chip_${idx}`}
                            size="small"
                            label={`📜 ${f.title}`}
                            sx={{ background: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50', fontWeight: 600, fontSize: '0.68rem', height: 22 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}

              {groundingMode === 'deep_kb' && (
                <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                  <InputLabel>Verified Fact / Topic from Document Repository</InputLabel>
                  <Select
                    value={selectedKbTopic}
                    label="Verified Fact / Topic from Document Repository"
                    onChange={(e) => setSelectedKbTopic(e.target.value)}
                  >
                    {kbTopics.map(t => (
                      <MenuItem key={t.id} value={t.id}>
                        [{t.category}] {t.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* ROBUST ON-DEMAND LIVE SWARM INTELLIGENCE PANEL (NEVER AUTOMATICALLY UPDATES) */}
              {(groundingMode === 'hybrid' || groundingMode === 'trend') && (
                <Paper sx={{ p: 2, mb: 1.5, background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(0, 210, 255, 0.3)', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LanguageIcon sx={{ color: '#00D2FF', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#00D2FF' }}>
                        Live Swarm Intelligence ({clientData?.industry || 'Industry'} Signals)
                      </Typography>
                    </Box>

                    {/* MANUAL UPDATE SWARM BUTTON */}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={loadingSwarm ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleFetchSwarmTrends(true)}
                      disabled={loadingSwarm}
                      sx={{
                        color: '#00D2FF',
                        borderColor: 'rgba(0, 210, 255, 0.4)',
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        py: 0.3,
                        px: 1.2,
                        '&:hover': {
                          borderColor: '#00D2FF',
                          background: 'rgba(0, 210, 255, 0.08)'
                        }
                      }}
                    >
                      {loadingSwarm ? 'Scanning Swarm...' : 'Update Swarm Trends'}
                    </Button>
                  </Box>

                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.5 }}>
                    Multi-engine triangulation across Google News RSS, Reddit, and DuckDuckGo. Never auto-updates in the background. Last sync: <strong style={{ color: '#F0F3F6' }}>{swarmLastUpdated || 'On-demand'}</strong>.
                  </Typography>

                  {/* Custom Topic Search Filter */}
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Search specific keyword or niche (e.g. '${clientData?.brand_focus?.split(',')[0] || 'emerging trends'}')`}
                      value={swarmQueryInput}
                      onChange={(e) => setSwarmQueryInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchSwarmTrends(true, swarmQueryInput)}
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.8 }
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleFetchSwarmTrends(true, swarmQueryInput)}
                      disabled={loadingSwarm || !swarmQueryInput.trim()}
                      sx={{ px: 2, fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap' }}
                    >
                      Scan Swarm
                    </Button>
                  </Stack>

                  {swarmError && (
                    <Alert severity="warning" sx={{ mb: 1.5, py: 0.5, fontSize: '0.75rem' }}>
                      {swarmError}
                    </Alert>
                  )}

                  {/* Live Triangulated Trends List */}
                  <Typography variant="caption" sx={{ color: '#F5A623', fontWeight: 700, display: 'block', mb: 1 }}>
                    Click a live triangulated trend to newsjack:
                  </Typography>

                  {loadingSwarm ? (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <CircularProgress size={28} sx={{ color: '#00D2FF', mb: 1 }} />
                      <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8' }}>
                        Connecting to multi-engine swarm nodes...
                      </Typography>
                    </Box>
                  ) : swarmTrends.length > 0 ? (
                    <Stack spacing={1} sx={{ maxHeight: 210, overflowY: 'auto', pr: 0.5 }}>
                      {swarmTrends.map((t, idx) => (
                        <Paper
                          key={idx}
                          onClick={() => setTrendSignal(t.title)}
                          sx={{
                            p: 1.2,
                            cursor: 'pointer',
                            borderRadius: 1.5,
                            border: trendSignal === t.title ? '2px solid #00D2FF' : '1px solid rgba(255,255,255,0.08)',
                            background: trendSignal === t.title ? 'rgba(0, 210, 255, 0.15)' : 'rgba(11, 13, 17, 0.7)',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              borderColor: '#00D2FF',
                              background: 'rgba(0, 210, 255, 0.1)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#F0F3F6', fontSize: '0.82rem', flexGrow: 1, pr: 1 }}>
                              {t.title}
                            </Typography>
                            <Chip
                              label={`${t.consensus_pct || 72}% Consensus`}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                background: 'rgba(0, 210, 255, 0.2)',
                                color: '#00D2FF'
                              }}
                            />
                          </Box>

                          {t.summary && (
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.72rem', mb: 0.5 }}>
                              {t.summary}
                            </Typography>
                          )}

                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.65rem' }}>
                              Engine: {t.source || 'Swarm Triangulator'}
                            </Typography>
                            {trendSignal === t.title && (
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: 12 }} />}
                                label="SELECTED FOR GENERATION"
                                size="small"
                                color="info"
                                sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800 }}
                              />
                            )}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{ py: 2, textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 1.5 }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>
                        No cached swarm signals yet. Click below to query live trends for {clientData?.name || 'this brand'}.
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleFetchSwarmTrends(true)}
                        sx={{ fontSize: '0.72rem', color: '#00D2FF', borderColor: 'rgba(0,210,255,0.4)' }}
                      >
                        Scan Live Swarm Now
                      </Button>
                    </Box>
                  )}

                  {/* Active Selected Signal Input */}
                  <Box sx={{ mt: 1.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Active Newsjack Headline / Angle"
                      value={trendSignal}
                      onChange={(e) => setTrendSignal(e.target.value)}
                      placeholder="Click a live trend above or type your own newsjack angle..."
                      helperText="The orchestrator will fuse this verified market trend with client USPs during synthesis."
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '0.85rem' },
                        '& .MuiFormHelperText-root': { fontSize: '0.68rem', color: '#64748B' }
                      }}
                    />
                  </Box>
                </Paper>
              )}
            </Box>

            {/* 3. Funnel & Channel Settings */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F5A623', mb: 1 }}>
                3. Funnel Strategy & Engine
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Funnel Stage</InputLabel>
                    <Select
                      value={funnelStage}
                      label="Funnel Stage"
                      onChange={(e) => setFunnelStage(e.target.value)}
                    >
                      <MenuItem value="Awareness (TOFU)">Awareness (TOFU)</MenuItem>
                      <MenuItem value="Engagement (MOFU)">Engagement (MOFU)</MenuItem>
                      <MenuItem value="Conversion (BOFU)">Conversion (BOFU)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Narrative Hook Angle</InputLabel>
                    <Select
                      value={hook}
                      label="Narrative Hook Angle"
                      onChange={(e) => setHook(e.target.value)}
                    >
                      <MenuItem value="Contrarian/Unconventional Take">Contrarian/Unconventional Take</MenuItem>
                      <MenuItem value="Anti-Mass EdTech Contrast Hook">Anti-Mass EdTech Contrast Hook</MenuItem>
                      <MenuItem value="The 20+ Year Educator Authority">The 20+ Year Educator Authority</MenuItem>
                      <MenuItem value="Personal Micro-Story">Personal Micro-Story</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>AI Drafting Engine</InputLabel>
                    <Select
                      value={engine}
                      label="AI Drafting Engine"
                      onChange={(e) => setEngine(e.target.value)}
                    >
                      <MenuItem value="cloudflare">Cloudflare AI (Llama 3.3 Fast)</MenuItem>
                      <MenuItem value="sarvam">Sarvam AI (105B Indic Native)</MenuItem>
                      <MenuItem value="groq">Groq (High-Speed LPU)</MenuItem>
                      <MenuItem value="gemini">Gemini Flash</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* 4. Primary CTA */}
            <Box>
              <TextField
                fullWidth
                size="small"
                label="Primary Call to Action (CTA)"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between', backgroundColor: '#0B0D11' }}>
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          Volume: {effectiveCount} {campaignType === 'carousel' ? 'Panes' : 'Posts'} • Produces canonical .bbn manifests • Groq ACID Audited
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button onClick={onClose} disabled={loading} sx={{ color: '#94A3B8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BoltIcon />}
            onClick={handleExecute}
            disabled={loading}
            sx={{ fontWeight: 800, px: 3 }}
          >
            {loading ? 'Generating .BBN Campaign...' : `⚡ Generate ${effectiveCount} ${campaignType === 'carousel' ? 'Panes' : 'Posts'} (.BBN)`}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
