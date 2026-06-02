/**
 * Helpers de date robustes : tolèrent created_at / createdAt et les valeurs invalides.
 */

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Date courte type "5 juin". Renvoie '' si invalide. */
export const formatShortDate = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
};

/** Date longue type "5 juin 2026". Renvoie '' si invalide. */
export const formatLongDate = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
};

/** Récupère la date de création quel que soit le nommage renvoyé par l'API. */
export const reportDate = (report) => report?.created_at ?? report?.createdAt ?? null;
