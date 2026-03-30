import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
  Alert,
  Paper,
} from '@mui/material';
import {
  getIFProtocols,
  parseTimeToMinutes,
  minutesToTimeString,
  calculateHoursBetween,
  getSuggestedMealTimes,
  validateMealTimings,
  detectFastingWindow,
} from './utils/mealTimingHelpers';

/**
 * MealTimingEditor
 * Configure intermittent fasting schedules and meal timing windows
 * Supports preset protocols (16:8, 18:6, 20:4, 23:1, 5:2) or custom schedules
 */
const MealTimingEditor = ({
  mealTimes = {},
  onMealTimesChange,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const ifProtocols = getIFProtocols();

  // State
  const [protocol, setProtocol] = useState('16:8');
  const [eatingWindowStart, setEatingWindowStart] = useState('12:00');
  const [customTimings, setCustomTimings] = useState(mealTimes);
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false);

  // Calculate fasting window info
  const fastingInfo = useMemo(() => {
    const mealTimeValues = Object.values(customTimings).filter(t => t && t.trim());
    if (mealTimeValues.length === 0) return null;

    const timeMinutes = mealTimeValues
      .map(t => parseTimeToMinutes(t))
      .filter(m => m !== null);

    if (timeMinutes.length < 2) return null;

    return detectFastingWindow(timeMinutes);
  }, [customTimings]);

  // Get suggested meal times
  const suggestedTimes = useMemo(() => {
    const config = ifProtocols[protocol];
    if (!config || config.eatingWindow === null) return [];
    return getSuggestedMealTimes(protocol, eatingWindowStart);
  }, [protocol, eatingWindowStart, ifProtocols]);

  // Validate timings
  const validation = useMemo(() => {
    return validateMealTimings(customTimings);
  }, [customTimings]);

  const handleMealTimeChange = (mealName, time) => {
    const updated = { ...customTimings, [mealName]: time };
    setCustomTimings(updated);
    onMealTimesChange?.(updated);
  };

  const handleApplySuggestions = () => {
    const updated = { ...customTimings };
    suggestedTimes.forEach((suggestion, idx) => {
      const mealNames = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (idx < mealNames.length) {
        updated[mealNames[idx]] = suggestion.time;
      }
    });
    setCustomTimings(updated);
    onMealTimesChange?.(updated);
    setShowSuggestionsDialog(false);
  };

  const handleProtocolChange = (newProtocol) => {
    setProtocol(newProtocol);
  };

  const handleClear = () => {
    const cleared = { breakfast: '', lunch: '', dinner: '', snack: '' };
    setCustomTimings(cleared);
    onMealTimesChange?.(cleared);
  };

  const protocolConfig = ifProtocols[protocol];
  const mealNames = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <Box>
      {/* IF Protocol Selection */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Intermittent Fasting Protocol
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(ifProtocols).map(([key, config]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Card
                  variant={protocol === key ? 'elevation' : 'outlined'}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    border: protocol === key ? `2px solid ${theme.palette.primary.main}` : undefined,
                    bgcolor:
                      protocol === key
                        ? isDarkMode
                          ? 'primary.dark'
                          : 'primary.light'
                        : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => handleProtocolChange(key)}
                >
                  <Typography fontWeight={700} color="primary.main">
                    {config.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {config.description}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                    {config.exampleSchedule}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Eating Window Configuration */}
      {protocolConfig && protocolConfig.eatingWindow !== null && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Eating Window Start Time
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              When do you want to start your {protocolConfig.eatingWindow}-hour eating window?
            </Typography>
            <TextField
              type="time"
              value={eatingWindowStart}
              onChange={(e) => setEatingWindowStart(e.target.value)}
              fullWidth
              sx={{ maxWidth: 200 }}
              inputProps={{ step: '300' }} // 5-minute increments
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                {`Your eating window: ${eatingWindowStart} - ${minutesToTimeString(
                  parseTimeToMinutes(eatingWindowStart) + protocolConfig.eatingWindow * 60
                )}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`Fasting window: ${protocolConfig.fastingWindow} hours`}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Meal Timing Configuration */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={1}
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              Meal Times
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowSuggestionsDialog(true)}
                sx={{ minHeight: { xs: 44, sm: 'auto' } }}
              >
                Get Suggestions
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleClear}
                sx={{ minHeight: { xs: 44, sm: 'auto' } }}
              >
                Clear
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            {mealNames.map((meal) => (
              <Grid item xs={12} sm={6} key={meal}>
                <TextField
                  label={meal.charAt(0).toUpperCase() + meal.slice(1)}
                  type="time"
                  value={customTimings[meal] || ''}
                  onChange={(e) => handleMealTimeChange(meal, e.target.value)}
                  fullWidth
                  inputProps={{ step: '300' }} // 5-minute increments
                />
              </Grid>
            ))}
          </Grid>

          {validation.errors.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {validation.errors.map((err, idx) => (
                <div key={idx}>{err}</div>
              ))}
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {validation.warnings.map((warn, idx) => (
                <div key={idx}>{warn}</div>
              ))}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Fasting Window Analysis */}
      {fastingInfo && fastingInfo.detected && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Your Detected Fasting Pattern
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'success.light' }}>
                  <Typography variant="caption" color="text.secondary">
                    Eating Window
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="success.dark">
                    {fastingInfo.eatingWindow}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {fastingInfo.firstMealTime} - {fastingInfo.lastMealTime}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'info.light' }}>
                  <Typography variant="caption" color="text.secondary">
                    Fasting Window
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="info.dark">
                    {fastingInfo.fastingWindow}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Daily rest period
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Suggestions Dialog */}
      <Dialog
        open={showSuggestionsDialog}
        onClose={() => setShowSuggestionsDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Suggested Meal Times</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Based on your {protocol} protocol with eating window starting at {eatingWindowStart}:
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell fontWeight={700}>Meal</TableCell>
                  <TableCell fontWeight={700} align="right">
                    Suggested Time
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suggestedTimes.map((suggestion, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{suggestion.meal}</TableCell>
                    <TableCell align="right" fontWeight={600}>
                      {suggestion.time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuggestionsDialog(false)}>Cancel</Button>
          <Button
            onClick={handleApplySuggestions}
            variant="contained"
            sx={{ minHeight: { xs: 44, sm: 'auto' } }}
          >
            Apply Suggestions
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MealTimingEditor;
