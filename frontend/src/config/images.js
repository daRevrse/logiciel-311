/**
 * Banque d'images de la DA Muno.
 *
 * Photos hébergées sur Unsplash (hotlink). Centralisées ici pour être
 * remplaçables en un seul endroit (ex. par des photos locales du Togo plus tard).
 * Toujours utilisées AVEC un fallback (dégradé navy / onError) côté composant,
 * pour qu'une URL indisponible ne casse jamais la mise en page.
 */

const u = (id, w = 1600, q = 70) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const IMAGES = {
  // Héros / grandes entêtes (paysages urbains, vie civique)
  heroCity: u('1449824913935-59a10b8d2000'),       // vue aérienne de ville
  heroStreet: u('1502920917128-1aa500764cbd'),      // rue animée
  heroCommunity: u('1517048676732-d65bc937f952'),   // collaboration / équipe
  heroCivic: u('1486406146926-c627a92ad1ab'),       // bâtiment institutionnel
  cityMap: u('1524661135-423995f22d0b'),            // carte / plan urbain

  // Empty states
  emptyReports: u('1454165804606-c3d57bc86b40', 1000),   // bureau / prise de notes
  emptyNotifications: u('1528747045269-390fe33c19f2', 1000),

  // Carte municipalité par défaut (header de vignette)
  municipalityDefault: u('1477959858617-67f85cf4f1df', 1000),
};

/**
 * Image d'illustration par nom de catégorie (header de carte / vignette).
 * Clé = nom FR de la catégorie ; fallback = `default`.
 */
export const CATEGORY_IMAGES = {
  'Eau': u('1538300342682-cf57afb97285', 600),
  'Électricité': u('1473341304170-971dccb5ac1e', 600),
  'Déchets': u('1532996122724-e3c354a0b15b', 600),
  'Sécurité': u('1517524008697-84bbe3c3fd98', 600),
  'Espaces verts': u('1441974231531-c6227db76b6e', 600),
  'Infrastructure': u('1503387762-592deb58ef4e', 600),
  'Circulation': u('1502920917128-1aa500764cbd', 600),
  default: u('1477959858617-67f85cf4f1df', 600),
};

export const categoryImage = (name) => CATEGORY_IMAGES[name] || CATEGORY_IMAGES.default;

export default IMAGES;
