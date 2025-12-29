-- Script de création de données de test pour Logiciel 311
-- ATTENTION: Ce script VIDE toutes les tables avant d'insérer les données de test
-- À exécuter: mysql -u root -p logiciel_311_dev < seed-clean-and-insert.sql

USE logiciel_311_dev;

-- ============================================
-- ÉTAPE 1: NETTOYAGE COMPLET
-- ============================================

-- Désactiver les contraintes de clés étrangères temporairement
SET FOREIGN_KEY_CHECKS = 0;

-- Vider toutes les tables
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE status_history;
TRUNCATE TABLE supports;
TRUNCATE TABLE report_photos;
TRUNCATE TABLE reports;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
TRUNCATE TABLE licenses;
TRUNCATE TABLE municipalities;

-- Réactiver les contraintes
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- ÉTAPE 2: INSERTION DES DONNÉES DE TEST
-- ============================================

-- 1. License (DOIT être créée en premier car municipalities.license_id la référence)
INSERT INTO licenses (id, license_key, municipality_name, contact_email, contact_phone, issued_at, expires_at, is_active, max_users, max_admins, features, created_at, updated_at)
VALUES (1, 'LOME-2024-ABCD-1234', 'Lomé', 'contact@lome.tg', '+228 90 00 00 00', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1, 1000, 50, '{"notifications": true, "analytics": true, "export": true}', NOW(), NOW());

-- 2. Municipalité (avec référence à la license)
INSERT INTO municipalities (id, license_id, name, contact_email, contact_phone, address, created_at, updated_at)
VALUES (1, 1, 'Lomé', 'contact@lome.tg', '+228 90 00 00 00', 'Lomé, Togo', NOW(), NOW());

-- 4. Catégories
INSERT INTO categories (municipality_id, name, description, icon, color, created_at, updated_at) VALUES
(1, 'Voirie', 'Problèmes de routes, trottoirs, nids de poule', 'road', '#3B82F6', NOW(), NOW()),
(1, 'Éclairage public', 'Lampadaires défectueux, zones mal éclairées', 'lightbulb', '#F59E0B', NOW(), NOW()),
(1, 'Propreté', 'Ordures, déchets, assainissement', 'trash', '#10B981', NOW(), NOW()),
(1, 'Sécurité', 'Signalisation, feux tricolores', 'shield', '#EF4444', NOW(), NOW()),
(1, 'Espaces verts', 'Parcs, jardins, arbres', 'tree', '#22C55E', NOW(), NOW());

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT '✓ Données de test créées avec succès!' as message;
SELECT CONCAT('Municipalité: ', name, ' (ID: ', id, ')') as info FROM municipalities WHERE id = 1;
SELECT CONCAT('License: ', license_key, ' - Active: ', IF(is_active = 1, 'Oui', 'Non')) as info FROM licenses WHERE id = 1;
SELECT COUNT(*) as 'Nombre de catégories' FROM categories;

SELECT '' as '';
SELECT '🎯 Prochaines étapes:' as next_steps;
SELECT '1. Rechargez http://localhost:3000' as step1;
SELECT '2. Connectez-vous avec votre nom' as step2;
SELECT '3. Vous êtes prêt!' as step3;
