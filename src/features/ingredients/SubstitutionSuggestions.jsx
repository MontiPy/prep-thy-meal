import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHorizRounded';
import TrendingDownIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import {
  findSubstitutes,
  createSubstituteComparison,
  getSubstitutionReason,
  getRecommendedSubstitute,
} from './substitutions';

/**
 * SubstitutionSuggestions
 * Dialog showing ingredient substitution recommendations
 */
const SubstitutionSuggestions = ({ open, onClose, ingredient, allIngredients, onSwap }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const substitutes = useMemo(() => {
    if (!ingredient || !allIngredients) return [];
    return findSubstitutes(ingredient, allIngredients, 70, 5);
  }, [ingredient, allIngredients]);

  const recommended = useMemo(() => {
    return getRecommendedSubstitute(substitutes, 'balanced');
  }, [substitutes]);

  if (!ingredient) return null;

  const roundVal = (n) => Math.round(n * 10) / 10;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwapHorizIcon />
        Substitute for {ingredient.name}
      </DialogTitle>

      <DialogContent dividers>
        {substitutes.length > 0 ? (
          <Stack spacing={2}>
            {/* Original ingredient summary */}
            <Paper sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Current:
              </Typography>
              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {ingredient.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {roundVal(ingredient.calories)} kcal per 100g
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    P: {roundVal(ingredient.protein)}g
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    C: {roundVal(ingredient.carbs)}g
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    F: {roundVal(ingredient.fat)}g
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Recommendations table */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Similar Ingredients:
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: 'caption.fontSize' }} width="30%">
                        Ingredient
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: 'caption.fontSize' }} width="15%">
                        Match
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }} width="12%">
                        Cals
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }} width="12%">
                        P (g)
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }} width="12%">
                        C (g)
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }} width="12%">
                        F (g)
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: 'caption.fontSize' }} width="7%">
                        -
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {substitutes.map((sub) => {
                      const comparison = createSubstituteComparison(ingredient, sub);
                      const reason = getSubstitutionReason(comparison);
                      const isRecommended = sub.id === recommended?.id;

                      return (
                        <TableRow
                          key={sub.id}
                          sx={{
                            bgcolor: isRecommended ? 'action.selected' : 'transparent',
                            border: isRecommended ? '1px solid' : 'none',
                            borderColor: 'primary.main',
                          }}
                        >
                          <TableCell sx={{ fontSize: 'caption.fontSize' }}>
                            <Stack spacing={0.25}>
                              <Typography variant="caption" fontWeight={600}>
                                {sub.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                {reason}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 'caption.fontSize' }}>
                            <Chip
                              label={`${sub.similarity}%`}
                              color={sub.similarity > 85 ? 'success' : 'default'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }}>
                            {roundVal(sub.calories)}
                            {comparison.differences.calories !== 0 && (
                              <Typography
                                variant="caption"
                                component="div"
                                sx={{
                                  color: comparison.differences.calories > 0 ? 'error.main' : 'success.main',
                                  fontSize: '0.65rem',
                                }}
                              >
                                {comparison.differences.calories > 0 ? '+' : ''}
                                {roundVal(comparison.differences.calories)}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }}>
                            {roundVal(sub.protein)}g
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }}>
                            {roundVal(sub.carbs)}g
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 'caption.fontSize' }}>
                            {roundVal(sub.fat)}g
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 'caption.fontSize' }}>
                            <Button
                              size="small"
                              onClick={() => onSwap?.(sub)}
                              sx={{ minHeight: 32, minWidth: 32 }}
                            >
                              Use
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Box>

            {/* Recommendation note */}
            {recommended && (
              <Paper sx={{ p: 1.5, bgcolor: 'success.lighter', borderColor: 'success.light', border: '1px solid' }}>
                <Typography variant="caption" fontWeight={700} display="block">
                  ⭐ Recommended: {recommended.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Most similar macro profile ({recommended.similarity}% match)
                </Typography>
              </Paper>
            )}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No similar ingredients found in your ingredient list. Try adding more ingredients to see suggestions.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {recommended && (
          <Button
            variant="contained"
            startIcon={<SwapHorizIcon />}
            onClick={() => {
              onSwap?.(recommended);
              onClose();
            }}
          >
            Swap with Recommended
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SubstitutionSuggestions;
