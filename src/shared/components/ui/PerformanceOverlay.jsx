// Performance overlay for development mode
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getTabSwitchStats } from '../../utils/performance';

/**
 * PerformanceOverlay - Dev mode overlay showing performance metrics
 *
 * Displays:
 * - Recent tab switch samples
 * - Statistical summary (p50, p75, p95, avg)
 * - Color-coded indicators for performance thresholds
 *
 * Only shown when performance tracking is enabled (?perf or localStorage ptm_perf=1)
 */
export const PerformanceOverlay = ({ samples = [] }) => {
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [stats, setStats] = useState({ p50: 0, p75: 0, p95: 0, avg: 0, count: 0 });

  useEffect(() => {
    // Update stats when samples change
    const newStats = getTabSwitchStats();
    setStats(newStats);
  }, [samples]);

  if (!visible) return null;

  const latestSamples = samples.slice(0, 5);
  const avg = latestSamples.length > 0
    ? latestSamples.reduce((sum, s) => sum + s.duration, 0) / latestSamples.length
    : 0;

  // Color coding based on performance thresholds
  const getColor = (duration) => {
    if (duration < 200) return 'success.main';
    if (duration < 350) return 'warning.main';
    return 'error.main';
  };

  return (
    <Paper
      elevation={10}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 280,
        bgcolor: 'rgba(10, 10, 18, 0.95)',
        color: '#e8e6f0',
        border: '1px solid rgba(255, 45, 120, 0.3)',
        borderRadius: 2,
        zIndex: 9999,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          borderBottom: expanded ? '1px solid rgba(255, 45, 120, 0.2)' : 'none',
        }}
      >
        <Typography variant="caption" fontWeight={700} sx={{ color: '#ff2d78' }}>
          ⚡ PERFORMANCE
        </Typography>
        <Box>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ color: '#e8e6f0', mr: 0.5 }}
          >
            <ExpandMoreIcon
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setVisible(false)}
            sx={{ color: '#e8e6f0' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 1.5 }}>
          {/* Summary Stats */}
          {stats.count > 0 && (
            <Box sx={{ mb: 1.5, pb: 1.5, borderBottom: '1px solid rgba(255, 45, 120, 0.2)' }}>
              <Typography variant="caption" display="block" sx={{ color: '#a8a6b0', mb: 0.5 }}>
                Tab Switch Stats ({stats.count} samples)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: getColor(avg) }}>
                  Avg: {avg.toFixed(0)}ms
                </Typography>
                <Typography variant="caption" sx={{ color: getColor(stats.p50) }}>
                  p50: {stats.p50.toFixed(0)}ms
                </Typography>
                <Typography variant="caption" sx={{ color: getColor(stats.p75) }}>
                  p75: {stats.p75.toFixed(0)}ms
                </Typography>
                <Typography variant="caption" sx={{ color: getColor(stats.p95) }}>
                  p95: {stats.p95.toFixed(0)}ms
                </Typography>
              </Box>
            </Box>
          )}

          {/* Recent Samples */}
          <Typography variant="caption" display="block" sx={{ color: '#a8a6b0', mb: 0.5 }}>
            Recent Samples
          </Typography>

          {latestSamples.length === 0 ? (
            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
              No samples yet. Switch tabs to collect data.
            </Typography>
          ) : (
            latestSamples.map((sample, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.5,
                  borderBottom: i < latestSamples.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                }}
              >
                <Typography variant="caption" sx={{ color: '#e8e6f0' }}>
                  {sample.from} → {sample.to}
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: getColor(sample.duration) }}
                >
                  {sample.duration}ms
                </Typography>
              </Box>
            ))
          )}

          {/* Thresholds Guide */}
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255, 45, 120, 0.2)' }}>
            <Typography variant="caption" display="block" sx={{ color: '#a8a6b0', mb: 0.5 }}>
              Thresholds
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'success.main' }}>
                ✓ &lt;200ms
              </Typography>
              <Typography variant="caption" sx={{ color: 'warning.main' }}>
                ⚠ &lt;350ms
              </Typography>
              <Typography variant="caption" sx={{ color: 'error.main' }}>
                ✗ &gt;350ms
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default PerformanceOverlay;
