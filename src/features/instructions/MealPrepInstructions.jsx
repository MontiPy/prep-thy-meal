// src/components/MealPrepInstructions.jsx
import React from "react";
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const Section = ({ title, children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack spacing={1.25}>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{
          fontFamily: '"Orbitron", sans-serif',
          fontSize: '0.85rem',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Typography>
      <Divider sx={{
        borderColor: isDark ? 'rgba(255,45,120,0.15)' : 'rgba(214,36,94,0.1)',
      }} />
      <Stack component="ul" spacing={0.75} sx={{ pl: 2, m: 0 }}>
        {children}
      </Stack>
    </Stack>
  );
};

const MealPrepInstructions = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      variant="outlined"
      sx={{
        mt: 3,
        borderRadius: 3,
        backgroundColor: isDark
          ? "rgba(57,255,127,0.04)"
          : "rgba(46,204,113,0.04)",
        borderColor: isDark
          ? "rgba(57,255,127,0.15)"
          : "success.light",
      }}
    >
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h5" fontWeight={800}>
            How to Prep Like a Pro (and Have Fun Doing It!)
          </Typography>

          <Section title="Chicken Breast">
            <Typography component="li" variant="body2">
              Pat the chicken dry and pound it to even thickness (bonus: stress relief!).
            </Typography>
            <Typography component="li" variant="body2">
              Rub with half your olive oil, then season with salt, pepper, garlic powder, and herbs.
            </Typography>
            <Typography component="li" variant="body2">
              Grill over medium-high (about 400F / 205C) for roughly 6-7 min per side, lid closed. Flip once.
            </Typography>
            <Typography component="li" variant="body2">
              Go by temp, not just time: check the thickest part with a thermometer.
            </Typography>
            <Typography component="li" variant="body2">
              Safe target is 165F (74C). Pro tip: you can pull at ~160F and let carryover finish it while resting.
            </Typography>
            <Typography component="li" variant="body2">
              Let it rest 2-3 min so it stays juicy. Slice and celebrate your grill skills!
            </Typography>
          </Section>

          <Section title="Salmon">
            <Typography component="li" variant="body2">
              Pat salmon dry, brush with the rest of your olive oil.
            </Typography>
            <Typography component="li" variant="body2">
              Season with salt, pepper, and a sprinkle of lemon zest or dill if you're feeling fancy.
            </Typography>
            <Typography component="li" variant="body2">
              Grill skin-side down (or on foil/grill mat) over medium-high for 3-4 min per side.
            </Typography>
            <Typography component="li" variant="body2">
              Doneness options: USDA-safe is 145F (63C) and flakes easily; for medium/juicier, pull around 125-130F then rest a minute.
            </Typography>
            <Typography component="li" variant="body2">
              Squeeze fresh lemon over the top and bask in your omega-3 glow!
            </Typography>
          </Section>

          <Section title="Broccoli">
            <Typography component="li" variant="body2">
              Toss florets with olive oil, salt, and pepper. Optional: chili flakes or lemon juice for kick.
            </Typography>
            <Typography component="li" variant="body2">
              Grill in a basket or on foil over medium-high for 7-10 min, turning a couple times.
            </Typography>
            <Typography component="li" variant="body2">
              You want char and tender-crisp vibes. If it browns too fast before softening, drop heat to medium.
            </Typography>
            <Typography component="li" variant="body2">
              Snack a piece right off the grill—chef's privilege!
            </Typography>
          </Section>

          <Section title="Rice">
            <Typography component="li" variant="body2">
              Rinse rice in cold water until it runs clear (seriously, don't skip this).
            </Typography>
            <Typography component="li" variant="body2">
              Water ratio depends on rice type + rinsing: for most white/jasmine rice, start around 1.25-1.5 : 1 water to rice.
            </Typography>
            <Typography component="li" variant="body2">
              If your rice bag gives a different ratio, follow the bag first and adjust next batch if needed.
            </Typography>
            <Typography component="li" variant="body2">
              Bring to boil, cover, simmer 15-18 min. Don't peek. Let rest 5 min, then fluff with a fork.
            </Typography>
            <Typography component="li" variant="body2">
              Rice doesn't need to be grilled to be awesome.
            </Typography>
          </Section>

          <Section title="Meal Prep for the Win">
            <Typography component="li" variant="body2">
              Weigh everything raw and portion for the day or week (best for accurate macros).
            </Typography>
            <Typography component="li" variant="body2">
              Grill, cook, and portion meals into containers—lunch and dinner, sorted!
            </Typography>
            <Typography component="li" variant="body2">
              Let hot food cool a bit before sealing containers to avoid soggy steam-traps.
            </Typography>
            <Typography component="li" variant="body2">
              Repeat daily. High fives and muscle gains are optional (but recommended).
            </Typography>
          </Section>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MealPrepInstructions;
