import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, CircularProgress,
  Card, CardContent, Chip, Stack, Link
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LanguageIcon from '@mui/icons-material/Language';
import BoltIcon from '@mui/icons-material/Bolt';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RefreshIcon from '@mui/icons-material/Refresh';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function Trendscraper({ clientData, onLaunchTrend, onWeaveToDirector }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Dynamic Swarm Suggestions State
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsLastUpdated, setSuggestionsLastUpdated] = useState(null);

  const fetchDynamicSuggestions = async (forceRefresh = false) => {
    setLoadingSuggestions(true);
    try {
      const clientName = clientData?.name || 'Unbox-ED';
      const url = `${API_BASE}/api/trends/swarm_suggestions?client_name=${encodeURIComponent(clientName)}${forceRefresh ? '&force_refresh=true' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.trends && Array.isArray(data.trends)) {
          setLiveSuggestions(data.trends.map(t => t.title));
          setSuggestionsLastUpdated(data.updated_at ? new Date(data.updated_at).toLocaleTimeString() : new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.error('Failed to load dynamic swarm suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Load cached suggestions once on mount or when client changes
  useEffect(() => {
    fetchDynamicSuggestions(false);
  }, [clientData?.name]);

  const handleScrape = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/trends/scrape?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.data);
    } catch (err) {
      console.error('Trend scrape failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          🌐 Global Swarm Intelligence (Trendscraper)
        </Typography>
        <Typography variant="subtitle1">
          Triangulate real-time viral signals across Google News, Reddit, and DuckDuckGo for {clientData?.name || 'Active Brand'}.
        </Typography>
      </Box>

      {/* SEARCH BOX */}
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={9}>
            <TextField
              fullWidth
              size="small"
              placeholder={`Enter search query or niche (e.g. '${clientData?.brand_focus || 'Emerging industry trends'}')`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
              onClick={() => handleScrape()}
              disabled={loading}
              sx={{ fontWeight: 700 }}
            >
              {loading ? 'Triangulating...' : 'Run Swarm'}
            </Button>
          </Grid>
        </Grid>

        {/* Dynamic Swarm Suggestion Header & Refresh Button */}
        <Box sx={{ mt: 2.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageIcon sx={{ color: '#00D2FF', fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: '#00D2FF', fontWeight: 800, textTransform: 'uppercase' }}>
                Live {clientData?.industry || 'Industry'} Swarm Signals
              </Typography>
              {suggestionsLastUpdated && (
                <Chip
                  label={`Synced ${suggestionsLastUpdated}`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.62rem', background: 'rgba(255,255,255,0.06)', color: '#94A3B8' }}
                />
              )}
            </Box>

            <Button
              size="small"
              variant="outlined"
              startIcon={loadingSuggestions ? <CircularProgress size={12} color="inherit" /> : <RefreshIcon sx={{ fontSize: 14 }} />}
              onClick={() => fetchDynamicSuggestions(true)}
              disabled={loadingSuggestions}
              sx={{
                fontSize: '0.7rem',
                color: '#00D2FF',
                borderColor: 'rgba(0, 210, 255, 0.3)',
                py: 0.2,
                px: 1,
                textTransform: 'none',
                fontWeight: 700
              }}
            >
              {loadingSuggestions ? 'Updating Swarm...' : 'Update Swarm'}
            </Button>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
            {loadingSuggestions ? (
              <Box sx={{ py: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: '#00D2FF' }} />
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>Scanning multi-engine swarm nodes...</Typography>
              </Box>
            ) : liveSuggestions.length > 0 ? (
              liveSuggestions.map((s, idx) => (
                <Chip
                  key={idx}
                  label={s}
                  size="small"
                  clickable
                  onClick={() => { setQuery(s); handleScrape(s); }}
                  sx={{
                    borderColor: 'rgba(0, 210, 255, 0.3)',
                    background: 'rgba(0, 210, 255, 0.05)',
                    color: '#F0F3F6',
                    fontSize: '0.72rem',
                    '&:hover': { borderColor: '#00D2FF', background: 'rgba(0, 210, 255, 0.15)' }
                  }}
                  variant="outlined"
                />
              ))
            ) : (
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                No active signals found. Click 'Update Swarm' to scrape live trends.
              </Typography>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* RESULTS DISPLAY */}
      {results && results.data && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              🔥 Triangulated Signals ({results.triangulated_count} signals found in {results.swarm_latency_ms}ms)
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {results.data.map((item, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Chip
                        label={item.importance_badge}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                      <Chip
                        label={`${item.consensus_pct}% Consensus`}
                        size="small"
                        sx={{ backgroundColor: 'rgba(245, 166, 35, 0.15)', color: '#F5A623' }}
                      />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F0F3F6', mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94A3B8', mb: 1.5 }}>
                      {item.summary}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                      Sources: {item.source}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        startIcon={<BoltIcon />}
                        onClick={() => onLaunchTrend && onLaunchTrend(item.title)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)',
                          color: '#121212',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(245, 166, 35, 0.4)'
                          }
                        }}
                      >
                        ⚡ Sprint in Studio
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<EditNoteIcon />}
                        onClick={() => onWeaveToDirector && onWeaveToDirector(item.title)}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          color: '#4B9BFF',
                          borderColor: 'rgba(24, 119, 242, 0.4)'
                        }}
                      >
                        ✍️ Weave in Director
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
