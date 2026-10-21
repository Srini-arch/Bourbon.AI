import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Chip, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Tooltip, Alert, CircularProgress, Card,
  CardContent, Divider, TablePagination
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalculateIcon from '@mui/icons-material/Calculate';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import BoltIcon from '@mui/icons-material/Bolt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

const PROMPT_SUGGESTIONS = [
  "Audit curriculum balance across Orator, Writer, and Finance",
  "How many unique post permutations can be generated from our facts?",
  "Recommend 3 new curriculum facts to expand our Finance offering",
  "Check Grade 3-5 vs Grade 6-10 topic distribution"
];

export default function KnowledgeStudio({ clientData }) {
  const clientName = clientData?.name || 'Unbox-ED';

  // Analytics & Permutations State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Facts Table State
  const [facts, setFacts] = useState([]);
  const [loadingFacts, setLoadingFacts] = useState(false);
  const [selectedProductFilter, setSelectedProductFilter] = useState('All Brand Offerings');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  // KM AI Chat Assistant State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am the **Bourbon.AI Knowledge Manager AI**. I track curriculum facts in vector memory and compute content capacity formulas. Ask me about curriculum distribution, content fatigue runways, or pedagogy gaps!`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Add / Edit Fact Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [factFormData, setFactFormData] = useState({
    id: '',
    client_name: clientName,
    product_name: 'Orator Unbox-ED',
    category: 'Public Speaking',
    core_fact: '',
    student_outcome: '',
    pedagogical_context: '',
    target_audience: 'Grade 3-10, Parents',
    keywords: 'public speaking, confidence',
    teaching_differentiator: 'Interactive small-cohort dialogue'
  });

  // Toast Notification
  const [toastMsg, setToastMsg] = useState(null);
  const [syncingVector, setSyncingVector] = useState(false);

  // Fetch Analytics & Permutations
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`${API_BASE}/api/km/analytics?client_name=${encodeURIComponent(clientName)}`);
      const data = await res.json();
      if (data.status === 'ok') {
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch KM analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Facts
  const fetchFacts = async () => {
    setLoadingFacts(true);
    try {
      const url = selectedProductFilter === 'All Brand Offerings'
        ? `${API_BASE}/api/facts?client_name=${encodeURIComponent(clientName)}`
        : `${API_BASE}/api/facts?client_name=${encodeURIComponent(clientName)}&product_name=${encodeURIComponent(selectedProductFilter)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'ok') {
        setFacts(data.facts || []);
      }
    } catch (err) {
      console.error('Failed to fetch facts:', err);
    } finally {
      setLoadingFacts(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchFacts();
  }, [clientName, selectedProductFilter]);

  // Send message to KM Chat
  const handleSendKMChat = async (msgToSend) => {
    const text = msgToSend || chatInput;
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/km/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, client_name: clientName })
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      console.error('KM Chat error:', err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Apologies, failed to process knowledge query.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Save Fact (Create or Update)
  const handleSaveFact = async () => {
    if (!factFormData.id.trim() || !factFormData.core_fact.trim()) {
      setToastMsg('Fact Slug ID and Core Fact are required.');
      return;
    }

    try {
      const payload = {
        ...factFormData,
        client_name: clientName,
        keywords: typeof factFormData.keywords === 'string'
          ? factFormData.keywords.split(',').map(k => k.trim()).filter(Boolean)
          : factFormData.keywords
      };

      const url = isEditing
        ? `${API_BASE}/api/facts/${encodeURIComponent(factFormData.id)}`
        : `${API_BASE}/api/facts`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setToastMsg(isEditing ? `Fact '${factFormData.id}' updated & vectorized!` : `Fact '${factFormData.id}' saved & vectorized!`);
        setDialogOpen(false);
        fetchFacts();
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Save fact error:', err);
      setToastMsg('Failed to save fact.');
    }
  };

  // Handle Delete Fact
  const handleDeleteFact = async (factId) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${factId}' from vector memory and database?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/facts/${encodeURIComponent(factId)}?client_name=${encodeURIComponent(clientName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setToastMsg(`Fact '${factId}' deleted.`);
        fetchFacts();
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Delete fact error:', err);
      setToastMsg('Failed to delete fact.');
    }
  };

  // Sync Vector DB
  const handleSyncVectorDB = async () => {
    setSyncingVector(true);
    try {
      const res = await fetch(`${API_BASE}/api/vector/sync`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'ok') {
        setToastMsg('✅ Unified Vector DB re-indexed successfully across all collections!');
        fetchAnalytics();
      }
    } catch (err) {
      console.error('Vector sync error:', err);
      setToastMsg('Vector sync failed.');
    } finally {
      setSyncingVector(false);
    }
  };

  // Filtered facts
  const filteredFacts = facts.filter(f => {
    const q = searchQuery.toLowerCase();
    return (
      f.id.toLowerCase().includes(q) ||
      (f.core_fact && f.core_fact.toLowerCase().includes(q)) ||
      (f.category && f.category.toLowerCase().includes(q)) ||
      (f.product_name && f.product_name.toLowerCase().includes(q))
    );
  });

  const formula = analytics?.permutation_formula || {
    num_facts: 37,
    num_funnel_stages: 5,
    num_hooks: 5,
    num_formats: 4,
    num_visual_presets: 8,
    total_permutations: 29600,
    content_runway_years: 81.1
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {toastMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToastMsg(null)}>
          {toastMsg}
        </Alert>
      )}

      {/* HEADER SECTION */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              🧠 Knowledge Base & AI Studio
            </Typography>
            <Chip
              icon={<PsychologyIcon />}
              label="Knowledge Manager AI"
              size="small"
              sx={{ background: 'rgba(245, 166, 35, 0.15)', color: '#F5A623', fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="subtitle1">
            Combinatorial Permutation Engine • Vector Memory • Interactive Curriculum CRUD • Unified Architecture
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={syncingVector ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={handleSyncVectorDB}
            disabled={syncingVector}
            sx={{ borderColor: 'rgba(245, 166, 35, 0.4)', color: '#F5A623', fontWeight: 700 }}
          >
            {syncingVector ? 'Re-Indexing Vectors...' : '🔄 Re-Index Vector DB'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setIsEditing(false);
              setFactFormData({
                id: '',
                client_name: clientName,
                product_name: 'Orator Unbox-ED',
                category: 'Public Speaking',
                core_fact: '',
                student_outcome: '',
                pedagogical_context: '',
                target_audience: 'Grade 3-10, Parents',
                keywords: 'public speaking, confidence',
                teaching_differentiator: 'Interactive small-cohort dialogue'
              });
              setDialogOpen(true);
            }}
            sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #F5A623 0%, #D48806 100%)', color: '#121212' }}
          >
            ➕ Add Fact
          </Button>
        </Stack>
      </Box>

      {/* TOP KPI: KNOWLEDGE CAPACITY & COMBINATORIAL FORMULA CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, background: 'rgba(20, 23, 31, 0.7)', border: '1px solid rgba(245,166,35,0.2)' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Curriculum Facts
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#F5A623', mt: 0.5 }}>
              {analytics?.total_facts || 37}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Verified across 3 commercial programs
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, background: 'rgba(20, 23, 31, 0.7)', border: '1px solid rgba(0,210,255,0.2)' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Unique Post Permutations
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#00D2FF', mt: 0.5 }}>
              {formula.total_permutations?.toLocaleString() || '29,600'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Facts × Funnel × Hooks × Formats × Visuals
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, background: 'rgba(20, 23, 31, 0.7)', border: '1px solid rgba(76,175,80,0.2)' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Content Fatigue Runway
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#4CAF50', mt: 0.5 }}>
              {formula.content_runway_years || 81.1} yrs
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Zero-repetition daily posting duration
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, background: 'rgba(20, 23, 31, 0.7)', border: '1px solid rgba(24,119,242,0.2)' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
              Vector Memory Fabric
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#4B9BFF', mt: 0.5 }}>
              {analytics?.vector_stats?.total_vectors || 42}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              384-dim ONNX FastEmbed vectors
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* COMBINATORIAL FORMULA BANNER */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.08) 0%, rgba(20, 23, 31, 0.9) 100%)', border: '1px solid rgba(245,166,35,0.25)' }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <CalculateIcon sx={{ color: '#F5A623', fontSize: 32 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
              Combinatorial Campaign Capacity Formula
            </Typography>
            <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.88rem' }}>
              Formula: <strong style={{ color: '#F5A623' }}>{formula.num_facts}</strong> Facts × <strong style={{ color: '#00D2FF' }}>{formula.num_funnel_stages}</strong> Funnels × <strong style={{ color: '#00D2FF' }}>{formula.num_hooks}</strong> Hooks × <strong style={{ color: '#00D2FF' }}>{formula.num_formats}</strong> Formats × <strong style={{ color: '#00D2FF' }}>{formula.num_visual_presets}</strong> Visual Presets = <strong style={{ color: '#4CAF50' }}>{formula.total_permutations?.toLocaleString()} Unique Angles</strong>
            </Typography>
          </Box>
          <Chip
            icon={<VerifiedUserIcon />}
            label="Zero Hallucination Runway"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Paper>

      {/* 2-COLUMN WORKSPACE: LEFT (FACT CRUD TABLE) & RIGHT (KM AI ASSISTANT CHAT) */}
      <Grid container spacing={2.5}>

        {/* LEFT COLUMN: INTERACTIVE FACT EXPLORER TABLE (Width: 7 / 12) */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuBookIcon sx={{ color: '#F5A623' }} /> Curriculum & USP Facts
              </Typography>
              <Chip
                label={`${filteredFacts.length} Facts Loaded`}
                size="small"
                sx={{ background: 'rgba(245, 166, 35, 0.15)', color: '#F5A623', fontWeight: 700 }}
              />
            </Box>

            {/* Filter Controls */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Commercial Offering</InputLabel>
                  <Select
                    value={selectedProductFilter}
                    label="Filter by Commercial Offering"
                    onChange={(e) => setSelectedProductFilter(e.target.value)}
                  >
                    <MenuItem value="All Brand Offerings">All Brand Offerings</MenuItem>
                    {(clientData?.usps?.products || []).map((p, idx) => {
                      const pName = typeof p === 'object' ? p.name : p;
                      return <MenuItem key={idx} value={pName}>{pName}</MenuItem>;
                    })}
                    {(!clientData?.usps?.products || clientData.usps.products.length === 0) && (
                      <MenuItem value={clientData?.brand_focus || clientName}>{clientData?.brand_focus || clientName}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search facts by keyword or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Facts Table */}
            {loadingFacts ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={32} sx={{ color: '#F5A623' }} />
              </Box>
            ) : filteredFacts.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  No facts match the selected filter. Click "➕ Add Fact" to create one.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, backgroundColor: '#0F1218', color: '#F5A623' }}>Fact ID</TableCell>
                      <TableCell sx={{ fontWeight: 800, backgroundColor: '#0F1218', color: '#F5A623' }}>Offering / Category</TableCell>
                      <TableCell sx={{ fontWeight: 800, backgroundColor: '#0F1218', color: '#F5A623' }}>Core Fact & Outcome</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, backgroundColor: '#0F1218', color: '#F5A623' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFacts
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((f) => (
                        <TableRow key={f.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 700, color: '#F0F3F6', fontSize: '0.8rem' }}>
                            {f.id}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem' }}>
                            <Chip
                              label={f.product_name || 'General'}
                              size="small"
                              sx={{ fontSize: '0.68rem', height: 20, mr: 0.5 }}
                            />
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                              {f.category}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: '#CBD5E1', maxWidth: 260 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                              {f.core_fact}
                            </Typography>
                            {f.student_outcome && (
                              <Typography variant="caption" sx={{ color: '#4CAF50', display: 'block' }}>
                                🎯 {f.student_outcome}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setIsEditing(true);
                                  setFactFormData({
                                    id: f.id,
                                    client_name: f.client_name || clientName,
                                    product_name: f.product_name || 'Orator Unbox-ED',
                                    category: f.category || 'Public Speaking',
                                    core_fact: f.core_fact,
                                    student_outcome: f.student_outcome || '',
                                    pedagogical_context: f.pedagogical_context || '',
                                    target_audience: f.target_audience || 'Parents',
                                    keywords: Array.isArray(f.keywords) ? f.keywords.join(', ') : f.keywords || '',
                                    teaching_differentiator: f.teaching_differentiator || ''
                                  });
                                  setDialogOpen(true);
                                }}
                                sx={{ color: '#4B9BFF' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteFact(f.id)}
                                sx={{ color: '#FF5252' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <TablePagination
              rowsPerPageOptions={[6, 12, 24]}
              component="div"
              count={filteredFacts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{ color: '#94A3B8' }}
            />
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: KNOWLEDGE MANAGER AI ASSISTANT CHAT (Width: 5 / 12) */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PsychologyIcon sx={{ color: '#00D2FF' }} /> Knowledge Manager AI
              </Typography>
              <Chip
                label="Llama 3.3 / Sarvam"
                size="small"
                variant="outlined"
                sx={{ borderColor: '#00D2FF', color: '#00D2FF', fontSize: '0.7rem' }}
              />
            </Box>

            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2, fontSize: '0.82rem' }}>
              Audit your pedagogy balance, detect curriculum coverage blindspots, and calculate exact post permutations.
            </Typography>

            {/* Quick Prompt Chips */}
            <Stack direction="row" spacing={0.8} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.8 }}>
              {PROMPT_SUGGESTIONS.map((p, idx) => (
                <Chip
                  key={idx}
                  label={p}
                  size="small"
                  clickable
                  onClick={() => handleSendKMChat(p)}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', borderColor: 'rgba(245,166,35,0.3)', '&:hover': { borderColor: '#F5A623' } }}
                />
              ))}
            </Stack>

            {/* Chat Message Box */}
            <Box
              sx={{
                flexGrow: 1,
                minHeight: 280,
                maxHeight: 380,
                overflowY: 'auto',
                p: 1.5,
                backgroundColor: 'rgba(11, 13, 17, 0.6)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.06)',
                mb: 2
              }}
            >
              {chatMessages.map((m, idx) => (
                <Box
                  key={idx}
                  sx={{
                    mb: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748B', mb: 0.2 }}>
                    {m.role === 'user' ? 'You' : 'Knowledge Manager AI'}
                  </Typography>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      maxWidth: '90%',
                      backgroundColor: m.role === 'user' ? 'rgba(245, 166, 35, 0.2)' : 'rgba(20, 23, 31, 0.8)',
                      border: m.role === 'user' ? '1px solid rgba(245, 166, 35, 0.4)' : '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#F0F3F6', whiteSpace: 'pre-wrap', fontSize: '0.82rem' }}>
                      {m.content}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {chatLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                  <CircularProgress size={16} sx={{ color: '#00D2FF' }} />
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Knowledge Manager analyzing vector memory...
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Chat Input Bar */}
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask about curriculum facts, post formulas, or gaps..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendKMChat()}
              />
              <IconButton
                color="primary"
                onClick={() => handleSendKMChat()}
                disabled={chatLoading || !chatInput.trim()}
                sx={{ backgroundColor: 'rgba(245, 166, 35, 0.15)' }}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Paper>
        </Grid>

      </Grid>

      {/* ADD / EDIT FACT DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
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
        <DialogTitle sx={{ fontWeight: 800 }}>
          {isEditing ? `✏️ Edit SourceFact: ${factFormData.id}` : '➕ Add New Curriculum Fact to Knowledge Base'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fact ID / Slug"
                  placeholder="e.g. orator-debate-cross-examination"
                  value={factFormData.id}
                  disabled={isEditing}
                  onChange={(e) => setFactFormData({ ...factFormData, id: e.target.value })}
                  helperText="Unique identifier used by the semantic vector DB"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Commercial Offering</InputLabel>
                  <Select
                    value={factFormData.product_name}
                    label="Commercial Offering"
                    onChange={(e) => setFactFormData({ ...factFormData, product_name: e.target.value })}
                  >
                    <MenuItem value="Orator Unbox-ED">Orator Unbox-ED</MenuItem>
                    <MenuItem value="Writer Unbox-ED">Writer Unbox-ED</MenuItem>
                    <MenuItem value="Finance Unbox-ED">Finance Unbox-ED</MenuItem>
                    <MenuItem value="General Curriculum">General Curriculum</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pedagogical Category"
                  placeholder="e.g. Public Speaking / Financial Literacy"
                  value={factFormData.category}
                  onChange={(e) => setFactFormData({ ...factFormData, category: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Target Audience"
                  placeholder="e.g. Grade 3-10, Parents"
                  value={factFormData.target_audience}
                  onChange={(e) => setFactFormData({ ...factFormData, target_audience: e.target.value })}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              label="Core Fact & Pedagogical Insight"
              placeholder="Explain the verified curriculum lesson or experiential exercise..."
              value={factFormData.core_fact}
              onChange={(e) => setFactFormData({ ...factFormData, core_fact: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Student Breakthrough Outcome"
                  placeholder="What tangible skill or milestone does the student achieve?"
                  value={factFormData.student_outcome}
                  onChange={(e) => setFactFormData({ ...factFormData, student_outcome: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  label="Pedagogical Context / Exercise"
                  placeholder="Describe the classroom framework or simulation..."
                  value={factFormData.pedagogical_context}
                  onChange={(e) => setFactFormData({ ...factFormData, pedagogical_context: e.target.value })}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Keywords (comma separated)"
                  placeholder="speaking, confidence, storytelling"
                  value={factFormData.keywords}
                  onChange={(e) => setFactFormData({ ...factFormData, keywords: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Teaching Differentiator"
                  placeholder="Why this method beats rote learning"
                  value={factFormData.teaching_differentiator}
                  onChange={(e) => setFactFormData({ ...factFormData, teaching_differentiator: e.target.value })}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#94A3B8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveFact}
            sx={{ fontWeight: 800, px: 3 }}
          >
            💾 Save & Vectorize Fact
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
