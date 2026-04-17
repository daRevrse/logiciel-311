/**
 * Catalogue canonique des modules de la plateforme Muno.
 * Les toggles `features` d'une licence sont validés contre ce catalogue.
 */

const MODULES = [
  {
    key: 'reports',
    name: 'Signalements',
    description: 'Module principal de signalements citoyens.',
    category: 'core',
    defaultEnabled: true,
    implemented: true
  },
  {
    key: 'support',
    name: 'Soutiens / Votes',
    description: 'Permet aux citoyens de soutenir / voter des signalements.',
    category: 'core',
    defaultEnabled: true,
    implemented: true
  },
  {
    key: 'notifications',
    name: 'Notifications',
    description: 'Envoi de notifications aux citoyens et admins.',
    category: 'core',
    defaultEnabled: true,
    implemented: true
  },
  {
    key: 'statistics',
    name: 'Statistiques',
    description: 'Tableaux de bord analytiques avancés.',
    category: 'optional',
    defaultEnabled: false,
    implemented: true
  },
  {
    key: 'export',
    name: 'Export CSV',
    description: 'Export des signalements et données.',
    category: 'optional',
    defaultEnabled: false,
    implemented: true
  },
  {
    key: 'map',
    name: 'Carte géolocalisée',
    description: 'Vue cartographique des signalements.',
    category: 'optional',
    defaultEnabled: false,
    implemented: true
  },
  {
    key: 'state_civil',
    name: 'État civil',
    description: 'Gestion des actes d\'état civil (bientôt disponible).',
    category: 'optional',
    defaultEnabled: false,
    implemented: false
  }
];

const MODULE_KEYS = MODULES.map((m) => m.key);

function getModule(key) {
  return MODULES.find((m) => m.key === key) || null;
}

/**
 * Construit les features par défaut d'une nouvelle licence.
 */
function buildDefaultFeatures() {
  return MODULES.reduce((acc, m) => {
    acc[m.key] = m.defaultEnabled;
    return acc;
  }, {});
}

/**
 * Nettoie un objet `features` reçu de l'UI :
 * - ignore les clés inconnues
 * - force à `false` tout module non implémenté
 * - coerce en boolean
 */
function sanitizeFeatures(input = {}) {
  const out = buildDefaultFeatures();
  for (const mod of MODULES) {
    if (Object.prototype.hasOwnProperty.call(input, mod.key)) {
      out[mod.key] = mod.implemented ? Boolean(input[mod.key]) : false;
    }
  }
  return out;
}

module.exports = {
  MODULES,
  MODULE_KEYS,
  getModule,
  buildDefaultFeatures,
  sanitizeFeatures
};
