/**
 * Petit utilitaire pour l'échappement HTML.
 * Utilisé pour interpoler de façon sûre des valeurs contrôlées par l'utilisateur
 * dans des gabarits d'email.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { escapeHtml };
