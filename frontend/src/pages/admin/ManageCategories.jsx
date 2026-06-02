import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Power, Check, X, Tag, RefreshCw, Clock,
  MapPin, Construction, Trash2, Lightbulb, TreePine, Droplet, AlertTriangle, Home, Car, User
} from 'lucide-react';
import { Card, Button, Spinner } from '../../components/common';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

// Mapping nom d'icône (stocké en base) → composant lucide
const ICONS = {
  'map-pin': MapPin,
  construction: Construction,
  'trash-2': Trash2,
  lightbulb: Lightbulb,
  'tree-pine': TreePine,
  droplet: Droplet,
  'alert-triangle': AlertTriangle,
  home: Home,
  car: Car,
  user: User,
};
const ICON_OPTIONS = Object.keys(ICONS);
const CategoryIcon = ({ name, className }) => {
  const Cmp = ICONS[name] || Tag;
  return <Cmp className={className} />;
};

const DEFAULT_FORM = { name: '', description: '', icon: 'map-pin', color: '#3B82F6', sla_hours: 72, is_active: true };

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => { loadCategories(); }, []);

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
        sla_hours: category.sla_hours ?? 72,
        is_active: category.is_active !== false
      });
    } else {
      setEditingCategory(null);
      setFormData(DEFAULT_FORM);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(DEFAULT_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, sla_hours: Number(formData.sla_hours) || 72 };
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, payload);
        toast.success('Catégorie modifiée');
      } else {
        await adminService.createCategory(payload);
        toast.success('Catégorie créée');
      }
      handleCloseModal();
      loadCategories();
    } catch (error) {
      console.error('Erreur sauvegarde catégorie:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category) => {
    const isActive = category.is_active !== false;
    if (isActive && !confirm('Désactiver cette catégorie ? Elle ne sera plus proposée aux citoyens.')) return;
    try {
      if (isActive) {
        await adminService.deleteCategory(category.id);
        toast.success('Catégorie désactivée');
      } else {
        await adminService.updateCategory(category.id, { is_active: true });
        toast.success('Catégorie réactivée');
      }
      loadCategories();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.is_active !== false).length,
    inactive: categories.filter((c) => c.is_active === false).length,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="text-turquoise" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-deep tracking-tight">Catégories</h1>
          <p className="text-slate-500 text-sm mt-0.5">Domaines de signalement et délai de traitement (SLA).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadCategories} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-navy-deep hover:border-turquoise transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-turquoise text-navy-deep text-sm font-bold hover:bg-turquoise/90">
            <Plus className="h-4 w-4" /> Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Tag, color: 'text-navy-deep', bg: 'bg-navy-deep/10' },
          { label: 'Actives', value: stats.active, icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Désactivées', value: stats.inactive, icon: X, color: 'text-slate-500', bg: 'bg-slate-100' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
            <div>
              <p className="text-2xl font-extrabold text-navy-deep leading-none">{s.value}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liste */}
      <Card className="border border-slate-100 shadow-sm p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Catégorie</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">SLA</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((category) => {
                const isActive = category.is_active !== false;
                return (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${category.color}20` }}>
                          <CategoryIcon name={category.icon} className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-bold text-navy-deep">{category.name}</div>
                          <div className="text-xs text-slate-400">#{category.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <div className="text-sm text-slate-600 truncate">{category.description || '—'}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-turquoise" /> {category.sla_hours ?? 72}h
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {isActive ? (
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Active</span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-slate-200 text-slate-600">Désactivée</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenModal(category)} title="Modifier"
                          className="p-2 rounded-lg text-slate-500 hover:text-turquoise-dark hover:bg-slate-100">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleToggleActive(category)} title={isActive ? 'Désactiver' : 'Réactiver'}
                          className={`p-2 rounded-lg hover:bg-slate-100 ${isActive ? 'text-slate-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'}`}>
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <Tag className="h-14 w-14 text-slate-200 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-navy-deep mb-1">Aucune catégorie</h3>
              <p className="text-slate-500 mb-4 text-sm">Créez votre première catégorie de signalement.</p>
              <Button variant="primary" onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" /> Créer une catégorie
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-navy-deep mb-4">
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field" required minLength={3} maxLength={100} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field" rows={3} maxLength={500} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Icône</label>
                  <select value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="input-field">
                    {ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
                  <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="input-field h-10" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Délai de traitement (SLA) en heures</label>
                <input type="number" min={1} max={8760} value={formData.sla_hours}
                  onChange={(e) => setFormData({ ...formData, sla_hours: e.target.value })} className="input-field" />
                <p className="text-xs text-slate-400 mt-1">Délai cible avant échéance d'un signalement de cette catégorie.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-turquoise focus:ring-turquoise" />
                <span className="text-sm text-slate-700">Catégorie active</span>
              </label>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={handleCloseModal} fullWidth>Annuler</Button>
                <Button type="submit" variant="primary" fullWidth loading={saving}>
                  {editingCategory ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;
