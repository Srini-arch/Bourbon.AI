import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton, Checkbox,
  Chip, Stack, Grid, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Tooltip, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  FormControl, InputLabel, Select, MenuItem, InputAdornment, Card, CardContent
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RefreshIcon from '@mui/icons-material/Refresh';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import LayersIcon from '@mui/icons-material/Layers';
import BoltIcon from '@mui/icons-material/Bolt';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000' : '';

export default function BbnFileExplorer({ clientData }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name_asc, name_desc, campaign, size_desc
  const [selectedPaths, setSelectedPaths] = useState([]);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Deletion Modal State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pathsToDelete, setPathsToDelete] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Toast / Alert notification
  const [toast, setToast] = useState(null);

  const showToast = (message, severity = 'success') => {
    setToast({ message, severity });
  };

  // Fetch all .bbn file manifests from backend
  const fetchBbnFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/bbn/files`);
      const data = await res.json();
      if (data.status === 'ok') {
        const fileList = data.files || data.packages || [];
        setFiles(fileList);
        setSelectedPaths([]);
      } else {
        showToast(data.detail || 'Failed to load .bbn files', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch .bbn files:', err);
      showToast('Error connecting to backend for .bbn files', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBbnFiles();
  }, []);

  // Distinct clients in file list for filtering
  const availableClients = useMemo(() => {
    const set = new Set();
    files.forEach(f => {
      if (f.client_name) set.add(f.client_name);
    });
    return Array.from(set);
  }, [files]);

  // Filtered & Sorted files list
  const filteredFiles = useMemo(() => {
    return files
      .filter(item => {
        // Client filter
        if (clientFilter !== 'ALL' && item.client_name?.toLowerCase() !== clientFilter.toLowerCase()) {
          return false;
        }
        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (item.file_name && item.file_name.toLowerCase().includes(q)) ||
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.campaign_title && item.campaign_title.toLowerCase().includes(q)) ||
          (item.client_name && item.client_name.toLowerCase().includes(q)) ||
          (item.headline && item.headline.toLowerCase().includes(q)) ||
          (item.accent && item.accent.toLowerCase().includes(q)) ||
          (item.engine && item.engine.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return (b.updated_at || '').localeCompare(a.updated_at || '');
        }
        if (sortBy === 'oldest') {
          return (a.updated_at || '').localeCompare(b.updated_at || '');
        }
        if (sortBy === 'name_asc') {
          return (a.file_name || '').localeCompare(b.file_name || '');
        }
        if (sortBy === 'name_desc') {
          return (b.file_name || '').localeCompare(a.file_name || '');
        }
        if (sortBy === 'campaign') {
          return (a.campaign_title || '').localeCompare(b.campaign_title || '');
        }
        if (sortBy === 'size_desc') {
          return (b.file_size_bytes || 0) - (a.file_size_bytes || 0);
        }
        return 0;
      });
  }, [files, searchQuery, clientFilter, sortBy]);

  // Selection handlers
  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPaths(filteredFiles.map(f => f.file_path));
    } else {
      setSelectedPaths([]);
    }
  };

  const handleToggleSelectOne = (filePath) => {
    setSelectedPaths(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(p => p !== filePath);
      } else {
        return [...prev, filePath];
      }
    });
  };

  // Trigger single item deletion
  const handleRequestDeleteSingle = (filePath) => {
    setPathsToDelete([filePath]);
    setDeleteDialogOpen(true);
  };

  // Trigger batch deletion for selected items
  const handleRequestDeleteSelected = () => {
    if (selectedPaths.length === 0) return;
    setPathsToDelete([...selectedPaths]);
    setDeleteDialogOpen(true);
  };

  // Execute deletion
  const handleConfirmDelete = async () => {
    if (pathsToDelete.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/bbn/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_paths: pathsToDelete })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        showToast(`🗑️ Successfully deleted ${data.deleted_count} .bbn manifest(s) permanently.`);
        setDeleteDialogOpen(false);
        setPathsToDelete([]);
        setSelectedPaths(prev => prev.filter(p => !data.deleted_files.includes(p)));
        fetchBbnFiles();
      } else {
        showToast(data.detail || 'Failed to delete manifests', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error sending delete request', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Total disk consumption of filtered files
  const totalFilteredBytes = useMemo(() => {
    return filteredFiles.reduce((acc, curr) => acc + (curr.file_size_bytes || 0), 0);
  }, [filteredFiles]);

  const totalFilteredKb = (totalFilteredBytes / 1024.0).toFixed(1);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {toast && (
        <Alert severity={toast.severity} sx={{ mb: 2 }} onClose={() => setToast(null)}>
          {toast.message}
        </Alert>
      )}

      {/* HEADER SECTION */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#F0F3F6', letterSpacing: '-0.02em' }}>
              📁 .BBN Manifest File Explorer
            </Typography>
            <Chip
              label={`${filteredFiles.length} Manifests (${totalFilteredKb} KB)`}
              size="small"
              sx={{
                background: 'rgba(245, 166, 35, 0.15)',
                color: '#F5A623',
                fontWeight: 700,
                border: '1px solid rgba(245, 166, 35, 0.4)'
              }}
            />
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
              label="Bourbon AI Validated"
              size="small"
              sx={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.4)'
              }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>
            Structured metadata catalog for canonical .bbn campaign files • Strict Schema v2.5 validation • Search, sort, select, and batch delete without exposing raw code.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={fetchBbnFiles}
            disabled={loading}
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#94A3B8' }}
          >
            Refresh
          </Button>

          {/* BATCH DELETE BUTTON */}
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={handleRequestDeleteSelected}
            disabled={selectedPaths.length === 0}
            sx={{
              fontWeight: 800,
              px: 2.2,
              background: selectedPaths.length > 0 ? '#EF4444' : 'rgba(239, 68, 68, 0.3)',
              color: '#FFFFFF',
              boxShadow: selectedPaths.length > 0 ? '0 4px 16px rgba(239, 68, 68, 0.4)' : 'none',
              '&:hover': { background: '#DC2626' }
            }}
          >
            Delete Selected ({selectedPaths.length})
          </Button>
        </Stack>
      </Box>

      {/* FILTER, SEARCH & SORT TOOLBAR */}
      <Paper
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2.5,
          background: 'rgba(18, 21, 28, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Real-time search bar */}
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by filename, campaign, headline, client, or engine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#F5A623', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  background: 'rgba(11, 13, 17, 0.8)',
                  color: '#F0F3F6'
                }
              }}
            />
          </Grid>

          {/* Client Filter */}
          <Grid item xs={6} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Client / Brand Filter</InputLabel>
              <Select
                value={clientFilter}
                label="Client / Brand Filter"
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Clients ({files.length} manifests)</MenuItem>
                {availableClients.map(c => (
                  <MenuItem key={c} value={c}>
                    {c} ({files.filter(f => f.client_name === c).length})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sort By Dropdown */}
          <Grid item xs={6} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort Manifests By</InputLabel>
              <Select
                value={sortBy}
                label="Sort Manifests By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="newest">📅 Newest Modified First</MenuItem>
                <MenuItem value="oldest">📅 Oldest Modified First</MenuItem>
                <MenuItem value="name_asc">🔤 File Name (A → Z)</MenuItem>
                <MenuItem value="name_desc">🔤 File Name (Z → A)</MenuItem>
                <MenuItem value="campaign">📁 Campaign Title</MenuItem>
                <MenuItem value="size_desc">💾 Size (Largest First)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Selection Status Bar */}
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Checkbox
              size="small"
              checked={filteredFiles.length > 0 && selectedPaths.length === filteredFiles.length}
              indeterminate={selectedPaths.length > 0 && selectedPaths.length < filteredFiles.length}
              onChange={handleToggleSelectAll}
              sx={{ color: '#F5A623', '&.Mui-checked': { color: '#F5A623' } }}
            />
            <Typography variant="body2" sx={{ fontWeight: 700, color: selectedPaths.length > 0 ? '#F5A623' : '#94A3B8' }}>
              {selectedPaths.length > 0 ? `${selectedPaths.length} of ${filteredFiles.length} manifests selected` : `Select all (${filteredFiles.length} items)`}
            </Typography>
          </Stack>

          {selectedPaths.length > 0 && (
            <Button
              size="small"
              color="error"
              onClick={() => setSelectedPaths([])}
              sx={{ textTransform: 'none', color: '#EF4444', fontSize: '0.78rem' }}
            >
              Clear Selection
            </Button>
          )}
        </Box>
      </Paper>

      {/* MANIFEST RECORDS TABLE */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2.5,
          background: 'rgba(15, 18, 24, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <Table size="medium">
          <TableHead sx={{ background: 'rgba(20, 24, 33, 0.95)' }}>
            <TableRow>
              <TableCell padding="checkbox" sx={{ pl: 2 }}>
                <Checkbox
                  size="small"
                  checked={filteredFiles.length > 0 && selectedPaths.length === filteredFiles.length}
                  indeterminate={selectedPaths.length > 0 && selectedPaths.length < filteredFiles.length}
                  onChange={handleToggleSelectAll}
                  sx={{ color: '#F5A623', '&.Mui-checked': { color: '#F5A623' } }}
                />
              </TableCell>
              <TableCell sx={{ color: '#F5A623', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Manifest & Stage
              </TableCell>
              <TableCell sx={{ color: '#F5A623', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Campaign
              </TableCell>
              <TableCell sx={{ color: '#F5A623', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Client / Brand
              </TableCell>
              <TableCell sx={{ color: '#F5A623', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Main Headline Preview
              </TableCell>
              <TableCell sx={{ color: '#F5A623', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Engine
              </TableCell>
              <TableCell sx={{ color: '#F5A623', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Size
              </TableCell>
              <TableCell sx={{ color: '#F5A623', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Modified Date
              </TableCell>
              <TableCell align="right" sx={{ pr: 2, color: '#F5A623', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Delete
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={36} sx={{ color: '#F5A623', mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                    Scanning and cataloging .bbn manifests...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <FolderIcon sx={{ fontSize: 48, color: '#475569', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                    No .BBN Manifest Files Found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    {searchQuery ? `No files match the query "${searchQuery}"` : 'Generate a new campaign sprint to create canonical .bbn manifests.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((file) => {
                  const isSelected = selectedPaths.includes(file.file_path);
                  return (
                    <TableRow
                      key={file.file_path}
                      hover
                      selected={isSelected}
                      sx={{
                        backgroundColor: isSelected ? 'rgba(245, 166, 35, 0.08) !important' : 'inherit',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ pl: 2 }}>
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(file.file_path)}
                          sx={{ color: '#64748B', '&.Mui-checked': { color: '#F5A623' } }}
                        />
                      </TableCell>

                      {/* Manifest filename & Stage Title */}
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1.5,
                              background: 'rgba(245, 166, 35, 0.15)',
                              border: '1px solid rgba(245, 166, 35, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <DescriptionIcon sx={{ fontSize: 18, color: '#F5A623' }} />
                          </Box>
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#F0F3F6', fontFamily: 'monospace' }}>
                                {file.filename || file.file_name}
                              </Typography>
                              {file.is_validated && (
                                <Tooltip title="Bourbon AI Schema v2.5 Verified">
                                  <Chip
                                    icon={<CheckCircleIcon sx={{ fontSize: '13px !important', color: '#10B981 !important' }} />}
                                    label="Verified"
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                      color: '#10B981',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                      '& .MuiChip-label': { px: 0.6 }
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Stack>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              {file.title}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Campaign */}
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
                          {file.campaign_title || file.campaign_id}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Folder: {file.campaign_id}
                        </Typography>
                      </TableCell>

                      {/* Client */}
                      <TableCell>
                        <Chip
                          label={file.client_name || 'Unbox-ED'}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(24, 119, 242, 0.15)',
                            color: '#4B9BFF',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            border: '1px solid rgba(24, 119, 242, 0.3)'
                          }}
                        />
                      </TableCell>

                      {/* Headline Preview */}
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" noWrap sx={{ color: '#F0F3F6', fontWeight: 500 }}>
                          {file.headline || '(No headline set)'}
                        </Typography>
                        {file.accent && (
                          <Typography variant="caption" sx={{ color: '#F5A623', fontWeight: 700 }}>
                            {file.accent}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Engine */}
                      <TableCell>
                        <Chip
                          icon={<BoltIcon sx={{ fontSize: 13 }} />}
                          label={file.engine ? file.engine.toUpperCase() : 'FLUX'}
                          size="small"
                          sx={{
                            background: file.engine === 'gemini' ? 'rgba(75, 155, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: file.engine === 'gemini' ? '#4B9BFF' : '#10B981',
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            border: `1px solid ${file.engine === 'gemini' ? 'rgba(75, 155, 255, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                          }}
                        />
                      </TableCell>

                      {/* File Size */}
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                          {file.file_size_formatted || `${(file.file_size_bytes / 1024).toFixed(1)} KB`}
                        </Typography>
                      </TableCell>

                      {/* Modified Date */}
                      <TableCell>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          {file.updated_at}
                        </Typography>
                      </TableCell>

                      {/* Action: Single Delete */}
                      <TableCell align="right" sx={{ pr: 2 }}>
                        <Tooltip title={`Permanently delete ${file.file_name}`}>
                          <IconButton
                            size="small"
                            onClick={() => handleRequestDeleteSingle(file.file_path)}
                            sx={{
                              color: '#64748B',
                              '&:hover': { color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>

        {/* PAGINATION */}
        <TablePagination
          rowsPerPageOptions={[10, 15, 25, 50]}
          component="div"
          count={filteredFiles.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            color: '#94A3B8',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}
        />
      </TableContainer>

      {/* CONFIRMATION DELETION MODAL */}
      <Dialog
        open={deleteDialogOpen}
        onClose={deleting ? undefined : () => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#141822',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ color: '#EF4444', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon /> Confirm Manifest Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#E2E8F0', mb: 2 }}>
            Are you sure you want to permanently delete <strong>{pathsToDelete.length}</strong> .bbn manifest file(s)?
          </DialogContentText>
          <Box
            sx={{
              maxHeight: 140,
              overflowY: 'auto',
              p: 1.5,
              borderRadius: 1.5,
              background: '#0B0D11',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {pathsToDelete.map(p => (
              <Typography key={p} variant="caption" sx={{ display: 'block', color: '#94A3B8', fontFamily: 'monospace' }}>
                • {p.split('/').pop()}
              </Typography>
            ))}
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#EF4444', fontWeight: 600 }}>
            ⚠️ This will remove the files from disk. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ color: '#94A3B8' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            sx={{ fontWeight: 800, background: '#EF4444', '&:hover': { background: '#DC2626' } }}
          >
            {deleting ? 'Deleting...' : `Delete ${pathsToDelete.length} File(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
