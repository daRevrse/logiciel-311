module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    municipality_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'municipality_id',
      references: {
        model: 'municipalities',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le nom de la catégorie est requis' }
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    icon: {
      type: DataTypes.STRING(50),
      defaultValue: 'default'
      // Exemples: 'road', 'trash', 'light', 'water', 'park'
    },
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#3B82F6',
      validate: {
        is: {
          args: /^#[0-9A-F]{6}$/i,
          msg: 'Le code couleur doit être au format hexadécimal (#RRGGBB)'
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['municipality_id'] },
      { fields: ['is_active'] },
      {
        fields: ['municipality_id', 'name'],
        unique: true,
        name: 'unique_category_per_municipality'
      }
    ]
  });

  // ============================================
  // HOOKS
  // ============================================

  // Avant création : vérifier unicité par municipalité
  Category.beforeCreate(async (category) => {
    const existing = await Category.findOne({
      where: {
        municipality_id: category.municipality_id,
        name: category.name
      }
    });

    if (existing) {
      throw new Error(`La catégorie "${category.name}" existe déjà pour cette municipalité`);
    }
  });

  return Category;
};
