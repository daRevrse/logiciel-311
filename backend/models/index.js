const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialisation de Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    timezone: dbConfig.timezone,
    define: dbConfig.define,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  }
);

// Objet contenant tous les modèles
const db = {
  sequelize,
  Sequelize
};

// Import des modèles
db.License = require('./License')(sequelize, Sequelize.DataTypes);
db.Municipality = require('./Municipality')(sequelize, Sequelize.DataTypes);
db.Category = require('./Category')(sequelize, Sequelize.DataTypes);
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Report = require('./Report')(sequelize, Sequelize.DataTypes);
db.ReportPhoto = require('./ReportPhoto')(sequelize, Sequelize.DataTypes);
db.Support = require('./Support')(sequelize, Sequelize.DataTypes);
db.StatusHistory = require('./StatusHistory')(sequelize, Sequelize.DataTypes);
db.Notification = require('./Notification')(sequelize, Sequelize.DataTypes);
db.ActivityLog = require('./ActivityLog')(sequelize, Sequelize.DataTypes);

// ============================================
// DÉFINITION DES ASSOCIATIONS
// ============================================

// License <-> Municipality
db.License.hasOne(db.Municipality, {
  foreignKey: 'license_id',
  as: 'municipality'
});
db.Municipality.belongsTo(db.License, {
  foreignKey: 'license_id',
  as: 'license'
});

// Municipality <-> Users
db.Municipality.hasMany(db.User, {
  foreignKey: 'municipality_id',
  as: 'users'
});
db.User.belongsTo(db.Municipality, {
  foreignKey: 'municipality_id',
  as: 'municipality'
});

// Municipality <-> Categories
db.Municipality.hasMany(db.Category, {
  foreignKey: 'municipality_id',
  as: 'categories'
});
db.Category.belongsTo(db.Municipality, {
  foreignKey: 'municipality_id',
  as: 'municipality'
});

// Municipality <-> Reports
db.Municipality.hasMany(db.Report, {
  foreignKey: 'municipality_id',
  as: 'reports'
});
db.Report.belongsTo(db.Municipality, {
  foreignKey: 'municipality_id',
  as: 'municipality'
});

// User <-> Reports (Citoyen créateur)
db.User.hasMany(db.Report, {
  foreignKey: 'citizen_id',
  as: 'reports'
});
db.Report.belongsTo(db.User, {
  foreignKey: 'citizen_id',
  as: 'citizen'
});

// User <-> Reports (Admin résolveur)
db.User.hasMany(db.Report, {
  foreignKey: 'resolved_by',
  as: 'resolvedReports'
});
db.Report.belongsTo(db.User, {
  foreignKey: 'resolved_by',
  as: 'resolver'
});

// Category <-> Reports
db.Category.hasMany(db.Report, {
  foreignKey: 'category_id',
  as: 'reports'
});
db.Report.belongsTo(db.Category, {
  foreignKey: 'category_id',
  as: 'category'
});

// Report <-> ReportPhotos
db.Report.hasMany(db.ReportPhoto, {
  foreignKey: 'report_id',
  as: 'photos'
});
db.ReportPhoto.belongsTo(db.Report, {
  foreignKey: 'report_id',
  as: 'report'
});

// Report <-> Supports
db.Report.hasMany(db.Support, {
  foreignKey: 'report_id',
  as: 'supports'
});
db.Support.belongsTo(db.Report, {
  foreignKey: 'report_id',
  as: 'report'
});

// User <-> Supports
db.User.hasMany(db.Support, {
  foreignKey: 'citizen_id',
  as: 'supports'
});
db.Support.belongsTo(db.User, {
  foreignKey: 'citizen_id',
  as: 'citizen'
});

// Report <-> StatusHistory
db.Report.hasMany(db.StatusHistory, {
  foreignKey: 'report_id',
  as: 'statusHistory'
});
db.StatusHistory.belongsTo(db.Report, {
  foreignKey: 'report_id',
  as: 'report'
});

// User <-> StatusHistory
db.User.hasMany(db.StatusHistory, {
  foreignKey: 'changed_by',
  as: 'statusChanges'
});
db.StatusHistory.belongsTo(db.User, {
  foreignKey: 'changed_by',
  as: 'admin'
});

// Municipality <-> Notifications
db.Municipality.hasMany(db.Notification, {
  foreignKey: 'municipality_id',
  as: 'notifications'
});
db.Notification.belongsTo(db.Municipality, {
  foreignKey: 'municipality_id',
  as: 'municipality'
});

// User <-> Notifications
db.User.hasMany(db.Notification, {
  foreignKey: 'user_id',
  as: 'notifications'
});
db.Notification.belongsTo(db.User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Report <-> Notifications
db.Report.hasMany(db.Notification, {
  foreignKey: 'report_id',
  as: 'notifications'
});
db.Notification.belongsTo(db.Report, {
  foreignKey: 'report_id',
  as: 'report'
});

// Municipality <-> ActivityLogs
db.Municipality.hasMany(db.ActivityLog, {
  foreignKey: 'municipality_id',
  as: 'activityLogs'
});
db.ActivityLog.belongsTo(db.Municipality, {
  foreignKey: 'municipality_id',
  as: 'municipality'
});

// User <-> ActivityLogs
db.User.hasMany(db.ActivityLog, {
  foreignKey: 'user_id',
  as: 'activityLogs'
});
db.ActivityLog.belongsTo(db.User, {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = db;
