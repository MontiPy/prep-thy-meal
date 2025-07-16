// src/components/MealPrepInstructions.jsx
import React from "react";

const MealPrepInstructions = () => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">
      How to Prep Like a Pro (and Have Fun Doing It!)
    </h2>

    {/* Chicken Breast */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-green-700">
        🍗 Chicken Breast
      </h3>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
        <li>
          Pat the chicken dry and pound it to even thickness (bonus: stress
          relief!).
        </li>
        <li>
          Rub with half your olive oil, then season with salt, pepper, garlic
          powder, and herbs.
        </li>
        <li>
          Grill over medium-high (400°F / 205°C) for 6–7 min per side, lid
          closed. Flip once.
        </li>
        <li>
          Check with a thermometer: aim for 165°F (74°C) and clear juices.
        </li>
        <li>
          Let it rest 2–3 min so it stays juicy. Slice and celebrate your grill
          skills!
        </li>
      </ul>
    </div>

    {/* Salmon */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-green-700">🐟 Salmon</h3>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
        <li>Pat salmon dry, brush with the rest of your olive oil.</li>
        <li>
          Season with salt, pepper, and a sprinkle of lemon zest or dill if
          you're feeling fancy.
        </li>
        <li>
          Grill skin-side down (or on foil/grill mat) over medium-high for 3–4
          min per side.
        </li>
        <li>Fish is done when it flakes easily and hits 145°F (63°C).</li>
        <li>Squeeze fresh lemon over the top and bask in your omega-3 glow!</li>
      </ul>
    </div>

    {/* Broccoli */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-green-700">🥦 Broccoli</h3>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
        <li>
          Toss florets with olive oil, salt, and pepper. Optional: chili flakes
          or lemon juice for kick.
        </li>
        <li>
          Grill in a basket or on foil over medium-high for 7–10 min, turning a
          couple times.
        </li>
        <li>
          You want char and tender-crisp vibes. Snack a piece right off the
          grill—chef’s privilege!
        </li>
      </ul>
    </div>

    {/* Rice */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-green-700">🍚 Rice</h3>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
        <li>
          Rinse rice in cold water until it runs clear (seriously, don’t skip
          this).
        </li>
        <li>
          Cook with 2:1 water to rice (150g dry = ~0.8 cup, so use 1.6 cups
          water for a day).
        </li>
        <li>
          Bring to boil, cover, simmer 15–18 min. Don’t peek. Let rest 5 min,
          then fluff with a fork.
        </li>
        <li>Rice doesn’t need to be grilled to be awesome.</li>
      </ul>
    </div>

    {/* Meal Prep Summary */}
    <div>
      <h3 className="text-lg font-semibold text-green-700">
        🥗 Meal Prep for the Win
      </h3>
      <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
        <li>Weigh everything raw and portion for the day or week.</li>
        <li>
          Grill, cook, and portion meals into containers—lunch and dinner,
          sorted!
        </li>
        <li>
          Repeat daily. High fives and muscle gains are optional (but
          recommended).
        </li>
      </ul>
    </div>
  </div>
);

export default MealPrepInstructions;
