import { useState, useEffect, useCallback } from 'react';
import reportService from '../services/reportService';
import toast from 'react-hot-toast';

/**
 * Hook personnalisé pour gérer les signalements
 */
export const useReports = (filters = {}, autoLoad = true) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0,
    limit: 10
  });

  /**
   * Charger la liste des signalements
   */
  const loadReports = useCallback(async (customFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await reportService.listReports({ ...filters, ...customFilters });
      setReports(data.reports || data.data || []);

      if (data.pagination) {
        setPagination(data.pagination);
      }

      return data;
    } catch (err) {
      console.error('Erreur chargement signalements:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des signalements');
      toast.error('Impossible de charger les signalements');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Charger un signalement par ID
   */
  const loadReportById = async (reportId) => {
    setLoading(true);
    setError(null);

    try {
      const data = await reportService.getReportById(reportId);
      return data.report || data;
    } catch (err) {
      console.error('Erreur chargement signalement:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement du signalement');
      toast.error('Impossible de charger le signalement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Créer un nouveau signalement
   */
  const createReport = async (reportData) => {
    setLoading(true);
    setError(null);

    try {
      const data = await reportService.createReport(reportData);
      toast.success('Signalement créé avec succès');

      // Recharger la liste si nécessaire
      if (autoLoad) {
        await loadReports();
      }

      return data.report || data;
    } catch (err) {
      console.error('Erreur création signalement:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors de la création du signalement';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Uploader des photos
   */
  const uploadPhotos = async (reportId, files) => {
    setLoading(true);
    setError(null);

    try {
      const data = await reportService.uploadPhotos(reportId, files);
      toast.success(`${files.length} photo(s) uploadée(s) avec succès`);
      return data;
    } catch (err) {
      console.error('Erreur upload photos:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors de l\'upload des photos';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mettre à jour un signalement
   */
  const updateReport = async (reportId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const data = await reportService.updateReport(reportId, updateData);
      toast.success('Signalement mis à jour');

      // Recharger la liste si nécessaire
      if (autoLoad) {
        await loadReports();
      }

      return data.report || data;
    } catch (err) {
      console.error('Erreur mise à jour signalement:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprimer un signalement
   */
  const deleteReport = async (reportId) => {
    setLoading(true);
    setError(null);

    try {
      await reportService.deleteReport(reportId);
      toast.success('Signalement supprimé');

      // Recharger la liste
      if (autoLoad) {
        await loadReports();
      }
    } catch (err) {
      console.error('Erreur suppression signalement:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors de la suppression';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Changer de page
   */
  const changePage = (newPage) => {
    loadReports({ page: newPage });
  };

  /**
   * Rafraîchir la liste
   */
  const refresh = () => {
    loadReports();
  };

  // Chargement automatique au montage si autoLoad est activé
  useEffect(() => {
    if (autoLoad) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  return {
    reports,
    loading,
    error,
    pagination,
    loadReports,
    loadReportById,
    createReport,
    uploadPhotos,
    updateReport,
    deleteReport,
    changePage,
    refresh
  };
};

export default useReports;
