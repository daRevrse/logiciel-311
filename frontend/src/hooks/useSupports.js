import { useState, useEffect, useCallback } from 'react';
import supportService from '../services/supportService';
import toast from 'react-hot-toast';

/**
 * Hook personnalisé pour gérer les appuis
 */
export const useSupports = (reportId = null) => {
  const [hasSupported, setHasSupported] = useState(false);
  const [supportCount, setSupportCount] = useState(0);
  const [supporters, setSupporters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Vérifier si l'utilisateur a déjà apporté son appui
   */
  const checkSupport = useCallback(async (id = reportId) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await supportService.checkSupport(id);
      setHasSupported(data.hasSupported || false);
      return data.hasSupported;
    } catch (err) {
      console.error('Erreur vérification appui:', err);
      setError(err.response?.data?.message || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  /**
   * Obtenir le nombre d'appuis
   */
  const getSupportCount = useCallback(async (id = reportId) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await supportService.getSupportCount(id);
      setSupportCount(data.count || 0);
      return data.count;
    } catch (err) {
      console.error('Erreur comptage appuis:', err);
      setError(err.response?.data?.message || 'Erreur lors du comptage');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  /**
   * Ajouter son appui
   */
  const addSupport = async (id = reportId) => {
    if (!id) {
      toast.error('ID du signalement manquant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await supportService.addSupport(id);
      setHasSupported(true);
      setSupportCount(prev => prev + 1);
      toast.success('Votre appui a été ajouté');

      return true;
    } catch (err) {
      console.error('Erreur ajout appui:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors de l\'ajout de l\'appui';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retirer son appui
   */
  const removeSupport = async (id = reportId) => {
    if (!id) {
      toast.error('ID du signalement manquant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await supportService.removeSupport(id);
      setHasSupported(false);
      setSupportCount(prev => Math.max(0, prev - 1));
      toast.success('Votre appui a été retiré');

      return true;
    } catch (err) {
      console.error('Erreur retrait appui:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors du retrait de l\'appui';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Basculer l'appui (ajouter ou retirer)
   */
  const toggleSupport = async (id = reportId) => {
    if (hasSupported) {
      return await removeSupport(id);
    } else {
      return await addSupport(id);
    }
  };

  /**
   * Charger la liste des supporters
   */
  const loadSupporters = async (id = reportId, page = 1, limit = 20) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await supportService.getSupporters(id, page, limit);
      setSupporters(data.supporters || data.data || []);
      return data;
    } catch (err) {
      console.error('Erreur chargement supporters:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des supporters');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtenir les signalements les plus appuyés
   */
  const getTopSupported = async (limit = 10) => {
    setLoading(true);
    setError(null);

    try {
      const response = await supportService.getTopSupported(limit);
      return response.data || [];
    } catch (err) {
      console.error('Erreur top signalements:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtenir les signalements appuyés par l'utilisateur
   */
  const getMySupportedReports = async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);

    try {
      const data = await supportService.getMySupportedReports(page, limit);
      return data;
    } catch (err) {
      console.error('Erreur mes appuis:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rafraîchir les données d'appui
   */
  const refresh = useCallback(async (id = reportId) => {
    if (!id) return;

    await Promise.all([
      checkSupport(id),
      getSupportCount(id)
    ]);
  }, [reportId, checkSupport, getSupportCount]);

  // Chargement automatique au montage
  useEffect(() => {
    if (reportId) {
      refresh(reportId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  return {
    hasSupported,
    supportCount,
    supporters,
    loading,
    error,
    addSupport,
    removeSupport,
    toggleSupport,
    checkSupport,
    getSupportCount,
    loadSupporters,
    getTopSupported,
    getMySupportedReports,
    refresh
  };
};

export default useSupports;
