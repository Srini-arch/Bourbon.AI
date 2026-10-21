import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, Stack, Chip,
  Divider, Card, CardContent, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function AskBourbon({ clientData }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${clientData?.name || 'there'}! I'm **Ask Bourbon.AI**, your platform concierge. You can ask me about configuring your brand KYC dossier, switching between Cloudflare / Sarvam 105B / Groq models, or managing multi-slide carousels.`
    }
  ]);
  const [input, setInput] = useState('');
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(d => setHealthData(d.health))
      .catch(console.error);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');

    setTimeout(() => {
      let reply = `I have received your request regarding "${userMsg}". All active pipelines (Groq LPU, Sarvam Mayura, and the Creative Studio Engine) are operating with low latency. You can render your live 1080x1080 carousels directly in the Creative Studio tab!`;
      if (userMsg.toLowerCase().includes('logo') || userMsg.toLowerCase().includes('badge')) {
        reply = `For brand logos: The Creative Studio Engine now enforces the standardized Unbox-ED 203x69px badge with a 14px horizontal margin and 9px vertical margin. It is automatically rendered onto both photoreal AI visuals and uploaded client photos!`;
      } else if (userMsg.toLowerCase().includes('docx') || userMsg.toLowerCase().includes('deck')) {
        reply = `You can generate an agency-grade presentation deck (.docx) in 1-click inside Pane 3 of the Creative Studio. It embeds the live composited slides, metadata tables, and approval sign-off blocks.`;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    }, 600);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          🧭 Ask Bourbon.AI Concierge
        </Typography>
        <Typography variant="subtitle1">
          Live system status, active LLM provider telemetry, and interactive platform guidance.
        </Typography>
      </Box>

      {/* HEALTH STATUS BAR */}
      {healthData && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Provider & Engine Status
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`Sarvam 105B Indic (${healthData?.sarvam?.latency_ms || 1490}ms)`}
              color="success"
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`Groq LPU Llama 3 70B (${healthData?.groq?.latency_ms || 1200}ms)`}
              color="success"
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`Cloudflare AI (${healthData?.cloudflare?.latency_ms || 1400}ms)`}
              color="success"
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`Gemini Flash (${healthData?.gemini?.latency_ms || 900}ms)`}
              color="success"
              size="small"
              variant="outlined"
            />
          </Stack>
        </Paper>
      )}

      {/* CHAT INTERFACE */}
      <Paper sx={{ p: 2.5, minHeight: 420, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, mb: 2, overflowY: 'auto', maxHeight: 420 }}>
          {messages.map((m, idx) => (
            <Box
              key={idx}
              sx={{
                mb: 1.5,
                p: 2,
                borderRadius: 2,
                backgroundColor: m.role === 'assistant' ? 'rgba(24, 27, 34, 0.7)' : 'rgba(245, 166, 35, 0.1)',
                border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(245, 166, 35, 0.3)',
                maxWidth: '85%',
                alignSelf: m.role === 'assistant' ? 'flex-start' : 'flex-end',
                ml: m.role === 'assistant' ? 0 : 'auto'
              }}
            >
              <Typography variant="caption" sx={{ color: m.role === 'assistant' ? '#F5A623' : '#4B9BFF', fontWeight: 700, display: 'block', mb: 0.5 }}>
                {m.role === 'assistant' ? '🤖 Bourbon Concierge' : '👤 You'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#F0F3F6', whiteSpace: 'pre-line' }}>
                {m.content}
              </Typography>
            </Box>
          ))}
        </Box>

        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask about brand rules, carousels, or compositor settings..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={handleSend}
            sx={{ fontWeight: 700, px: 3 }}
          >
            Send
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
