import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Button,
  Stack,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import {
  Restaurant as MealIcon,
  Kitchen as IngredientIcon,
  Calculate as CalcIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { completeOnboarding } from '../../services/onboarding';

const OnboardingModal = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Prep Thy Meal!',
      icon: <MealIcon sx={{ fontSize: 64, color: 'primary.main' }} />,
      content: (
        <Stack spacing={2} alignItems="center">
          <Typography variant="h5" fontWeight={700} textAlign="center">
            Plan your meals, hit your macros, generate shopping lists
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Let's take a quick tour of the features to get you started.
          </Typography>
        </Stack>
      ),
    },
    {
      title: 'Meal Planner',
      icon: <MealIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      content: (
        <Stack spacing={2}>
          <Typography variant="body1">
            Set your daily calorie target and macro percentages, then add ingredients to your meals.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Key Features:
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2">• Undo/Redo your changes</Typography>
              <Typography variant="body2">• Use meal templates for quick planning</Typography>
              <Typography variant="body2">• Save multiple meal plans</Typography>
              <Typography variant="body2">• Generate shopping lists</Typography>
            </Stack>
          </Paper>
        </Stack>
      ),
    },
    {
      title: 'Ingredients',
      icon: <IngredientIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      content: (
        <Stack spacing={2}>
          <Typography variant="body1">
            Search the USDA food database with 800,000+ items or create custom ingredients.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Key Features:
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2">• Search real food nutrition data</Typography>
              <Typography variant="body2">• Create custom ingredients</Typography>
              <Typography variant="body2">• Import/Export your ingredient library</Typography>
            </Stack>
          </Paper>
        </Stack>
      ),
    },
    {
      title: 'Calorie Calculator',
      icon: <CalcIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      content: (
        <Stack spacing={2}>
          <Typography variant="body1">
            Calculate your daily calorie needs based on your profile, goals, and activity level.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.light' }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Pro Tip:
            </Typography>
            <Typography variant="body2">
              After calculating, you can automatically transfer your targets to the Meal Planner!
            </Typography>
          </Paper>
        </Stack>
      ),
    },
    {
      title: "You're All Set!",
      icon: <CheckIcon sx={{ fontSize: 64, color: 'success.main' }} />,
      content: (
        <Stack spacing={2}>
          <Typography variant="body1" textAlign="center">
            Here are some quick tips to get the most out of Prep Thy Meal:
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              ✨ <strong>Recent Ingredients:</strong> Your recently used ingredients appear at the top for quick access
            </Typography>
            <Typography variant="body2">
              🌙 <strong>Dark Mode:</strong> Toggle in the header for comfortable viewing
            </Typography>
            <Typography variant="body2">
              📋 <strong>Shopping Lists:</strong> Export as PDF or share to your phone
            </Typography>
            <Typography variant="body2">
              ☁️ <strong>Multi-Device Sync:</strong> Your plans sync automatically with Firebase
            </Typography>
          </Stack>
        </Stack>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  return (
    <Dialog
      open={isOpen}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Stack spacing={3} alignItems="center">
          {/* Progress Dots */}
          <Stack direction="row" spacing={1}>
            {steps.map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: index === currentStep ? 'primary.main' : 'grey.300',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </Stack>

          {/* Icon */}
          <Box>{steps[currentStep].icon}</Box>

          {/* Title */}
          <Typography variant="h5" fontWeight={700} textAlign="center">
            {steps[currentStep].title}
          </Typography>

          {/* Content */}
          <Box sx={{ width: '100%' }}>
            {steps[currentStep].content}
          </Box>

          {/* Navigation Buttons */}
          <Stack direction="row" spacing={2} sx={{ width: '100%', pt: 2 }}>
            {currentStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{ flex: 1 }}
              >
                Back
              </Button>
            )}
            <Button
              variant="text"
              onClick={handleComplete}
              sx={{ color: 'text.secondary' }}
            >
              Skip
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{ flex: 1 }}
            >
              {currentStep === steps.length - 1 ? 'Start Planning' : 'Next'}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
