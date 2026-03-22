import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Paper,
  Box,
  IconButton,
  Tooltip,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import LinkIcon from '@mui/icons-material/LinkRounded';
import { generateShareLink, copyShareLinkToClipboard, getPlanShareDescription } from './utils/planSharing';
import toast from 'react-hot-toast';

/**
 * SharePlanDialog
 * Dialog for generating and sharing meal plans via URL
 */
const SharePlanDialog = ({ open, onClose, plan }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Generate share link (will be recreated each time dialog opens to ensure freshness)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = open && plan ? generateShareLink(baseUrl, plan) : '';

  const handleCopyLink = async () => {
    try {
      setError(null);
      const success = await copyShareLinkToClipboard(shareLink);
      if (success) {
        setCopied(true);
        toast.success('Share link copied!');
        setTimeout(() => setCopied(false), 2000);
      } else {
        setError('Failed to copy to clipboard');
      }
    } catch (err) {
      console.error('Copy failed:', err);
      setError('Failed to copy link');
    }
  };

  const planDescription = plan ? getPlanShareDescription(plan) : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon />
          Share Meal Plan
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {/* Plan description */}
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Sharing:
            </Typography>
            <Typography variant="body2">{planDescription}</Typography>
          </Paper>

          {/* Error message */}
          {error && <Alert severity="error">{error}</Alert>}

          {/* Share link section */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Share Link
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Anyone with this link can import your meal plan:
            </Typography>

            {/* Link display */}
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                wordBreak: 'break-all',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  value={shareLink}
                  readOnly
                  fullWidth
                  size="small"
                  variant="standard"
                  slotProps={{
                    input: {
                      readOnly: true,
                      sx: { fontSize: 'caption.fontSize' },
                    },
                  }}
                />
                <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                  <IconButton
                    size="small"
                    onClick={handleCopyLink}
                    color={copied ? 'success' : 'default'}
                    sx={{
                      minHeight: 44,
                      minWidth: 44,
                    }}
                  >
                    {copied ? (
                      <CheckCircleIcon fontSize="small" />
                    ) : (
                      <ContentCopyIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          </Box>

          {/* How it works */}
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'info.lighter', borderColor: 'info.light' }}>
            <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
              💡 How to use:
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              • Share the link with anyone<br />
              • They paste it in their import dialog<br />
              • The meal plan loads instantly<br />
              • No file download needed
            </Typography>
          </Paper>

          {/* Security note */}
          <Alert severity="warning" sx={{ fontSize: 'caption.fontSize' }}>
            <Typography variant="caption">
              <strong>Note:</strong> Share links encode your plan in the URL. Anyone with the link can see the meal contents.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyLink}
          color={copied ? 'success' : 'primary'}
          sx={{ minHeight: { xs: 44, sm: 'auto' } }}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SharePlanDialog;
