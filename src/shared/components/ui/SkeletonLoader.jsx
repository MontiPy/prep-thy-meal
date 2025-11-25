// src/shared/components/ui/SkeletonLoader.jsx
import React from 'react';
import { Box, Paper, Skeleton, Stack } from '@mui/material';

/**
 * Skeleton for ingredient card
 */
export const IngredientCardSkeleton = () => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
      <Skeleton variant="text" width={120} height={24} />
      <Skeleton variant="circular" width={24} height={24} />
    </Stack>
    <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
      <Skeleton variant="rounded" width={44} height={44} />
      <Box sx={{ flex: 1, textAlign: 'center' }}>
        <Skeleton variant="text" width="60%" height={32} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width="40%" height={16} sx={{ mx: 'auto' }} />
      </Box>
      <Skeleton variant="rounded" width={44} height={44} />
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={48} />
      ))}
    </Box>
  </Paper>
);

/**
 * Skeleton for table row
 */
export const TableRowSkeleton = ({ columns = 5 }) => (
  <Box
    component="tr"
    sx={{ borderBottom: 1, borderColor: 'divider' }}
  >
    {[...Array(columns)].map((_, i) => (
      <Box component="td" key={i} sx={{ px: 2, py: 1.5 }}>
        <Skeleton variant="text" />
      </Box>
    ))}
  </Box>
);

/**
 * Skeleton for stat card
 */
export const StatCardSkeleton = () => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Skeleton variant="text" width={80} height={20} sx={{ mb: 1 }} />
    <Skeleton variant="text" width={60} height={32} sx={{ mb: 0.5 }} />
    <Skeleton variant="text" width={120} height={16} />
  </Paper>
);

/**
 * Skeleton for meal section
 */
export const MealSectionSkeleton = () => (
  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
      <Skeleton variant="text" width={120} height={28} />
      <Skeleton variant="rounded" width={100} height={36} />
    </Stack>
    <Stack spacing={2}>
      {[...Array(3)].map((_, i) => (
        <IngredientCardSkeleton key={i} />
      ))}
    </Stack>
  </Paper>
);

/**
 * Skeleton for plan card
 */
export const PlanCardSkeleton = () => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
      <Skeleton variant="text" width={140} height={24} />
      <Skeleton variant="rounded" width={32} height={32} />
    </Stack>
    <Stack spacing={1} mb={2}>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="75%" />
    </Stack>
    <Stack direction="row" spacing={1}>
      <Skeleton variant="rounded" height={36} sx={{ flex: 1 }} />
      <Skeleton variant="rounded" width={36} height={36} />
    </Stack>
  </Paper>
);

/**
 * Skeleton for search result
 */
export const SearchResultSkeleton = () => (
  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Skeleton variant="rounded" width={48} height={48} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width={180} height={20} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={120} height={16} />
      </Box>
      <Skeleton variant="rounded" width={80} height={36} />
    </Stack>
  </Paper>
);

/**
 * Full page skeleton for initial load
 */
export const PageSkeleton = () => (
  <Stack spacing={3}>
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Skeleton variant="text" width={240} height={40} sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width={360} height={24} sx={{ mx: 'auto' }} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {[...Array(3)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </Box>
      <Stack spacing={3}>
        {[...Array(2)].map((_, i) => (
          <MealSectionSkeleton key={i} />
        ))}
      </Stack>
    </Paper>
  </Stack>
);

export default Skeleton;
