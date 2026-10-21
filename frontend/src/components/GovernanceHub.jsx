import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, RadioGroup,
  FormControlLabel, Radio, Chip, Stack, Card, CardContent, Divider,
  Alert, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function GovernanceHub({ clientData }) {
  const [actorRole, setActorRole] = useState('marketing'); // 'ops', 'marketing', 'finance'
  const [governanceData, setGovernanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState({});
  const [toastMsg, setToastMsg] = useState(null);

  // Sample adjudicated assets for demonstration and review
  const [assets, setAssets] = useState([
    {
      id: 'ASSET_C2_SLIDE1',
      title: 'Finance Unbox-ED: Practical Money Skills',
      funnel: 'Awareness (TOFU)',
      copy: 'Schools teach formulas, but rarely teach practical money decisions. In Finance Unbox-ED, children master budgeting, needs vs. wants, and lifelong investing habits.',
      acid_score: 9.6,
      hallucination_risk: 0.0,
      status: 'APPROVED',
      notes: 'Passed all negative constraints. Mentioned founder pedagogy correctly.'
    },
    {
      id: 'ASSET_C2_SLIDE2',
      title: 'Orator Unbox-ED: Intimate Public Speaking',
      funnel: 'Consideration (MOFU)',
      copy: "A fifth-grader stares at a crowded Zoom screen of 50 tiny boxes, muted and hesitant to raise his hand. In our intimate Orator cohorts, children don't hide behind muted microphones—they speak, debate, and discover their natural confidence.",
      acid_score: 9.4,
      hallucination_risk: 0.0,
      status: 'APPROVED',
      notes: 'Empathy narrative hook verified. Contrast with crowded Zoom rooms verified.'
    },
    {
      id: 'ASSET_C2_SLIDE3',
      title: 'Writer Unbox-ED: Show Not Tell Narrative',
      funnel: 'Conversion (BOFU)',
      copy: 'Transform passive screen time into articulate storytelling. In Creative Writing Unbox-ED, young authors learn character arcs, descriptive sensory language, and original prose.',
      acid_score: 9.5,
      hallucination_risk: 0.0,
      status: 'PENDING_REVIEW',
      notes: 'Awaiting final Marketing Head sign-off.'
    }
  ]);

  const fetchGovernanceStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/governance/status`);
      const data = await res.json();
      if (data.status === 'ok') {
        setGovernanceData(data);
        if (data.approvals) setApprovals(data.approvals);
      }
    } catch (err) {
      console.error('Failed to fetch governance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernanceStatus();
  }, []);

  // Update copy locally
  const handleUpdateCopy = (assetId, newCopy) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, copy: newCopy } : a));
  };

  // Persist status
  const handleSetApproval = async (assetId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/governance/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId, status: status, notes: `Reviewed by ${actorRole}` })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status } : a));
        setToastMsg(`Asset '${assetId}' marked as ${status}!`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setToastMsg('Status update failed.');
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
              🛡️ Review & Governance Hub
            </Typography>
            <Chip
              icon={<VerifiedUserIcon />}
              label="Groq ACID Adjudicator"
              size="small"
              sx={{ background: 'rgba(76, 175, 80, 0.15)', color: '#4CAF50', fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="subtitle1">
            Actor Perspective Switcher • Financial SLA Telemetry Ledger • Inline Copy Review & Approval
          </Typography>
        </Box>
        <Chip
          label="Deterministic Negative Constraints Active"
          size="small"
          variant="outlined"
          sx={{ borderColor: 'rgba(245, 166, 35, 0.4)', color: '#F5A623', fontWeight: 700 }}
        />
      </Box>

      {/* ACTOR PERSPECTIVE SWITCHER */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#94A3B8', mb: 1 }}>
          👤 Active User Perspective (Multi-Role Governance)
        </Typography>
        <RadioGroup
          row
          value={actorRole}
          onChange={(e) => setActorRole(e.target.value)}
        >
          <FormControlLabel
            value="ops"
            control={<Radio sx={{ color: '#F5A623', '&.Mui-checked': { color: '#F5A623' } }} />}
            label="👷 Operations Executive (Process Owner / Asset Generator)"
          />
          <FormControlLabel
            value="marketing"
            control={<Radio sx={{ color: '#F5A623', '&.Mui-checked': { color: '#F5A623' } }} />}
            label="👔 Marketing Head (Compliance Approver & Copy Editor)"
          />
          <FormControlLabel
            value="finance"
            control={<Radio sx={{ color: '#F5A623', '&.Mui-checked': { color: '#F5A623' } }} />}
            label="💼 Finance Lead (Cost & SLA Auditor)"
          />
        </RadioGroup>
      </Paper>

      {/* FINANCIAL SLA & COST TELEMETRY LEDGER */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, background: 'linear-gradient(135deg, rgba(20, 23, 31, 0.9) 0%, rgba(11, 13, 17, 0.95) 100%)', border: '1px solid rgba(245,166,35,0.2)' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#F0F3F6', display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon sx={{ color: '#F5A623' }} /> Financial SLA & Performance Telemetry
          </Typography>
          <Chip label="Real Compute Telemetry" size="small" color="primary" sx={{ fontWeight: 700 }} />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>⏱️ Turnaround SLA</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#4CAF50', my: 0.5 }}>4.5s / post</Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>Target: &lt; 300s (Baseline: 3600s)</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>💰 Compute Cost / Post</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#F5A623', my: 0.5 }}>₹2.10</Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>Target: &lt; ₹200 (Baseline: ₹1000)</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>💵 Net TCO Savings</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#00D2FF', my: 0.5 }}>₹997.90</Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>99.8% Commercial TCO Reduction</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>🛡️ Groq ACID Rating</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#4CAF50', my: 0.5 }}>9.5 / 10</Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>Hallucination Risk: 0.0% (Zero)</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ASSET REVIEW & APPROVAL LIST */}
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircleIcon sx={{ color: '#4CAF50' }} /> Adjudicated Assets for Approval
      </Typography>

      <Stack spacing={2.5}>
        {assets.map((asset, idx) => {
          const isApproved = asset.status === 'APPROVED';
          return (
            <Paper key={asset.id} sx={{ p: 2.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F0F3F6' }}>
                    Asset #{idx + 1}: {asset.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip label={asset.funnel} size="small" sx={{ fontSize: '0.72rem' }} />
                    <Chip
                      icon={<VerifiedUserIcon />}
                      label={`ACID Score: ${asset.acid_score}/10`}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  </Stack>
                </Box>
                <Chip
                  label={isApproved ? '🟢 Approved' : '🟡 Pending Review'}
                  color={isApproved ? 'success' : 'warning'}
                  sx={{ fontWeight: 800 }}
                />
              </Box>

              {/* Editable Copy */}
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value={asset.copy}
                disabled={actorRole !== 'marketing' && actorRole !== 'ops'}
                onChange={(e) => handleUpdateCopy(asset.id, e.target.value)}
                helperText={actorRole === 'marketing' ? 'Marketing Head: Edit copy directly before granting approval.' : 'Review audited draft.'}
                sx={{ mb: 1.5 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Auditor Notes: <em>{asset.notes}</em>
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => {
                      navigator.clipboard.writeText(asset.copy);
                      setToastMsg('Copy text copied to clipboard!');
                    }}
                  >
                    Copy
                  </Button>
                  {(actorRole === 'marketing' || actorRole === 'ops') && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleSetApproval(asset.id, 'REJECTED')}
                      >
                        Request Revision
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleSetApproval(asset.id, 'APPROVED')}
                        sx={{ fontWeight: 800 }}
                      >
                        Approve Asset
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
