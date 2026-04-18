import { useEffect } from 'react';

/**
 * useMunicipalityTheme
 *
 * Injects municipality brand colors as CSS custom properties onto
 * `document.documentElement` for the lifetime of the component.
 *
 * Note sur les noms de variables :
 * Le design-system actuel (voir `frontend/src/index.css` et la config Tailwind)
 * n'expose pas de variables CSS `--primary` / `--secondary` globales ;
 * les tokens sont définis directement dans `tailwind.config`.
 * Pour rester compatible avec d'éventuels tokens futurs qui liraient
 * `--color-primary` (convention Tailwind v4 / design-tokens) ou `--primary`
 * (convention shadcn/ui), on injecte les deux alias sur :root.
 * Les composants qui veulent s'en servir peuvent écrire par exemple :
 *   style={{ backgroundColor: 'var(--primary)' }}
 *
 * Safe no-op si primary / secondary sont null / undefined.
 *
 * @param {{ primary?: string|null, secondary?: string|null }} colors
 */
export default function useMunicipalityTheme({ primary, secondary } = {}) {
  useEffect(() => {
    if (!primary && !secondary) return undefined;

    const root = document.documentElement;
    const previous = {
      '--primary': root.style.getPropertyValue('--primary'),
      '--color-primary': root.style.getPropertyValue('--color-primary'),
      '--secondary': root.style.getPropertyValue('--secondary'),
      '--color-secondary': root.style.getPropertyValue('--color-secondary'),
    };

    if (primary) {
      root.style.setProperty('--primary', primary);
      root.style.setProperty('--color-primary', primary);
    }
    if (secondary) {
      root.style.setProperty('--secondary', secondary);
      root.style.setProperty('--color-secondary', secondary);
    }

    return () => {
      Object.entries(previous).forEach(([key, value]) => {
        if (value) {
          root.style.setProperty(key, value);
        } else {
          root.style.removeProperty(key);
        }
      });
    };
  }, [primary, secondary]);
}
