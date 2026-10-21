import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Chip, Stack, LinearProgress, IconButton,
  Divider, Alert, CircularProgress, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import BoltIcon from '@mui/icons-material/Bolt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function ContentDirector({
  clientData,
  initialTrend = null,
  onClearInitialTrend = null,
  onPushToStudio
}) {
  const clientName = clientData?.name || 'Unbox-ED';

  // Context & Controls State
  const [memoryPct, setMemoryPct] = useState(18);
  const [mode, setMode] = useState('Pure KYC Grounding');
  const [featuredProduct, setFeaturedProduct] = useState('');
  const [kbFacts, setKbFacts] = useState([]);
  const [selectedFactSlug, setSelectedFactSlug] = useState('');
  const [trendSignal, setTrendSignal] = useState('Industry Disruption vs Market Status Quo');
  const [hook, setHook] = useState('Contrarian/Unconventional Take');
  const [cta, setCta] = useState(clientData?.cta_preference || 'Book a Free 1-on-1 Demo');

  // Swarm Trends & Trendscraper Import State
  const [availableTrends, setAvailableTrends] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Fetch scraped trends from Trendscraper swarm cache or live
  const fetchScrapedTrends = async (forceRefresh = false) => {
    setLoadingTrends(true);
    try {
      const url = `${API_BASE}/api/trends/swarm_suggestions?client_name=${encodeURIComponent(clientName)}${forceRefresh ? '&force_refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.trends && Array.isArray(data.trends)) {
        setAvailableTrends(data.trends);
        if (data.trends.length > 0) {
          setTrendSignal(data.trends[0].title);
          setToastMsg(`📥 Imported latest live trend: "${data.trends[0].title.slice(0, 45)}..."`);
        }
      }
    } catch (e) {
      console.error('Failed to fetch scraped trends:', e);
    } finally {
      setLoadingTrends(false);
    }
  };

  // Sync initialTrend if passed from Trendscraper
  useEffect(() => {
    if (initialTrend) {
      const trendTitle = typeof initialTrend === 'object' ? (initialTrend.title || initialTrend.topic || '') : initialTrend;
      if (trendTitle) {
        setMode('Hybrid Fusion');
        setTrendSignal(trendTitle);
        setToastMsg(`📈 Trend from Trendscraper woven into Director: "${trendTitle.slice(0, 45)}..."`);
      }
      if (onClearInitialTrend) onClearInitialTrend();
    }
  }, [initialTrend]);

  // When switching to Hybrid Fusion, auto-load trends if not already fetched
  useEffect(() => {
    if (mode === 'Hybrid Fusion' && availableTrends.length === 0) {
      fetchScrapedTrends(false);
    }
  }, [mode]);

  // Synchronize dynamic client data
  useEffect(() => {
    if (clientData) {
      if (clientData.cta_preference) setCta(clientData.cta_preference);
      setFeaturedProduct('All Offerings & USPs (Full Brand Portfolio)');
      if (clientData.micro_kb && clientData.micro_kb.length > 0) {
        setSelectedFactSlug(clientData.micro_kb[0].id || clientData.micro_kb[0].title);
      }
    }
  }, [clientData]);

  // Helper to compile brief payload
  const getCompiledBrief = () => {
    const isAllUSPs = !featuredProduct || featuredProduct.includes('All Offerings') || featuredProduct === 'all_offerings_and_usps';
    const effProduct = isAllUSPs ? 'all_offerings_and_usps' : featuredProduct;
    return latestBrief || {
      mode: mode,
      kb_topic: isAllUSPs ? 'all_offerings_and_usps' : selectedFactSlug,
      featured_product: effProduct,
      trend_signal: (mode === 'Hybrid Fusion' || mode === 'Strict Trends (Newsjacking)') ? trendSignal : 'No active trends',
      hook: hook,
      cta: cta,
      audience: 'Parents',
      title: isAllUSPs
        ? `${clientName} Carousel: Full Portfolio Masterclass (All USPs)`
        : `${clientName} Carousel: ${featuredProduct || selectedFactSlug || 'Narrative Campaign'}`
    };
  };

  const handleLaunchBbnCampaign = () => {
    if (onPushToStudio) {
      const compiled = getCompiledBrief();
      onPushToStudio({
        ...compiled,
        create_bbn: true,
        campaign_title: `${clientName} Carousel: ${featuredProduct || selectedFactSlug || 'Narrative Campaign'}`
      });
    }
  };

  const handleLoadSingleSlide = () => {
    if (onPushToStudio) {
      const compiled = getCompiledBrief();
      onPushToStudio({
        ...compiled,
        create_bbn: false
      });
    }
  };

  // Chat & Drafts State
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm the **Bourbon Content Director**. I synthesize sovereign brand KYC, verified proof points, and live market trends to write high-impact briefs and campaign copy. Use the context controls on the left or type your prompt below!`,
      reasoning: null
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [latestBrief, setLatestBrief] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Fetch facts for 2-Tier cascading dropdown
  useEffect(() => {
    fetch(`${API_BASE}/api/facts?client_name=${encodeURIComponent(clientName)}`)
      .then(r => r.json())
      .then(d => {
        if (d.facts) {
          setKbFacts(d.facts);
          if (d.facts.length > 0 && !selectedFactSlug) {
            setSelectedFactSlug(d.facts[0].id);
          }
        }
      })
      .catch(err => console.error('Failed to load facts:', err));
  }, [clientName]);

  // Handle Generate Sample Post
  const handleGenerateSample = async () => {
    setSampleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/director/sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          mode: mode,
          kb_topic: selectedFactSlug || 'importance-of-observation',
          featured_product: featuredProduct,
          trend_signal: trendSignal,
          hook: hook,
          cta: cta,
          audience: 'Parents'
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        const msg = {
          role: 'assistant',
          content: `**✍️ Generated Sample Post (${mode} • ${featuredProduct}):**\n\n${data.sample_post}`,
          reasoning: data.reasoning
        };
        setMessages(prev => [...prev, msg]);
        setMemoryPct(data.memory_pct || 25);
        setLatestBrief(data.brief);
        setToastMsg('Sample post generated! Brief synced for Creative Studio.');
      }
    } catch (err) {
      console.error('Sample generation failed:', err);
      setToastMsg('Failed to generate sample post.');
    } finally {
      setSampleLoading(false);
    }
  };

  // Handle Conversational Chat
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const prompt = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/director/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          client_name: clientName,
          mode: mode,
          kb_topic: selectedFactSlug,
          featured_product: featuredProduct,
          trend_signal: trendSignal,
          hook: hook,
          cta: cta,
          audience: 'Parents'
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          reasoning: data.reasoning
        }]);
        setMemoryPct(data.memory_pct || 35);
        if (data.brief) setLatestBrief(data.brief);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, failed to process prompt.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {toastMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToastMsg(null)}>
          {toastMsg}
        </Alert>
      )}

      {/* HEADER */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              ✍️ Bourbon Content Director
            </Typography>
            <Chip
              icon={<PsychologyIcon />}
              label="Sarvam 105B Reasoning"
              size="small"
              sx={{ background: 'rgba(245, 166, 35, 0.15)', color: '#F5A623', fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="subtitle1">
            Senior Narrative Strategist • Cascading Curriculum Targeting • Thought Process Transparency
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {onPushToStudio && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<RocketLaunchIcon />}
              onClick={handleLaunchBbnCampaign}
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                color: '#121212',
                boxShadow: '0 4px 14px rgba(245, 166, 35, 0.4)'
              }}
            >
              🚀 Create .BBN Campaign (1–20 Panes)
            </Button>
          )}
          {latestBrief && onPushToStudio && (
            <Button
              variant="outlined"
              onClick={handleLoadSingleSlide}
              sx={{
                fontWeight: 700,
                borderColor: 'rgba(245, 166, 35, 0.4)',
                color: '#F5A623',
                '&:hover': { borderColor: '#F5A623', background: 'rgba(245, 166, 35, 0.08)' }
              }}
            >
              🎨 Load Active Slide to Canvas
            </Button>
          )}
        </Stack>
      </Box>

      <Grid container spacing={2.5}>
        
        {/* LEFT COLUMN: CONTEXT CONTROLS & 2-TIER SELECTORS (Width: 4 / 12) */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            
            {/* Context Memory Gauge */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#94A3B8' }}>
                  Context Memory: <strong style={{ color: memoryPct > 80 ? '#FF5252' : '#4CAF50' }}>{memoryPct}%</strong>
                </Typography>
                <Button
                  size="small"
                  startIcon={<RestartAltIcon />}
                  onClick={() => {
                    setMemoryPct(10);
                    setMessages([messages[0]]);
                    setToastMsg('Context memory cleared.');
                  }}
                  sx={{ color: '#94A3B8', fontSize: '0.72rem', py: 0 }}
                >
                  Reset
                </Button>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memoryPct}
                color={memoryPct > 80 ? 'error' : 'success'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F5A623', mb: 1.5 }}>
              🎯 2-Tier Curriculum & Source Controls
            </Typography>

            <Stack spacing={2}>
              {/* Grounding Mode */}
              <FormControl fullWidth size="small">
                <InputLabel>Data Grounding Mode</InputLabel>
                <Select
                  value={mode}
                  label="Data Grounding Mode"
                  onChange={(e) => setMode(e.target.value)}
                >
                  <MenuItem value="Pure KYC Grounding">⚡ Pure KYC Grounding (Zero External KB)</MenuItem>
                  <MenuItem value="Hybrid Fusion">🧬 Hybrid Fusion (Verified Facts + Swarm Trends)</MenuItem>
                  <MenuItem value="Strict KB (Brand Authority)">🏛️ Strict KB (Deep Archive Only)</MenuItem>
                  <MenuItem value="Strict Trends (Newsjacking)">🌐 Strict Trends (Newsjacking Only)</MenuItem>
                </Select>
              </FormControl>

              {/* Tier 1: Featured Offering */}
              <FormControl fullWidth size="small">
                <InputLabel>Tier 1: Commercial Offering / USP</InputLabel>
                <Select
                  value={featuredProduct}
                  label="Tier 1: Commercial Offering / USP"
                  onChange={(e) => setFeaturedProduct(e.target.value)}
                >
                  <MenuItem value="All Offerings & USPs (Full Brand Portfolio)" sx={{ fontWeight: 800, color: '#F5A623', background: 'rgba(245,166,35,0.08)' }}>
                    🌟 All Offerings & USPs (Full Brand Portfolio)
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />

                  {(clientData?.usps?.products || []).map((p, idx) => {
                    const pName = typeof p === 'object' ? p.name : p;
                    return <MenuItem key={`p_${idx}`} value={pName}>📦 Product: {pName}</MenuItem>;
                  })}
                  {(clientData?.usps?.services || []).map((s, idx) => {
                    const sName = typeof s === 'object' ? s.name : s;
                    return <MenuItem key={`s_${idx}`} value={sName}>🤝 Service: {sName}</MenuItem>;
                  })}
                  {(clientData?.usps?.ips || []).map((ip, idx) => {
                    const ipName = typeof ip === 'object' ? ip.name : ip;
                    return <MenuItem key={`ip_${idx}`} value={ipName}>💡 Proprietary IP: {ipName}</MenuItem>;
                  })}
                  {(!clientData?.usps?.products || clientData.usps.products.length === 0) && (
                    <MenuItem value={clientData?.brand_focus || clientName}>{clientData?.brand_focus || clientName}</MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Tier 2: Mapped Sovereign Fact or Deep Fact */}
              <FormControl fullWidth size="small">
                <InputLabel>Tier 2: Mapped Fact / Proof Point</InputLabel>
                <Select
                  value={selectedFactSlug}
                  label="Tier 2: Mapped Fact / Proof Point"
                  onChange={(e) => setSelectedFactSlug(e.target.value)}
                >
                  {(clientData?.micro_kb || []).map((f, idx) => (
                    <MenuItem key={`mkb_${idx}`} value={f.id || f.title}>
                      [Sovereign Micro-KB] {f.title} ({f.category || 'Proof'})
                    </MenuItem>
                  ))}
                  {kbFacts.map((f, idx) => (
                    <MenuItem key={`kb_${idx}`} value={f.id}>
                      [Deep KB] {f.id}
                    </MenuItem>
                  ))}
                  {(!clientData?.micro_kb || clientData.micro_kb.length === 0) && kbFacts.length === 0 && (
                    <MenuItem value={clientData?.brand_focus || 'brand-authority'}>{clientData?.brand_focus || 'brand-authority'}</MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Market Trend Query & Swarm Scraper Import */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                    External Market Trend / Signal
                  </Typography>
                  {(mode === 'Hybrid Fusion' || mode === 'Strict Trends (Newsjacking)') && (
                    <Button
                      size="small"
                      startIcon={loadingTrends ? <CircularProgress size={12} color="inherit" /> : <BoltIcon sx={{ fontSize: 13 }} />}
                      onClick={() => fetchScrapedTrends(true)}
                      disabled={loadingTrends}
                      sx={{ fontSize: '0.68rem', py: 0.1, px: 0.8, color: '#F5A623', textTransform: 'none' }}
                    >
                      {loadingTrends ? 'Importing...' : '📥 Import Latest Trends'}
                    </Button>
                  )}
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  value={trendSignal}
                  onChange={(e) => setTrendSignal(e.target.value)}
                  placeholder="e.g. Screen Time vs Tactile Learning 2026"
                />
                {(mode === 'Hybrid Fusion' || mode === 'Strict Trends (Newsjacking)') && availableTrends.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.4 }}>
                      ⚡ Select from live scraped market signals:
                    </Typography>
                    <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap', gap: 0.6 }}>
                      {availableTrends.slice(0, 4).map((t, idx) => (
                        <Chip
                          key={`tr_${idx}`}
                          label={t.title.length > 36 ? t.title.slice(0, 36) + '...' : t.title}
                          size="small"
                          clickable
                          onClick={() => {
                            setTrendSignal(t.title);
                            setToastMsg(`📈 Woven Trend: "${t.title.slice(0, 45)}..."`);
                          }}
                          sx={{
                            fontSize: '0.66rem',
                            fontWeight: trendSignal === t.title ? 700 : 500,
                            background: trendSignal === t.title ? 'rgba(245, 166, 35, 0.2)' : 'rgba(255,255,255,0.05)',
                            borderColor: trendSignal === t.title ? '#F5A623' : 'rgba(255,255,255,0.1)',
                            color: trendSignal === t.title ? '#F5A623' : '#CBD5E1',
                            borderWidth: 1,
                            borderStyle: 'solid'
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>

              {/* Narrative Hook */}
              <FormControl fullWidth size="small">
                <InputLabel>Narrative Hook Angle</InputLabel>
                <Select
                  value={hook}
                  label="Narrative Hook Angle"
                  onChange={(e) => setHook(e.target.value)}
                >
                  <MenuItem value="Contrarian/Unconventional Take">Contrarian/Unconventional Take</MenuItem>
                  <MenuItem value="Anti-Mass Contrast Hook">Anti-Mass Contrast Hook</MenuItem>
                  <MenuItem value="Authority Deep-Dive">Authority Deep-Dive</MenuItem>
                  <MenuItem value="Personal Micro-Story">Personal Micro-Story</MenuItem>
                  <MenuItem value="Myth vs Reality">Myth vs Reality</MenuItem>
                </Select>
              </FormControl>

              {/* CTA */}
              <TextField
                fullWidth
                size="small"
                label="Call to Action (CTA)"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
              />

              {/* Quick Action Button */}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={sampleLoading ? <CircularProgress size={18} color="inherit" /> : <BoltIcon />}
                onClick={handleGenerateSample}
                disabled={sampleLoading}
                sx={{
                  fontWeight: 800,
                  py: 1.2,
                  background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                  color: '#121212',
                  boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)'
                }}
              >
                {sampleLoading ? 'Synthesizing Narrative...' : '⚡ Generate Sample Post from KB & Trends'}
              </Button>

              {/* Forward Weaving Action: Push Brief to Studio */}
              <Paper
                sx={{
                  p: 2,
                  mt: 1.5,
                  background: 'rgba(245, 166, 35, 0.08)',
                  border: '1px solid rgba(245, 166, 35, 0.3)',
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F5A623', mb: 0.5 }}>
                  🚀 Weave into BBN Creative Studio
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.5 }}>
                  Generate 1–20 slide linear narrative carousels or batch ad sprints saved directly as canonical .BBN files.
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<RocketLaunchIcon />}
                    onClick={handleLaunchBbnCampaign}
                    sx={{
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                      color: '#121212'
                    }}
                  >
                    🚀 Create .BBN Campaign Sprint (1–20 Panes)
                  </Button>
                  {latestBrief && (
                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={handleLoadSingleSlide}
                      sx={{
                        fontWeight: 700,
                        borderColor: 'rgba(245, 166, 35, 0.4)',
                        color: '#F5A623'
                      }}
                    >
                      🎨 Load Active Slide to Canvas
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: INTERACTIVE CONVERSATIONAL WRITER & THOUGHT PROCESS (Width: 8 / 12) */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditNoteIcon sx={{ color: '#F5A623' }} /> Content Director Drafts & Reasoning
              </Typography>
              <Chip
                label="Sarvam-105B Reasoning Trace"
                size="small"
                variant="outlined"
                sx={{ borderColor: 'rgba(245, 166, 35, 0.4)', color: '#F5A623', fontSize: '0.72rem' }}
              />
            </Box>

            {/* Chat Messages Stream */}
            <Box
              sx={{
                flexGrow: 1,
                minHeight: 400,
                maxHeight: 520,
                overflowY: 'auto',
                p: 2,
                backgroundColor: 'rgba(11, 13, 17, 0.65)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.06)',
                mb: 2
              }}
            >
              {messages.map((m, idx) => (
                <Box
                  key={idx}
                  sx={{
                    mb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748B', mb: 0.3 }}>
                    {m.role === 'user' ? 'You' : 'Bourbon Content Director'}
                  </Typography>

                  <Box
                    sx={{
                      p: 1.8,
                      borderRadius: 2,
                      maxWidth: '92%',
                      backgroundColor: m.role === 'user' ? 'rgba(245, 166, 35, 0.18)' : 'rgba(20, 23, 31, 0.85)',
                      border: m.role === 'user' ? '1px solid rgba(245, 166, 35, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#F0F3F6', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {m.content}
                    </Typography>

                    {/* Thought Process (Sarvam Reasoning Accordion) */}
                    {m.reasoning && (
                      <Accordion
                        sx={{
                          mt: 1.5,
                          backgroundColor: 'rgba(11, 13, 17, 0.7)',
                          border: '1px solid rgba(0, 210, 255, 0.25)',
                          borderRadius: '8px !important',
                          '&:before': { display: 'none' }
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00D2FF' }} />}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#00D2FF' }}>
                            💭 Thought Process (Sarvam-105B Reasoning Trace)
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', whiteSpace: 'pre-wrap', display: 'block' }}>
                            {m.reasoning}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Box>
                </Box>
              ))}

              {chatLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5 }}>
                  <CircularProgress size={18} sx={{ color: '#F5A623' }} />
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                    Content Director drafting brief with Sarvam 105B...
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Chat Input */}
            <Stack direction="row" spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask Content Director to write a specific campaign brief, tweet, or debate hook..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              />
              <IconButton
                color="primary"
                onClick={handleSendChat}
                disabled={chatLoading || !chatInput.trim()}
                sx={{
                  backgroundColor: 'rgba(245, 166, 35, 0.2)',
                  '&:hover': { backgroundColor: 'rgba(245, 166, 35, 0.35)' }
                }}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}
