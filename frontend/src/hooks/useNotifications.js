import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import toast from 'react-hot-toast';

/**
 * Hook personnalisé pour gérer les notifications
 */
export const useNotifications = () => {
  const [preferences, setPreferences] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger les préférences de notification
   */
  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await notificationService.getPreferences();
      setPreferences(data.preferences || data);
      return data;
    } catch (err) {
      console.error('Erreur chargement préférences:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mettre à jour les préférences
   */
  const updatePreferences = async (newPreferences) => {
    setLoading(true);
    setError(null);

    try {
      const data = await notificationService.updatePreferences(newPreferences);
      setPreferences(data.preferences || data);
      toast.success('Préférences mises à jour');
      return data;
    } catch (err) {
      console.error('Erreur mise à jour préférences:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charger l'historique des notifications
   */
  const loadHistory = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const data = await notificationService.getHistory(filters);
      setHistory(data.notifications || data.data || []);
      return data;
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renvoyer une notification échouée
   */
  const resendNotification = async (notificationId) => {
    setLoading(true);
    setError(null);

    try {
      await notificationService.resendNotification(notificationId);
      toast.success('Notification renvoyée');

      // Recharger l'historique
      await loadHistory();
    } catch (err) {
      console.error('Erreur renvoi notification:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors du renvoi';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envoyer une notification de test (admin)
   */
  const sendTestNotification = async (email) => {
    setLoading(true);
    setError(null);

    try {
      await notificationService.sendTestNotification(email);
      toast.success('Notification de test envoyée');
    } catch (err) {
      console.error('Erreur envoi test:', err);
      const errorMsg = err.response?.data?.message || 'Erreur lors de l\'envoi du test';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtenir les statistiques (admin)
   */
  const getStats = async (startDate, endDate) => {
    setLoading(true);
    setError(null);

    try {
      const data = await notificationService.getStats(startDate, endDate);
      return data;
    } catch (err) {
      console.error('Erreur stats notifications:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des stats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Chargement automatique des préférences au montage
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    history,
    loading,
    error,
    loadPreferences,
    updatePreferences,
    loadHistory,
    resendNotification,
    sendTestNotification,
    getStats
  };
};

export default useNotifications;
