/**
 * Tests for reportStatusService.deriveReportStatus
 *
 * NOTE (TDD stub): Le projet n'a pas encore de test runner configuré dans
 * backend/package.json (pas de jest/mocha installé, pas de script `test`).
 * Ces cas sont écrits comme stubs avec l'API `describe/it` de Jest pour être
 * activés dès qu'un runner sera installé. En attendant, ils servent de
 * spécification exécutable/documentaire.
 *
 * Pour activer :
 *   npm i -D jest
 *   ajouter "test": "jest" à package.json
 *   configurer une base de test (ou mock sequelize) — puis supprimer
 *   le bloc `if (typeof describe ...)` ci-dessous.
 *
 * Cas couverts (spec A4) :
 *   1. 1 intervention `pending`           -> report.status = 'assigned'
 *   2. 1 intervention `in_progress`       -> report.status = 'in_progress'
 *   3. 2 interventions toutes `completed` -> report.status = 'resolved'
 *   4. 1 intervention `cancelled` seule   -> report.status inchangé
 */

/* eslint-disable no-undef */

// Si jest n'est pas présent, ne pas exécuter la suite (évite les crashs
// quand ce fichier est simplement parcouru par un linter ou require).
const RUNNER_PRESENT =
  typeof describe === 'function' && typeof it === 'function';

const { deriveReportStatus } = RUNNER_PRESENT
  ? require('../../services/reportStatusService')
  : {};
const db = RUNNER_PRESENT ? require('../../models') : {};

const _describe = RUNNER_PRESENT ? describe : () => {};

async function createReport() {
  // Minimal fixtures — suppose qu'une municipality/category/user existent
  // (à adapter avec des factories dès qu'une infra de test est en place).
  const municipality = await db.Municipality.create({
    name: 'TestCity',
    license_id: 1,
    slug: `test-${Date.now()}`
  });
  const category = await db.Category.create({
    municipality_id: municipality.id,
    name: 'Test',
    slug: 'test'
  });
  const user = await db.User.create({
    municipality_id: municipality.id,
    email: `u${Date.now()}@t.t`,
    full_name: 'T',
    role: 'citizen',
    password_hash: 'x'
  });
  return db.Report.create({
    municipality_id: municipality.id,
    citizen_id: user.id,
    category_id: category.id,
    title: 'Test report title',
    description: 'Description de test suffisante',
    address: 'adresse'
  });
}

_describe('reportStatusService.deriveReportStatus', () => {
  afterAll(async () => {
    await db.sequelize.close();
  });

  it('1 pending intervention -> report becomes assigned', async () => {
    const report = await createReport();
    await db.Intervention.create({ report_id: report.id, status: 'pending' });
    const newStatus = await deriveReportStatus(report.id);
    expect(newStatus).toBe('assigned');
    await report.reload();
    expect(report.status).toBe('assigned');
  });

  it('1 in_progress intervention -> report becomes in_progress', async () => {
    const report = await createReport();
    await db.Intervention.create({
      report_id: report.id,
      status: 'in_progress'
    });
    await deriveReportStatus(report.id);
    await report.reload();
    expect(report.status).toBe('in_progress');
  });

  it('2 completed interventions -> report becomes resolved', async () => {
    const report = await createReport();
    await db.Intervention.create({ report_id: report.id, status: 'completed' });
    await db.Intervention.create({ report_id: report.id, status: 'completed' });
    await deriveReportStatus(report.id);
    await report.reload();
    expect(report.status).toBe('resolved');
  });

  it('only cancelled interventions -> report status unchanged', async () => {
    const report = await createReport();
    const originalStatus = report.status;
    await db.Intervention.create({ report_id: report.id, status: 'cancelled' });
    const result = await deriveReportStatus(report.id);
    expect(result).toBeNull();
    await report.reload();
    expect(report.status).toBe(originalStatus);
  });
});
