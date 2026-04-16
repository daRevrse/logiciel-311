-- Script de création de données de test pour Logiciel 311
-- À exécuter: mysql -u root -p logiciel_311_dev < seed-test-data.sql

USE logiciel_311_dev;

-- 1. Municipalité (SANS license_id au début)
INSERT INTO municipalities (id, name, contact_email, contact_phone, address, created_at, updated_at)
VALUES (1, 'Lomé', 'contact@lome.tg', '+228 90 00 00 00', 'Lomé, Togo', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- 2. License active (maintenant que la municipalité existe)
INSERT INTO licenses (id, municipality_id, license_key, status, start_date, end_date, max_users, max_reports_per_month, features, created_at, updated_at)
VALUES (1, 1, 'LOME-2024-ABCD-1234', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1000, 5000, '{"notifications": true, "analytics": true, "export": true}', NOW(), NOW())
ON DUPLICATE KEY UPDATE status='active';

-- 3. Mettre à jour la municipalité avec la license (maintenant que la license existe)
UPDATE municipalities SET license_id = 1 WHERE id = 1;

-- 3. Catégories
INSERT INTO categories (municipality_id, name, description, icon, color, created_at, updated_at) VALUES
(1, 'Voirie', 'Problèmes de routes, trottoirs, nids de poule', 'road', '#3B82F6', NOW(), NOW()),
(1, 'Éclairage public', 'Lampadaires défectueux, zones mal éclairées', 'lightbulb', '#F59E0B', NOW(), NOW()),
(1, 'Propreté', 'Ordures, déchets, assainissement', 'trash', '#10B981', NOW(), NOW()),
(1, 'Sécurité', 'Signalisation, feux tricolores', 'shield', '#EF4444', NOW(), NOW()),
(1, 'Espaces verts', 'Parcs, jardins, arbres', 'tree', '#22C55E', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- 4. Utilisateur admin
INSERT INTO users (municipality_id, role, full_name, email, password_hash, phone, is_verified, created_at, updated_at)
VALUES (1, 'admin', 'Administrateur Lomé', 'admin@lome.tg', '$2b$10$7yM0Z.X.LzQ.X.LzQ.X.LzO.6iA6eG9Yl1y8qZ6vA6QyP8z9C4q1S', '+22890111111', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE email=email;
-- Note: Le mot de passe hashé ci-dessus est pour "Admin123!"

SELECT '✓ Données de test créées avec succès!' as message;
SELECT 'Municipalité: Lomé' as info;
SELECT 'License: LOME-2024-ABCD-1234' as info;
SELECT '5 catégories créées' as info;
SELECT '' as info;
SELECT 'Pour créer un admin, utilisez l''API:' as next_step;
SELECT 'POST /api/auth/admin/register' as endpoint;
