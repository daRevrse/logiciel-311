/**
 * Service de suggestion d'agents.
 * Calcule un score pour chaque agent éligible : plus bas = meilleur.
 *
 *   score = w1 * active_count
 *         + w2 * priority_load
 *         - w3 * specialization_match
 *         + w4 * distance_score
 *
 * Composantes :
 *  - active_count       : nombre d'interventions actives.
 *  - priority_load      : somme des priorités des interventions actives (normalisée).
 *  - specialization_match : 1 si l'agent a la spécialisation, sinon 0.
 *  - distance_score     : distance en km (Haversine) entre home_location et report ;
 *                         0 si home_location ou coords report manquantes.
 */

const { Op } = require('sequelize');
const { User, Intervention, Report } = require('../models');

const ACTIVE_STATUSES = ['pending', 'scheduled', 'in_progress'];

const DEFAULT_WEIGHTS = {
  workload: 10,
  priority: 0.5,
  specialization: 25,
  distance: 0.5
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function suggestAgentsForReport(reportId, municipalityId, opts = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...(opts.weights || {}) };

  const report = await Report.findByPk(reportId);
  if (!report || report.municipality_id !== municipalityId) {
    const err = new Error('Signalement introuvable dans cette municipalité');
    err.status = 404;
    throw err;
  }

  const categoryId = report.category_id;
  const reportLat = report.latitude !== null ? parseFloat(report.latitude) : null;
  const reportLng = report.longitude !== null ? parseFloat(report.longitude) : null;

  const agents = await User.findAll({
    where: { role: 'agent', municipality_id: municipalityId, is_active: true },
    attributes: [
      'id', 'email', 'full_name', 'phone',
      'specializations', 'home_latitude', 'home_longitude'
    ]
  });

  if (agents.length === 0) return [];

  const ids = agents.map((a) => a.id);

  const activeInterventions = await Intervention.findAll({
    where: {
      agent_id: { [Op.in]: ids },
      status: { [Op.in]: ACTIVE_STATUSES }
    },
    include: [
      { model: Report, as: 'report', attributes: ['priority_score'] }
    ]
  });

  const statsById = new Map();
  for (const i of activeInterventions) {
    const cur = statsById.get(i.agent_id) || { count: 0, priorityLoad: 0 };
    cur.count += 1;
    cur.priorityLoad += (i.report?.priority_score || 0);
    statsById.set(i.agent_id, cur);
  }

  const results = agents.map((agent) => {
    const stats = statsById.get(agent.id) || { count: 0, priorityLoad: 0 };
    const specs = Array.isArray(agent.specializations) ? agent.specializations : [];
    const specialized = specs.includes(categoryId);

    let distanceKm = null;
    if (agent.home_latitude !== null && agent.home_longitude !== null
        && reportLat !== null && reportLng !== null) {
      distanceKm = haversineKm(
        parseFloat(agent.home_latitude),
        parseFloat(agent.home_longitude),
        reportLat,
        reportLng
      );
    }

    const score =
      weights.workload * stats.count
      + weights.priority * stats.priorityLoad
      - weights.specialization * (specialized ? 1 : 0)
      + weights.distance * (distanceKm === null ? 0 : distanceKm);

    return {
      id: agent.id,
      email: agent.email,
      full_name: agent.full_name,
      phone: agent.phone,
      specializations: specs,
      workload: stats.count,
      priority_load: stats.priorityLoad,
      is_specialized: specialized,
      distance_km: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
      score: Math.round(score * 100) / 100,
      score_breakdown: {
        workload: weights.workload * stats.count,
        priority: weights.priority * stats.priorityLoad,
        specialization: -weights.specialization * (specialized ? 1 : 0),
        distance: weights.distance * (distanceKm === null ? 0 : distanceKm)
      }
    };
  });

  results.sort((a, b) => a.score - b.score);
  return results;
}

module.exports = {
  suggestAgentsForReport,
  DEFAULT_WEIGHTS
};
