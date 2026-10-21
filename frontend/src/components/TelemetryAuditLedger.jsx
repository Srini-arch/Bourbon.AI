import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { getTelemetryLogs, exportLogsAsFile, clearTelemetryLogs } from '../utils/telemetryLogger';
import { getApiBase } from '../apiConfig';

export default function TelemetryAuditLedger() {
  const [activeTab, setActiveTab] = useState('browser'); // 'browser' or 'backend'
  const [browserLogs, setBrowserLogs] = useState([]);
  const [backendLogs, setBackendLogs] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const apiBase = getApiBase();

  const loadBrowserLogs = () => {
    const logs = getTelemetryLogs();
    setBrowserLogs(logs);
  };

  const loadBackendLogs = async () => {
    setBackendLoading(true);
    setBackendError(null);
    try {
      const endpoint = apiBase ? `${apiBase}/api/telemetry/ledger?limit=100` : '/api/telemetry/ledger?limit=100';
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === 'ok') {
        setBackendLogs(data.logs || []);
        setActiveSessions(data.active_sessions || []);
      }
    } catch (err) {
      setBackendError(apiBase ? `Could not connect to backend at ${apiBase}` : 'No backend endpoint configured. Currently running in standalone client mode.');
    } finally {
      setBackendLoading(false);
    }
  };

  useEffect(() => {
    loadBrowserLogs();
    loadBackendLogs();
  }, [apiBase]);

  const handleClearBrowser = () => {
    if (window.confirm('Clear all local browser activity and login logs?')) {
      clearTelemetryLogs();
      loadBrowserLogs();
    }
  };

  // Filter logs by search query
  const filteredBrowserLogs = browserLogs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.category && log.category.toLowerCase().includes(q)) ||
      (log.user && log.user.toLowerCase().includes(q)) ||
      (log.client && log.client.toLowerCase().includes(q))
    );
  });

  const filteredBackendLogs = backendLogs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.event_type && log.event_type.toLowerCase().includes(q)) ||
      (log.client_name && log.client_name.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* HEADER */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#F5A623', letterSpacing: '-0.02em' }}>
              🛡️ Audit Ledger & Session Tracker
            </Typography>
            <Chip
              label={`${browserLogs.length} Browser Events`}
              size="small"
              sx={{ backgroundColor: 'rgba(245, 166, 35, 0.15)', color: '#F5A623', fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
            Trace real-time administrator logins, session lock acquisitions, KYC changes, and backend SQLite audit ledgers.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={exportLogsAsFile}
            sx={{
              color: '#60A5FA',
              borderColor: 'rgba(96, 165, 250, 0.4)',
              textTransform: 'none',
              fontWeight: 700
            }}
          >
            Export JSON
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={handleClearBrowser}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Clear Browser Logs
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadBrowserLogs();
              loadBackendLogs();
            }}
            sx={{
              backgroundColor: '#F5A623',
              color: '#121212',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#E09612' }
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* KPI METRIC CARDS */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, backgroundColor: '#14171F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Browser Audit Trail
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#F0F3F6', my: 0.5 }}>
            {browserLogs.length}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Logged in-memory and persisted to localStorage
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, backgroundColor: '#14171F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Active Backend Sessions
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#10B981', my: 0.5 }}>
            {activeSessions.length}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Multi-tenant concurrency locks held in global_backend.db
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, backgroundColor: '#14171F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Global SQLite Telemetry
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#38BDF8', my: 0.5 }}>
            {backendLogs.length}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Backend events recorded across all sessions
          </Typography>
        </Paper>
      </Stack>

      {/* FILTER & TAB CONTROLS */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#14171F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            <Button
              variant={activeTab === 'browser' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setActiveTab('browser')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: activeTab === 'browser' ? '#F5A623' : 'transparent',
                color: activeTab === 'browser' ? '#121212' : '#CBD5E1',
                borderColor: 'rgba(245, 166, 35, 0.4)',
                '&:hover': {
                  backgroundColor: activeTab === 'browser' ? '#E09612' : 'rgba(245, 166, 35, 0.1)'
                }
              }}
            >
              In-App Activity Logs ({filteredBrowserLogs.length})
            </Button>
            <Button
              variant={activeTab === 'backend' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setActiveTab('backend')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                backgroundColor: activeTab === 'backend' ? '#F5A623' : 'transparent',
                color: activeTab === 'backend' ? '#121212' : '#CBD5E1',
                borderColor: 'rgba(245, 166, 35, 0.4)',
                '&:hover': {
                  backgroundColor: activeTab === 'backend' ? '#E09612' : 'rgba(245, 166, 35, 0.1)'
                }
              }}
            >
              Backend SQLite Ledger ({filteredBackendLogs.length})
            </Button>
          </Stack>

          <TextField
            size="small"
            placeholder="Search action, user, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: {
                color: '#F0F3F6',
                backgroundColor: '#0B0D11',
                borderRadius: 1.5,
                fontSize: '0.85rem',
                width: { xs: '100%', sm: 280 }
              }
            }}
          />
        </Stack>
      </Paper>

      {/* TAB CONTENT: BROWSER LOGS */}
      {activeTab === 'browser' && (
        <TableContainer component={Paper} sx={{ backgroundColor: '#14171F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#0B0D11' }}>
                <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Timestamp</TableCell>
                <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Category</TableCell>
                <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Action</TableCell>
                <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Admin User</TableCell>
                <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Operating Brand</TableCell>
                <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Details & Context</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBrowserLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
                    No audit events match your filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBrowserLogs.map((log, idx) => (
                  <TableRow key={idx} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell sx={{ color: '#CBD5E1', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.category || 'EVENT'}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor:
                            log.category === 'AUTH' ? 'rgba(96, 165, 250, 0.15)' :
                            log.category === 'KYC' ? 'rgba(245, 166, 35, 0.15)' :
                            'rgba(148, 163, 184, 0.15)',
                          color:
                            log.category === 'AUTH' ? '#60A5FA' :
                            log.category === 'KYC' ? '#F5A623' :
                            '#CBD5E1'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#F0F3F6', fontWeight: 600, fontSize: '0.8rem' }}>
                      {log.action}
                    </TableCell>
                    <TableCell sx={{ color: '#38BDF8', fontSize: '0.8rem' }}>
                      {log.user || 'admin'}
                    </TableCell>
                    <TableCell sx={{ color: '#A78BFA', fontSize: '0.8rem' }}>
                      {log.client || 'Unbox-ED'}
                    </TableCell>
                    <TableCell sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '—')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB CONTENT: BACKEND SQLITE LEDGER */}
      {activeTab === 'backend' && (
        <Box>
          {backendError && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {backendError}
            </Alert>
          )}

          {activeSessions.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#14171F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#10B981', mb: 1 }}>
                ● Active Concurrency Locks (Server)
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {activeSessions.map((s, idx) => (
                  <Chip
                    key={idx}
                    label={`${s.client_name}: ${s.session_id.slice(0, 8)}... (${s.last_active})`}
                    size="small"
                    sx={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 600 }}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          <TableContainer component={Paper} sx={{ backgroundColor: '#14171F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#0B0D11' }}>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Timestamp</TableCell>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Client / Tenant</TableCell>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Event Type</TableCell>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>Server Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBackendLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
                      {backendLoading ? 'Querying backend database...' : 'No backend records available.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBackendLogs.map((log, idx) => (
                    <TableRow key={idx} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                      <TableCell sx={{ color: '#CBD5E1', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {log.timestamp}
                      </TableCell>
                      <TableCell sx={{ color: '#F5A623', fontWeight: 600, fontSize: '0.8rem' }}>
                        {log.client_name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.event_type}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor:
                              log.event_type === 'LOGIN' ? 'rgba(16, 185, 129, 0.15)' :
                              log.event_type === 'LOGOUT' ? 'rgba(244, 63, 94, 0.15)' :
                              'rgba(148, 163, 184, 0.15)',
                            color:
                              log.event_type === 'LOGIN' ? '#10B981' :
                              log.event_type === 'LOGOUT' ? '#F43F5E' :
                              '#CBD5E1'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
