import React from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';

const NutritionFactsLabel = ({ totals }) => {
  // Default to 0 if undefined
  const { calories = 0, protein = 0, carbs = 0, fat = 0 } = totals;

  // Style helpers
  const borderThick = '10px solid black';
  const borderMedium = '5px solid black';
  const borderThin = '1px solid black';

  return (
    <Box
      sx={{
        border: borderThin,
        p: 1,
        width: '100%',
        maxWidth: 320,
        fontFamily: 'Helvetica, Arial, sans-serif',
        bgcolor: 'white',
        color: 'black',
        mx: 'auto',
      }}
    >
      <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1 }}>
        Nutrition Facts
      </Typography>
      <Divider sx={{ borderBottom: borderMedium, my: 0.5 }} />
      
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
        <Typography fontWeight={900} fontSize={14}>Amount per day</Typography>
      </Stack>
      
      <Divider sx={{ borderBottom: borderThick, my: 0.5 }} />
      
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={900}>Calories</Typography>
        <Typography variant="h3" fontWeight={900}>{Math.round(calories)}</Typography>
      </Stack>
      
      <Divider sx={{ borderBottom: borderMedium, my: 0.5 }} />
      
      <Typography align="right" fontSize={12} fontWeight={700} mb={0.5}>% Daily Value*</Typography>
      <Divider />

      <Stack direction="row" justifyContent="space-between" py={0.5}>
        <Typography fontWeight={700}>
          Total Fat <Typography component="span" fontWeight={400}>{Math.round(fat)}g</Typography>
        </Typography>
        <Typography fontWeight={700}>{Math.round((fat / 78) * 100)}%</Typography>
      </Stack>
      <Divider />

      <Stack direction="row" justifyContent="space-between" py={0.5}>
        <Typography fontWeight={700}>
          Total Carbohydrate <Typography component="span" fontWeight={400}>{Math.round(carbs)}g</Typography>
        </Typography>
        <Typography fontWeight={700}>{Math.round((carbs / 275) * 100)}%</Typography>
      </Stack>
      <Divider />

      <Stack direction="row" justifyContent="space-between" py={0.5}>
        <Typography fontWeight={700}>
          Protein <Typography component="span" fontWeight={400}>{Math.round(protein)}g</Typography>
        </Typography>
        <Typography fontWeight={700}>{Math.round((protein / 50) * 100)}%</Typography>
      </Stack>
      
      <Divider sx={{ borderBottom: borderThick, my: 0.5 }} />
      
      <Typography variant="caption" fontSize={10} lineHeight={1.2} display="block">
        *The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
      </Typography>
    </Box>
  );
};

export default NutritionFactsLabel;
