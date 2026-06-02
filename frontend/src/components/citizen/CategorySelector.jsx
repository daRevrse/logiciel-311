import React from 'react';
import {
  Droplets,
  Lightbulb,
  Trash2,
  AlertTriangle,
  Trees,
  Construction,
  Car,
  MapPin,
  Home
} from 'lucide-react';

/**
 * Mapping icônes par catégorie
 */
const categoryIcons = {
  'Eau': Droplets,
  'Électricité': Lightbulb,
  'Déchets': Trash2,
  'Sécurité': AlertTriangle,
  'Espaces verts': Trees,
  'Infrastructure': Construction,
  'Circulation': Car,
  'Autre': MapPin,
  'default': Home
};

/**
 * Sélecteur de catégorie avec icônes
 */
const CategorySelector = ({ categories = [], selectedCategory, onChange, error }) => {
  const getIcon = (categoryName) => {
    const Icon = categoryIcons[categoryName] || categoryIcons.default;
    return Icon;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Catégorie du signalement <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((category) => {
            const Icon = getIcon(category.name);
            const isSelected = selectedCategory?.id === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onChange(category)}
                className={`
                  p-4 rounded-xl border-2 transition-all text-center
                  ${isSelected
                    ? 'border-turquoise bg-turquoise/10 text-navy-deep shadow-sm'
                    : 'border-gray-200 hover:border-turquoise/50 hover:bg-turquoise/5 text-gray-700'
                  }
                  ${error ? 'border-red-300' : ''}
                `}
              >
                <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? 'text-turquoise' : 'text-gray-400'}`} />
                <span className="text-sm font-medium block">{category.name}</span>
                {category.description && (
                  <span className="text-xs text-gray-500 block mt-1 line-clamp-2">
                    {category.description}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </p>
      )}

      {selectedCategory && (
        <div className="bg-turquoise/10 border border-turquoise/30 rounded-xl p-3">
          <p className="text-sm text-navy-deep">
            <span className="font-medium">Sélectionné :</span> {selectedCategory.name}
          </p>
          {selectedCategory.description && (
            <p className="text-xs text-navy-deep/70 mt-1">
              {selectedCategory.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
