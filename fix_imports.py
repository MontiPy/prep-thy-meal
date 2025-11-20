#!/usr/bin/env python3
"""Batch fix import paths after restructuring"""
import os
import re
from pathlib import Path

# Define import mappings (old_path -> new_path)
mappings = [
    # Components to shared/components/ui
    (r"from ['\"]\.\.\/components\/(ConfirmDialog|Tooltip|LoadingSpinner|ErrorBoundary|SkeletonLoader)", r"from '../../shared/components/ui/\1"),
    (r"from ['\"]\.\/components\/(ConfirmDialog|Tooltip|LoadingSpinner|ErrorBoundary|SkeletonLoader)", r"from '../shared/components/ui/\1"),

    # Layout components
    (r"from ['\"]\.\.\/components\/(MealPrep|ThemeToggle|OfflineBanner)", r"from '../../shared/components/layout/\1"),
    (r"from ['\"]\.\/components\/(MealPrep|ThemeToggle|OfflineBanner)", r"from '../shared/components/layout/\1"),

    # Onboarding components
    (r"from ['\"]\.\.\/components\/(OnboardingModal|KeyboardShortcutsHelp)", r"from '../../shared/components/onboarding/\1"),
    (r"from ['\"]\.\/components\/(OnboardingModal|KeyboardShortcutsHelp)", r"from '../shared/components/onboarding/\1"),

    # Services
    (r"from ['\"]\.\.\/utils\/firebase", r"from '../../shared/services/firebase"),
    (r"from ['\"]\.\/utils\/firebase", r"from '../shared/services/firebase"),
    (r"from ['\"]\.\.\/utils\/api['\"]", r"from '../../shared/services/firestore'"),
    (r"from ['\"]\.\/utils\/api['\"]", r"from '../shared/services/firestore'"),
    (r"from ['\"]\.\.\/utils\/nutritionixApi", r"from '../../shared/services/nutritionix"),
    (r"from ['\"]\.\/utils\/nutritionixApi", r"from '../shared/services/nutritionix"),
    (r"from ['\"]\.\.\/utils\/storage['\"]", r"from '../../shared/services/storage'"),
    (r"from ['\"]\.\/utils\/storage['\"]", r"from '../shared/services/storage'"),
    (r"from ['\"]\.\.\/utils\/onboardingStorage", r"from '../../shared/services/onboarding"),

    # Feature-specific utils (stay in same folder)
    (r"from ['\"]\.\.\/utils\/(ingredientStorage|favoritesStorage|nutritionHelpers|mealTemplates|recentIngredientsStorage)", r"from './\1"),

    # Rename recentIngredientsStorage to recentIngredients
    (r"from ['\"](\.\.?\/.*/)recentIngredientsStorage", r"from '\1recentIngredients"),
    (r"from ['\"](\.\/)?favoritesStorage", r"from '\1favorites"),

    # Context
    (r"from ['\"]\.\.\/context\/UserContext", r"from '../auth/UserContext"),
    (r"from ['\"]\.\.\/context\/ThemeContext", r"from '../../shared/context/ThemeContext"),
    (r"from ['\"]\.\/context\/UserContext", r"from '../features/auth/UserContext"),
    (r"from ['\"]\.\/context\/ThemeContext", r"from '../shared/context/ThemeContext"),

    # Hooks
    (r"from ['\"]\.\.\/hooks\/useUndoRedo", r"from './useUndoRedo"),
    (r"from ['\"]\.\.\/hooks\/useKeyboardShortcuts", r"from '../../shared/hooks/useKeyboardShortcuts"),
    (r"from ['\"]\.\/hooks\/useKeyboardShortcuts", r"from '../shared/hooks/useKeyboardShortcuts"),
]

def fix_file(filepath):
    """Fix imports in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        for pattern, replacement in mappings:
            content = re.sub(pattern, replacement, content)

        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main function to fix all imports"""
    root = Path(__file__).parent / 'src'
    changed = 0

    # Process all JS/JSX files in features and shared
    for folder in ['features', 'shared']:
        folder_path = root / folder
        if not folder_path.exists():
            continue

        for filepath in folder_path.rglob('*.js'):
            if '__tests__' in str(filepath) or '.test.' in str(filepath):
                continue
            if fix_file(filepath):
                print(f"[OK] Updated: {filepath.relative_to(root)}")
                changed += 1

        for filepath in folder_path.rglob('*.jsx'):
            if '__tests__' in str(filepath) or '.test.' in str(filepath):
                continue
            if fix_file(filepath):
                print(f"[OK] Updated: {filepath.relative_to(root)}")
                changed += 1

    print(f"\n[SUCCESS] Updated {changed} files")

if __name__ == '__main__':
    main()
