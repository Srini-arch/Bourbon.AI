import React, { useState, useEffect } from 'react';
import {
  ThemeProvider, CssBaseline, Box, Drawer, AppBar, Toolbar, Typography,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider,
  IconButton, Chip, Stack, Button, Tooltip, Paper
} from '@mui/material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BusinessIcon from '@mui/icons-material/Business';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LayersIcon from '@mui/icons-material/Layers';

import MenuBookIcon from '@mui/icons-material/MenuBook';
import EditNoteIcon from '@mui/icons-material/EditNote';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TuneIcon from '@mui/icons-material/Tune';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { bourbonTheme } from './theme';
import CreativeStudio from './components/CreativeStudio';
import BbnWorkstation from './components/BbnWorkstation';
import ContentDirector from './components/ContentDirector';
import KnowledgeStudio from './components/KnowledgeStudio';
import GovernanceHub from './components/GovernanceHub';
import BrandKYC from './components/BrandKYC';
import AskBourbon from './components/AskBourbon';
import Trendscraper from './components/Trendscraper';
import ImageAgentSettings from './components/ImageAgentSettings';
import ClientRegistrationModal from './components/ClientRegistrationModal';
import BbnFileExplorer from './components/BbnFileExplorer';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminLogin from './components/AdminLogin';
import { UNBOX_ED_BRAND_DATA } from './data/defaultBrandData';
import { logActivity, exportLogsAsFile } from './utils/telemetryLogger';
import HistoryIcon from '@mui/icons-material/History';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const DRAWER_WIDTH = 260;
const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function App() {
  const [sessionToken, setSessionToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('bourbon_session_token') : null;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('bourbon_username') || 'admin') : 'admin';
  });

  // Default active tab is Brand KYC as the central cockpit
  const [activeTab, setActiveTab] = useState('kyc');
  const [clientData, setClientData] = useState(() => {
    try {
      const saved = localStorage.getItem('bourbon_kyc_Unbox-ED');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return UNBOX_ED_BRAND_DATA;
  });
  const [clientsList, setClientsList] = useState(['Unbox-ED']);
  const [selectedClient, setSelectedClient] = useState('Unbox-ED');
  const [healthStatus, setHealthStatus] = useState('ok');
  const [selectedTrendForSprint, setSelectedTrendForSprint] = useState(null);
  const [briefForStudio, setBriefForStudio] = useState(null);
  const [clientRegisterOpen, setClientRegisterOpen] = useState(false);

  const handleLoginSuccess = (authData) => {
    setSessionToken(authData.token);
    setCurrentUser(authData.username || 'admin');
    if (authData.client) {
      setSelectedClient(authData.client);
    }
    logActivity('AUTH', 'ADMIN_SESSION_ESTABLISHED', {
      user: authData.username || 'admin',
      client: authData.client || 'Unbox-ED'
    });
  };

  const handleLogout = async () => {
    logActivity('AUTH', 'ADMIN_SESSION_LOCKED', {
      user: currentUser
    });
    try {
      if (sessionToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: sessionToken })
        });
      }
    } catch (_) {}
    localStorage.removeItem('bourbon_session_token');
    localStorage.removeItem('bourbon_username');
    setSessionToken(null);
  };

  const handleSelectTab = (tabId) => {
    logActivity('NAVIGATION', 'TAB_ACCESSED', {
      target_tab: tabId,
      previous_tab: activeTab
    });
    setActiveTab(tabId);
  };

  const handleLaunchTrendCampaign = (trendTitle) => {
    logActivity('CAMPAIGN', 'TREND_SPRINT_INITIATED', { trend: trendTitle });
    setSelectedTrendForSprint(trendTitle);
    setActiveTab('studio');
  };

  const fetchClientData = async (clientToFetch = null) => {
    try {
      const res = await fetch(`${API_BASE}/api/clients`);
      const data = await res.json();
      if (data.clients) {
        setClientsList(data.clients);
      }
      const target = clientToFetch || data.selected_client || 'Unbox-ED';
      setSelectedClient(target);
      // Fetch specific client info
      const clientRes = await fetch(`${API_BASE}/api/clients`);
      const clientInfo = await clientRes.json();
      if (clientInfo && clientInfo.client_data) {
        setClientData(clientInfo.client_data);
      }
    } catch (err) {
      console.warn('Backend API offline, loading sovereign Unbox-ED brand dossier:', err);
      try {
        const saved = localStorage.getItem('bourbon_kyc_Unbox-ED');
        if (saved) {
          setClientData(JSON.parse(saved));
          return;
        }
      } catch (_) {}
      setClientData(UNBOX_ED_BRAND_DATA);
    }
  };

  const handleSwitchClient = (newClient) => {
    setSelectedClient(newClient);
    fetchClientData(newClient);
  };

  useEffect(() => {
    fetchClientData();
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(d => setHealthStatus(d.status))
      .catch(() => setHealthStatus('err'));
  }, []);

  const navItems = [
    { id: 'kyc', label: 'Brand KYC Dossier', sub: 'DNA, Voice, USPs & Visuals (Cockpit)', icon: <BusinessIcon /> },
    { id: 'studio', label: 'BBN Creative Studio', sub: '1–50 Posts & Carousels • Hermite Compositing', icon: <LayersIcon /> },
    { id: 'knowledge', label: 'Deep Knowledge Base', sub: '6 Flagship Curricula • 4.8K Permutations', icon: <MenuBookIcon /> },
    { id: 'director', label: 'Content Director', sub: 'Interactive Brief Writer', icon: <EditNoteIcon /> },
    { id: 'bbn_explorer', label: '.BBN File Explorer', sub: 'Search, Sort & Batch Delete', icon: <FolderOpenIcon /> },
    { id: 'trends', label: 'Trendscraper', sub: 'Swarm Intelligence', icon: <TrendingUpIcon /> },
    { id: 'settings', label: 'Image Agent & Settings', sub: 'Multi-Engine & API Vault', icon: <TuneIcon /> },
    { id: 'governance', label: 'Review & Governance', sub: 'SLA Telemetry & Approvals', icon: <VerifiedUserIcon /> },
    { id: 'concierge', label: 'Ask Bourbon.AI', sub: 'AI Concierge & Status', icon: <SmartToyIcon /> },
  ];

  // --- SINGLE ADMIN LOGIN GATE ---
  if (!sessionToken) {
    return (
      <ThemeProvider theme={bourbonTheme}>
        <CssBaseline />
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={bourbonTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0B0D11' }}>
        
        {/* APP BAR */}
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${DRAWER_WIDTH}px)`,
            ml: `${DRAWER_WIDTH}px`,
            backgroundColor: 'rgba(11, 13, 17, 0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(245, 166, 35, 0.15)',
            boxShadow: 'none'
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#F5A623', letterSpacing: '-0.02em' }}>
                ☕ BOURBON.AI
              </Typography>
              <Chip
                label="v2.0 React + MUI"
                size="small"
                sx={{
                  backgroundColor: 'rgba(245, 166, 35, 0.15)',
                  color: '#F5A623',
                  fontWeight: 700,
                  fontSize: '0.7rem'
                }}
              />
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Active Brand Interactive Badge -> Opens Brand KYC */}
              <Tooltip title="Operating Brand: Unbox-ED. Click to open Brand KYC Dossier.">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BusinessIcon sx={{ color: '#F5A623', fontSize: 16 }} />}
                  onClick={() => setActiveTab('kyc')}
                  sx={{
                    color: '#F0F3F6',
                    borderColor: 'rgba(245, 166, 35, 0.4)',
                    backgroundColor: 'rgba(245, 166, 35, 0.08)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    height: 32,
                    px: 1.5,
                    textTransform: 'none',
                    borderRadius: 1.5,
                    '&:hover': {
                      borderColor: '#F5A623',
                      backgroundColor: 'rgba(245, 166, 35, 0.16)'
                    }
                  }}
                >
                  Brand: <span style={{ color: '#F5A623', marginLeft: 4 }}>{clientData?.name || selectedClient || 'Unbox-ED'}</span>
                </Button>
              </Tooltip>

              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                label={healthStatus === 'ok' ? 'APIs Operational' : 'Offline Mode'}
                color={healthStatus === 'ok' ? 'success' : 'warning'}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />

              {/* Telemetry Activity Log Exporter */}
              <Tooltip title="Export Live Activity & Login Audit Log (JSON)">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<HistoryIcon sx={{ fontSize: 16 }} />}
                  onClick={exportLogsAsFile}
                  sx={{
                    color: '#60A5FA',
                    borderColor: 'rgba(96, 165, 250, 0.4)',
                    backgroundColor: 'rgba(96, 165, 250, 0.08)',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    height: 32,
                    fontWeight: 700,
                    px: 1.5,
                    '&:hover': {
                      borderColor: '#60A5FA',
                      backgroundColor: 'rgba(96, 165, 250, 0.16)'
                    }
                  }}
                >
                  Logs
                </Button>
              </Tooltip>

              {/* Admin Session Indicator & Logout */}
              <Tooltip title={`Authenticated as Admin: ${currentUser}. Click to lock session.`}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<LogoutIcon sx={{ fontSize: 15 }} />}
                  onClick={handleLogout}
                  sx={{
                    color: '#F5A623',
                    borderColor: 'rgba(245, 166, 35, 0.4)',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    height: 32,
                    fontWeight: 700,
                    px: 1.5,
                    '&:hover': {
                      borderColor: '#F5A623',
                      backgroundColor: 'rgba(245, 166, 35, 0.12)'
                    }
                  }}
                >
                  Lock
                </Button>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* SIDEBAR DRAWER */}
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: '#0F1218',
              borderRight: '1px solid rgba(245, 166, 35, 0.12)',
            },
          }}
        >
          {/* Logo Brand Header */}
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
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
              <Typography variant="h6" sx={{ color: '#121212', fontWeight: 900 }}>B</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F0F3F6', lineHeight: 1.1 }}>
                Bourbon Studio
              </Typography>
              <Typography variant="caption" sx={{ color: '#F5A623', fontSize: '0.68rem', fontWeight: 600 }}>
                Enterprise Creative Suite
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

          {/* Navigation Links */}
          <List sx={{ px: 1.5, py: 2 }}>
            {navItems.map((item) => {
              const selected = activeTab === item.id;
              return (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.8 }}>
                  <ListItemButton
                    selected={selected}
                    onClick={() => handleSelectTab(item.id)}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 1.5,
                      backgroundColor: selected ? 'rgba(245, 166, 35, 0.12)' : 'transparent',
                      border: selected ? '1px solid rgba(245, 166, 35, 0.3)' : '1px solid transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(245, 166, 35, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: selected ? '#F5A623' : '#64748B',
                        minWidth: 38
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.sub}
                      primaryTypographyProps={{
                        fontWeight: selected ? 700 : 500,
                        fontSize: '0.88rem',
                        color: selected ? '#F5A623' : '#E2E8F0',
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.7rem',
                        color: '#64748B',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Box sx={{ mt: 'auto', p: 2 }}>
            <Paper
              onClick={() => setActiveTab('kyc')}
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: 'rgba(20, 23, 31, 0.7)',
                cursor: 'pointer',
                border: '1px solid rgba(245, 166, 35, 0.2)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#F5A623',
                  background: 'rgba(245, 166, 35, 0.08)'
                }
              }}
            >
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <span>Active Brand</span>
                <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.65rem' }}>● KYC Active</span>
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#F5A623' }}>
                {clientData?.name || 'Unbox-ED'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                Click to edit KYC Profile & Guardrails
              </Typography>
            </Paper>
          </Box>
        </Drawer>

        {/* MAIN WORKSPACE CONTENT */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: `calc(100% - ${DRAWER_WIDTH}px)`,
            mt: '64px',
            p: 1
          }}
        >
          {activeTab === 'studio' && (
            <CreativeStudio
              clientData={clientData}
              activeTrend={selectedTrendForSprint}
              onClearActiveTrend={() => setSelectedTrendForSprint(null)}
              initialBrief={briefForStudio}
              onClearInitialBrief={() => setBriefForStudio(null)}
              onOpenSettings={() => setActiveTab('settings')}
            />
          )}
          {activeTab === 'settings' && <ImageAgentSettings clientData={clientData} />}
          {activeTab === 'director' && (
            <ContentDirector
              clientData={clientData}
              initialTrend={selectedTrendForSprint}
              onClearInitialTrend={() => setSelectedTrendForSprint(null)}
              onPushToStudio={(brief) => {
                setBriefForStudio(brief);
                setActiveTab('studio');
              }}
            />
          )}
          {activeTab === 'knowledge' && <KnowledgeStudio clientData={clientData} />}
          {activeTab === 'governance' && <GovernanceHub clientData={clientData} />}
          {activeTab === 'trends' && (
            <Trendscraper
              clientData={clientData}
              onLaunchTrend={handleLaunchTrendCampaign}
              onWeaveToDirector={(trend) => {
                setSelectedTrendForSprint(trend);
                setActiveTab('director');
              }}
            />
          )}
          {activeTab === 'kyc' && <BrandKYC clientData={clientData} onRefresh={fetchClientData} />}
          {activeTab === 'concierge' && <AskBourbon clientData={clientData} />}
          {activeTab === 'bbn_explorer' && <BbnFileExplorer clientData={clientData} />}
        </Box>

        {/* CLIENT REGISTRATION MODAL */}
        <ClientRegistrationModal
          open={clientRegisterOpen}
          onClose={() => setClientRegisterOpen(false)}
          onClientCreated={(newBrand) => {
            fetchClientData(newBrand);
          }}
        />

      </Box>
    </ThemeProvider>
  );
}
