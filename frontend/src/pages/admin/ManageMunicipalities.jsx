import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Building2,
  RefreshCw,
  Key,
  Calendar,
  Users,
  MapPin
} from 'lucide-react';
import { Card, Button, Spinner } from '../../components/common';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

/**
 * Page de gestion des municipalités (Super Admin uniquement)
 */
const ManageMunicipalities = () => {
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState(null);
  const [selectedMunicipalityForLicense, setSelectedMunicipalityForLicense] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    region: '',
    country: 'Togo',
    contact_email: '',
    contact_phone: '+228',
    address: '',
    is_active: true,
    license_duration_years: 1
  });

  const [licenseFormData, setLicenseFormData] = useState({
    valid_until: '',
    max_users: 1000,
    max_reports_per_month: 5000,
    features: {
      reports: true,
      analytics: true,
      notifications: true,
      api_access: true
    }
  });

  useEffect(() => {
    loadMunicipalities();
  }, []);

  const loadMunicipalities = async () => {
    setLoading(true);
    try {
      const response = await adminService.getMunicipalities();
      setMunicipalities(response.data || []);
    } catch (error) {
      console.error('Erreur chargement municipalités:', error);
      toast.error('Impossible de charger les municipalités');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (municipality = null) => {
    if (municipality) {
      setEditingMunicipality(municipality);
      setFormData({
        name: municipality.name,
        region: municipality.region,
        country: municipality.country,
        contact_email: municipality.contact_email,
        contact_phone: municipality.contact_phone,
        address: municipality.address || '',
        is_active: municipality.is_active,
        license_duration_years: 1
      });
    } else {
      setEditingMunicipality(null);
      setFormData({
        name: '',
        region: '',
        country: 'Togo',
        contact_email: '',
        contact_phone: '+228',
        address: '',
        is_active: true,
        license_duration_years: 1
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMunicipality(null);
    setFormData({
      name: '',
      region: '',
      country: 'Togo',
      contact_email: '',
      contact_phone: '+228',
      address: '',
      is_active: true,
      license_duration_years: 1
    });
  };

  const handleOpenLicenseModal = (municipality) => {
    setSelectedMunicipalityForLicense(municipality);

    // Calculer la date de fin par défaut (1 an à partir d'aujourd'hui)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const validUntil = oneYearFromNow.toISOString().split('T')[0];

    setLicenseFormData({
      valid_until: validUntil,
      max_users: 1000,
      max_reports_per_month: 5000,
      features: {
        reports: true,
        analytics: true,
        notifications: true,
        api_access: true
      }
    });
    setShowLicenseModal(true);
  };

  const handleCloseLicenseModal = () => {
    setShowLicenseModal(false);
    setSelectedMunicipalityForLicense(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingMunicipality) {
        await adminService.updateMunicipality(editingMunicipality.id, formData);
        toast.success('Municipalité modifiée avec succès');
      } else {
        await adminService.createMunicipality(formData);
        toast.success('Municipalité créée avec succès');
      }
      handleCloseModal();
      loadMunicipalities();
    } catch (error) {
      console.error('Erreur sauvegarde municipalité:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleLicenseSubmit = async (e) => {
    e.preventDefault();

    try {
      await adminService.createMunicipalityLicense(
        selectedMunicipalityForLicense.id,
        licenseFormData
      );
      toast.success('Licence créée avec succès');
      handleCloseLicenseModal();
      loadMunicipalities();
    } catch (error) {
      console.error('Erreur création licence:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la licence');
    }
  };

  const handleDelete = async (municipalityId) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cette municipalité ?')) {
      return;
    }

    try {
      await adminService.deleteMunicipality(municipalityId);
      toast.success('Municipalité désactivée avec succès');
      loadMunicipalities();
    } catch (error) {
      console.error('Erreur suppression municipalité:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getLicenseStatus = (municipality) => {
    if (!municipality.license) {
      return { status: 'none', label: 'Aucune licence', color: 'gray' };
    }

    const license = municipality.license;
    const now = new Date();
    const expiresAt = new Date(license.expires_at);

    if (!license.is_active) {
      return { status: 'inactive', label: 'Inactive', color: 'gray' };
    }

    if (expiresAt < now) {
      return { status: 'expired', label: 'Expirée', color: 'red' };
    }

    const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 30) {
      return { status: 'expiring', label: `Expire dans ${daysUntilExpiry}j`, color: 'yellow' };
    }

    return { status: 'active', label: 'Active', color: 'green' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = {
    total: municipalities.length,
    active: municipalities.filter(m => m.is_active).length,
    withLicense: municipalities.filter(m =>
      m.license && m.license.is_active
    ).length,
    expired: municipalities.filter(m => {
      if (!m.license) return false;
      const license = m.license;
      const expiresAt = new Date(license.expires_at);
      return expiresAt < new Date();
    }).length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des municipalités
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez les municipalités et leurs licences (Super Admin)
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={loadMunicipalities}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle municipalité
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total municipalités</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Key className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avec licence</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withLicense}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Licences expirées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Liste des municipalités */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Municipalité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Licence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créée le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {municipalities.map((municipality) => {
                  const licenseStatus = getLicenseStatus(municipality);
                  const license = municipality.license;

                  return (
                    <tr key={municipality.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{municipality.name}</div>
                            <div className="text-sm text-gray-500">
                              {municipality.region}, {municipality.country}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{municipality.contact_phone}</div>
                        <div className="text-sm text-gray-500">{municipality.contact_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${licenseStatus.color}-100 text-${licenseStatus.color}-800`}>
                            {licenseStatus.label}
                          </span>
                          {license && (
                            <span className="text-xs text-gray-500">
                              Jusqu'au {formatDate(license.expires_at)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {municipality.is_active ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Désactivée
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(municipality.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenLicenseModal(municipality)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Gérer la licence"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(municipality)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {municipality.is_active && (
                            <button
                              onClick={() => handleDelete(municipality.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {municipalities.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune municipalité
                </h3>
                <p className="text-gray-500 mb-4">
                  Commencez par créer votre première municipalité
                </p>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une municipalité
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Modal de création/édition municipalité */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingMunicipality ? 'Modifier la municipalité' : 'Nouvelle municipalité'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                      Région *
                    </label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="input-field"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="input-field"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email de contact *
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone de contact * (+228XXXXXXXX)
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="input-field"
                      required
                      pattern="^\+?228[0-9]{8}$"
                      placeholder="+22890123456"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field"
                    rows={2}
                    maxLength={255}
                  />
                </div>

                {!editingMunicipality && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée de la licence initiale (années)
                    </label>
                    <input
                      type="number"
                      value={formData.license_duration_years}
                      onChange={(e) => setFormData({ ...formData, license_duration_years: parseInt(e.target.value) })}
                      className="input-field"
                      min={1}
                      max={10}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Municipalité active
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="secondary" onClick={handleCloseModal} fullWidth>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" fullWidth>
                    {editingMunicipality ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de gestion de licence */}
        {showLicenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Créer/Renouveler la licence
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Municipalité: <strong>{selectedMunicipalityForLicense?.name}</strong>
              </p>

              <form onSubmit={handleLicenseSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin de validité *
                  </label>
                  <input
                    type="date"
                    value={licenseFormData.valid_until}
                    onChange={(e) => setLicenseFormData({ ...licenseFormData, valid_until: e.target.value })}
                    className="input-field"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre maximum d'utilisateurs
                  </label>
                  <input
                    type="number"
                    value={licenseFormData.max_users}
                    onChange={(e) => setLicenseFormData({ ...licenseFormData, max_users: parseInt(e.target.value) })}
                    className="input-field"
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre maximum de signalements par mois
                  </label>
                  <input
                    type="number"
                    value={licenseFormData.max_reports_per_month}
                    onChange={(e) => setLicenseFormData({ ...licenseFormData, max_reports_per_month: parseInt(e.target.value) })}
                    className="input-field"
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fonctionnalités
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="feature_reports"
                      checked={licenseFormData.features.reports}
                      onChange={(e) => setLicenseFormData({
                        ...licenseFormData,
                        features: { ...licenseFormData.features, reports: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="feature_reports" className="text-sm text-gray-700">
                      Signalements
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="feature_analytics"
                      checked={licenseFormData.features.analytics}
                      onChange={(e) => setLicenseFormData({
                        ...licenseFormData,
                        features: { ...licenseFormData.features, analytics: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="feature_analytics" className="text-sm text-gray-700">
                      Analytiques
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="feature_notifications"
                      checked={licenseFormData.features.notifications}
                      onChange={(e) => setLicenseFormData({
                        ...licenseFormData,
                        features: { ...licenseFormData.features, notifications: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="feature_notifications" className="text-sm text-gray-700">
                      Notifications
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="feature_api"
                      checked={licenseFormData.features.api_access}
                      onChange={(e) => setLicenseFormData({
                        ...licenseFormData,
                        features: { ...licenseFormData.features, api_access: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="feature_api" className="text-sm text-gray-700">
                      Accès API
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="secondary" onClick={handleCloseLicenseModal} fullWidth>
                    Annuler
                  </Button>
                  <Button type="submit" variant="primary" fullWidth>
                    Créer la licence
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

export default ManageMunicipalities;
