#!/bin/bash
# Batch import path fixer

# Navigate to project root
cd "$(dirname "$0")"

# Fix imports in all JS/JSX files
find src/features src/shared -type f \( -name "*.js" -o -name "*.jsx" \) | while read file; do
  # Skip test files for now
  if [[ "$file" == *"__tests__"* ]] || [[ "$file" == *".test."* ]]; then
    continue
  fi

  # Component imports - update to new locations
  sed -i "s|from ['\"]\.\.\/components\/ConfirmDialog|from '../../shared/components/ui/ConfirmDialog|g" "$file"
  sed -i "s|from ['\"]\.\.\/components\/LoadingSpinner|from '../../shared/components/ui/LoadingSpinner|g" "$file"
  sed -i "s|from ['\"]\.\.\/components\/ErrorBoundary|from '../../shared/components/ui/ErrorBoundary|g" "$file"
  sed -i "s|from ['\"]\.\.\/components\/Tooltip|from '../../shared/components/ui/Tooltip|g" "$file"
  sed -i "s|from ['\"]\.\/components\/ConfirmDialog|from '../shared/components/ui/ConfirmDialog|g" "$file"
  sed -i "s|from ['\"]\.\/components\/LoadingSpinner|from '../shared/components/ui/LoadingSpinner|g" "$file"

  # Utils imports - update to new locations
  sed -i "s|from ['\"]\.\.\/utils\/firebase|from '../../shared/services/firebase|g" "$file"
  sed -i "s|from ['\"]\.\.\/utils\/api['\"]|from '../../shared/services/firestore'|g" "$file"
  sed -i "s|from ['\"]\.\.\/utils\/nutritionixApi|from '../../shared/services/nutritionix|g" "$file"
  sed -i "s|from ['\"]\.\.\/utils\/storage['\"]|from '../../shared/services/storage'|g" "$file"

  # Feature-specific utils
  sed -i "s|from ['\"]\.\.\/utils\/ingredientStorage|from './ingredientStorage|g" "$file"
  sed -i "s|from ['\"]\.\.\/utils\/favoritesStorage|from './favorites|g" "$file"
  sed -i "s|from ['\"]\.\.\/utils\/nutritionHelpers|from './nutritionHelpers|g" "$file"
  sed -i "s|from ['\"]\.\.\/utils\/mealTemplates|from './mealTemplates|g" "$file"
  sed -i "s|from ['\"]\.\.\/utils\/recentIngredientsStorage|from './recentIngredients|g" "$file"
  sed -i "s|from ['\"]\.\.\/utils\/onboardingStorage|from '../../shared/services/onboarding|g" "$file"

  # Context imports
  sed -i "s|from ['\"]\.\.\/context\/UserContext|from '../auth/UserContext|g" "$file"
  sed -i "s|from ['\"]\.\.\/context\/ThemeContext|from '../../shared/context/ThemeContext|g" "$file"
  sed -i "s|from ['\"]\.\/context\/UserContext|from '../features/auth/UserContext|g" "$file"

  # Hooks
  sed -i "s|from ['\"]\.\.\/hooks\/useUndoRedo|from './useUndoRedo|g" "$file"
  sed -i "s|from ['\"]\.\.\/hooks\/useKeyboardShortcuts|from '../../shared/hooks/useKeyboardShortcuts|g" "$file"

  echo "Updated: $file"
done

echo "Import paths fixed!"
