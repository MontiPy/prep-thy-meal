import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import ShareIcon from '@mui/icons-material/ShareRounded';
import toast from 'react-hot-toast';
import {
  generateShareableUrl,
  copyToClipboard,
  shareUrl,
} from '../../shared/utils/planSharing';

/**
 * ShareableLinkDialog
 * Dialog for generating and sharing meal plan links
 */
const ShareableLinkDialog = ({ open, onClose, plan }) => {
  const [shareLink, setShareLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const url = generateShareableUrl(plan);
      if (url) {
        setShareLink(url);
        toast.success('Shareable link generated!');
      } else {
        toast.error('Failed to generate link');
      }
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Error generating link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    const success = await copyToClipboard(shareLink);
    if (success) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (!shareLink) return;
    const success = await shareUrl(shareLink, `Check out my meal plan: ${plan.name}`);
    if (!success) {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const handleClose = () => {
    setShareLink(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
        📤 Share Meal Plan
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Plan preview */}
          {plan && (
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {plan.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Object.keys(plan.mealIngredients || {}).length} meals • {plan.targetCalories?.toLocaleString()} kcal
              </Typography>
            </Box>
          )}

          {/* Instructions */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Generate a shareable link so others can view and import your meal plan:
            </Typography>
          </Box>

          {/* Link display */}
          {shareLink ? (
            <Box sx={{ p: 1.5, bgcolor: 'info.main', bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2, border: '1px solid', borderColor: 'info.main' }}>
              <Stack spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  value={shareLink}
                  readOnly
                  multiline
                  maxRows={3}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    },
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                          <IconButton
                            size="small"
                            onClick={handleCopyLink}
                            sx={{ mr: -1 }}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ),
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Share this link with anyone to let them view and import your plan.
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Alert severity="info">
              Click "Generate Link" to create a shareable URL for this meal plan.
            </Alert>
          )}

          {/* URL length info */}
          {shareLink && (
            <Box sx={{ p: 1, bgcolor: 'success.main', bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Link size: {shareLink.length} characters
                </Typography>
                {shareLink.length > 2000 && (
                  <Chip
                    label="Long URL (might not work in some apps)"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {shareLink ? (
          <>
            <Button
              onClick={handleShare}
              startIcon={<ShareIcon />}
              variant="contained"
              color="primary"
            >
              Share
            </Button>
            <Button
              onClick={handleCopyLink}
              startIcon={<ContentCopyIcon />}
              variant="outlined"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleGenerateLink}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            variant="contained"
            color="primary"
          >
            {loading ? 'Generating...' : 'Generate Link'}
          </Button>
        )}
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareableLinkDialog;
