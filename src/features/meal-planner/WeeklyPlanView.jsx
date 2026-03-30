import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import {
  calculateWeeklyTotals,
  calculateWeeklyAverages,
  calculateVarietyScore,
  getDayAbbreviation,
  checkWeeklyCompletion,
} from './utils/weeklyPlanHelpers';

/**
 * WeeklyPlanView
 * 7-day calendar view showing daily macro summaries
 * Allows quick overview and navigation to individual days
 */
const WeeklyPlanView = ({ weeklyMealData, calorieTarget, targetPercentages, onSelectDay }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Calculate metrics
  const weeklyTotals = useMemo(() => calculateWeeklyTotals(weeklyMealData), [weeklyMealData]);
  const weeklyAverages = useMemo(() => calculateWeeklyAverages(weeklyTotals), [weeklyTotals]);
  const varietyScore = useMemo(() => calculateVarietyScore(weeklyMealData), [weeklyMealData]);
  const completion = useMemo(() => checkWeeklyCompletion(weeklyMealData), [weeklyMealData]);

  const days = Object.keys(weeklyMealData);

  const roundVal = (n) => Math.round(n * 10) / 10;

  return (
    <Stack spacing={3}>
      {/* Weekly Summary Header */}
      <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              📅 Weekly Overview
            </Typography>
            <Chip
              label={`${completion.percentComplete}% Complete`}
              color={completion.percentComplete === 100 ? 'success' : 'warning'}
              size="small"
            />
          </Box>

          <Grid container spacing={2}>
            {/* Weekly Averages */}
            <Grid item xs={12} sm={6}>
              <Stack spacing={0.5}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Daily Average
                </Typography>
                <Typography variant="body2">
                  <strong>{roundVal(weeklyAverages.calories)}</strong> kcal ·{' '}
                  <strong>{roundVal(weeklyAverages.protein)}</strong>g P ·{' '}
                  <strong>{roundVal(weeklyAverages.carbs)}</strong>g C ·{' '}
                  <strong>{roundVal(weeklyAverages.fat)}</strong>g F
                </Typography>
              </Stack>
            </Grid>

            {/* Variety & Target Score */}
            <Grid item xs={12} sm={6}>
              <Stack spacing={0.5}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Meal Variety Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={varietyScore}
                    sx={{ flex: 1, height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="body2" fontWeight={700} sx={{ minWidth: 50 }}>
                    {varietyScore}%
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {/* 7-Day Grid */}
      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        {days.map((day) => {
          const dayTotals = weeklyTotals[day] || {};
          const dayMeals = weeklyMealData[day];
          const isComplete =
            dayMeals.breakfast.length > 0 &&
            dayMeals.lunch.length > 0 &&
            dayMeals.dinner.length > 0;

          const caloriePercentage = (dayTotals.calories / calorieTarget) * 100;
          const calorieColor =
            caloriePercentage < 90
              ? 'warning'
              : caloriePercentage <= 110
              ? 'success'
              : 'error';

          return (
            <Grid item xs={12} sm={6} md={isTablet ? 6 : 'auto'} key={day} sx={{ flex: { md: 1 } }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: isComplete ? '2px solid' : '1px solid',
                  borderColor: isComplete ? 'success.main' : 'divider',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => onSelectDay?.(day)}
              >
                {/* Day Header */}
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {getDayAbbreviation(day)}
                    </Typography>
                    {isComplete && <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />}
                  </Box>

                  {/* Calorie Progress */}
                  <Stack spacing={0.75}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" fontWeight={600}>
                        {roundVal(dayTotals.calories)} kcal
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {roundVal(caloriePercentage)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(caloriePercentage, 100)}
                      color={calorieColor}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                  </Stack>

                  {/* Macros */}
                  <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      P: {roundVal(dayTotals.protein)}g
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      C: {roundVal(dayTotals.carbs)}g
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      F: {roundVal(dayTotals.fat)}g
                    </Typography>
                  </Stack>

                  {/* Meal Count */}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                    {dayMeals.breakfast.length > 0 && (
                      <Chip label="B" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                    {dayMeals.lunch.length > 0 && (
                      <Chip label="L" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                    {dayMeals.dinner.length > 0 && (
                      <Chip label="D" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                    {dayMeals.snack.length > 0 && (
                      <Chip label="S" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                </CardContent>

                {/* Action Button */}
                <CardActions sx={{ mt: 'auto', pt: 1 }}>
                  <Button
                    size="small"
                    fullWidth
                    endIcon={<ArrowForwardIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay?.(day);
                    }}
                    sx={{ minHeight: { xs: 44, sm: 'auto' } }}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Insights */}
      {completion.completeDays > 0 && (
        <Paper sx={{ p: 2, bgcolor: 'info.lighter', borderColor: 'info.light', border: '1px solid' }}>
          <Typography variant="caption" fontWeight={600} display="block" mb={1}>
            💡 Weekly Insights:
          </Typography>
          <Stack spacing={0.5} component="ul" sx={{ pl: 2, mb: 0 }}>
            <Typography variant="caption" component="li">
              Average daily intake: {roundVal(weeklyAverages.calories)} kcal
            </Typography>
            <Typography variant="caption" component="li">
              Meal variety: {varietyScore}% (higher is better)
            </Typography>
            {completion.completeDays === completion.totalDays && (
              <Typography variant="caption" component="li" sx={{ color: 'success.main', fontWeight: 600 }}>
                ✓ All days planned!
              </Typography>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default WeeklyPlanView;
