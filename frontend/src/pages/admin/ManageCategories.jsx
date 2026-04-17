import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Tag,
  RefreshCw
} from 'lucide-react';
import { Card, Button, Spinner } from '../../components/common';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

/**
 * Page de gestion des catégories
 */
const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'map-pin',
    color: '#3B82F6',
    active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await adminService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      toast.error('Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || 'map-pin',
        color: category.color || '#3B82F6',
        active: !!category.active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        icon: 'map-pin',
        color: '#3B82F6',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'map-pin',
      color: '#3B82F6',
      active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, formData);
        toast.success('Catégorie modifiée avec succès');
      } else {
        await adminService.createCategory(formData);
        toast.success('Catégorie créée avec succès');
      }
      handleCloseModal();
      loadCategories();
    } catch (error) {
      console.error('Erreur sauvegarde catégorie:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cette catégorie ?')) {
      return;
    }

    try {
      await adminService.deleteCategory(categoryId);
      toast.success('Catégorie désactivée avec succès');
      loadCategories();
    } catch (error) {
      console.error('Erreur suppression catégorie:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const iconOptions = [
    'map-pin',
    'construction',
    'trash-2',
    'lightbulb',
    'tree-pine',
    'droplet',
    'alert-triangle',
    'home',
    'car',
    'user'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des catégories
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez les catégories de signalements de votre municipalité
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={loadCategories}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle catégorie
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total catégories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Actives</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.active).length}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Désactivées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => !c.active).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Liste des catégories */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <Tag className="h-5 w-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{category.name}</div>
                          <div className="text-sm text-gray-500">#{category.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.active ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Désactivée
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {category.active && (
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {categories.length === 0 && (
              <div className="text-center py-12">
                <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune catégorie
                </h3>
                <p className="text-gray-500 mb-4">
                  Commencez par créer votre première catégorie
                </p>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une catégorie
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Modal de création/édition */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icône
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="input-field"
                    >
                      {iconOptions.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Couleur
                    </label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="input-field h-10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700">
                    Catégorie active
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="secondary" onClick={handleCloseModal} fullWidth>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" fullWidth>
                    {editingCategory ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCategories;
