import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Charger l'utilisateur depuis le localStorage au montage
  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser && authService.isAuthenticated()) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Connexion par empreinte digitale
   */
  const loginByFingerprint = async (municipalityId, deviceFingerprint, fullName) => {
    try {
      const data = await authService.loginByFingerprint(municipalityId, deviceFingerprint, fullName);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Erreur connexion fingerprint:', error);
      throw error;
    }
  };

  /**
   * Demander un code SMS
   */
  const requestSmsCode = async (municipalityId, phone, fullName) => {
    try {
      return await authService.requestSmsCode(municipalityId, phone, fullName);
    } catch (error) {
      console.error('Erreur demande code SMS:', error);
      throw error;
    }
  };

  /**
   * Vérifier le code SMS et se connecter
   */
  const verifyCode = async (municipalityId, phone, code) => {
    try {
      const data = await authService.verifyCode(municipalityId, phone, code);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Erreur vérification code:', error);
      throw error;
    }
  };

  /**
   * Connexion administrateur
   */
  const loginAdmin = async (email, password, municipalitySlug = null) => {
    try {
      const data = await authService.loginAdmin(email, password, municipalitySlug);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Erreur connexion admin:', error);
      throw error;
    }
  };

  /**
   * Déconnexion
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Vérifier si l'utilisateur est admin
   */
  const isAdmin = () => {
    return authService.isAdmin();
  };

  /**
   * Vérifier si l'utilisateur est superadmin
   */
  const isSuperAdmin = () => {
    return authService.isSuperAdmin();
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    role: user?.role || null,
    municipalityId: user?.municipalityId ?? user?.municipality_id ?? null,
    municipality: user?.municipality || null,
    loginByFingerprint,
    requestSmsCode,
    verifyCode,
    loginAdmin,
    logout,
    isAdmin,
    isSuperAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
