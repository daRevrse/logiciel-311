import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/common';
import { Map, Smartphone, Fingerprint, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Page de connexion citoyenne
 */
const Login = () => {
  const navigate = useNavigate();
  const { loginByFingerprint, requestSmsCode, verifyCode, isAuthenticated } = useAuth();

  const [authMethod, setAuthMethod] = useState('fingerprint'); // 'fingerprint' ou 'sms'
  const [step, setStep] = useState(1); // 1: phone, 2: code
  const [loading, setLoading] = useState(false);

  // Données du formulaire
  const [formData, setFormData] = useState({
    municipalityId: '1', // À adapter selon votre système
    fullName: '',
    phone: '',
    code: ''
  });

  // Empreinte digitale (device fingerprint)
  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  useEffect(() => {
    // Rediriger si déjà authentifié
    if (isAuthenticated) {
      navigate('/');
    }

    // Générer l'empreinte digitale de l'appareil
    const generateFingerprint = async () => {
      try {
        // Collecte d'informations sur le navigateur/appareil
        const fingerprint = [
          navigator.userAgent,
          navigator.language,
          screen.width,
          screen.height,
          screen.colorDepth,
          new Date().getTimezoneOffset(),
          navigator.hardwareConcurrency || 'unknown'
        ].join('|');

        // Hash simple (en production, utiliser FingerprintJS)
        const hash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(fingerprint)
        );
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        setDeviceFingerprint(hashHex);
      } catch (error) {
        console.error('Erreur génération fingerprint:', error);
        // Fallback simple
        setDeviceFingerprint(
          `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        );
      }
    };

    generateFingerprint();
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Connexion par empreinte digitale
   */
  const handleFingerprintLogin = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('Veuillez entrer votre nom complet');
      return;
    }

    if (!deviceFingerprint) {
      toast.error('Impossible de générer l\'empreinte de l\'appareil');
      return;
    }

    setLoading(true);

    try {
      const data = await loginByFingerprint(
        formData.municipalityId,
        deviceFingerprint,
        formData.fullName
      );

      if (data.isNewUser) {
        toast.success('Bienvenue ! Votre compte a été créé avec succès');
      } else {
        toast.success('Connexion réussie !');
      }

      navigate('/');
    } catch (error) {
      console.error('Erreur connexion:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la connexion';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Demander un code SMS (étape 1)
   */
  const handleRequestSmsCode = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('Veuillez entrer votre nom complet');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Veuillez entrer votre numéro de téléphone');
      return;
    }

    setLoading(true);

    try {
      await requestSmsCode(formData.municipalityId, formData.phone, formData.fullName);
      toast.success('Code envoyé par SMS');
      setStep(2);
    } catch (error) {
      console.error('Erreur demande code:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de l\'envoi du code';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vérifier le code SMS et se connecter (étape 2)
   */
  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error('Veuillez entrer le code reçu par SMS');
      return;
    }

    setLoading(true);

    try {
      await verifyCode(formData.municipalityId, formData.phone, formData.code);
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (error) {
      console.error('Erreur vérification code:', error);
      const errorMsg = error.response?.data?.message || 'Code invalide ou expiré';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="bg-white rounded-[12px] shadow-card w-full max-w-md p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Map className="h-10 w-10 text-primary-600 mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Muno</h1>
          <p className="mt-1 text-sm text-gray-500">Signalement citoyen</p>
        </div>

        <div>
          {/* Sélection de la méthode d'authentification */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setAuthMethod('fingerprint');
                setStep(1);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                authMethod === 'fingerprint'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Fingerprint className="h-5 w-5" />
              <span className="font-medium">Appareil</span>
            </button>

            <button
              onClick={() => {
                setAuthMethod('sms');
                setStep(1);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                authMethod === 'sms'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Smartphone className="h-5 w-5" />
              <span className="font-medium">SMS</span>
            </button>
          </div>

          {/* Formulaire connexion par empreinte digitale */}
          {authMethod === 'fingerprint' && (
            <form onSubmit={handleFingerprintLogin}>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Utilisez votre appareil pour vous connecter. Si c'est votre première fois,
                  un compte sera créé automatiquement.
                </p>

                <Input
                  label="Nom complet"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Votre nom complet"
                  required
                />
              </div>

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Se connecter avec cet appareil
              </Button>
            </form>
          )}

          {/* Formulaire connexion par SMS */}
          {authMethod === 'sms' && step === 1 && (
            <form onSubmit={handleRequestSmsCode}>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Entrez votre numéro de téléphone pour recevoir un code de vérification.
                </p>

                <Input
                  label="Nom complet"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Votre nom complet"
                  required
                />

                <Input
                  label="Numéro de téléphone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+228 XX XX XX XX"
                  required
                />
              </div>

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Recevoir le code par SMS
              </Button>
            </form>
          )}

          {/* Formulaire vérification code SMS */}
          {authMethod === 'sms' && step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Un code de vérification a été envoyé au <strong>{formData.phone}</strong>
                </p>

                <Input
                  label="Code de vérification"
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Entrez le code à 6 chiffres"
                  maxLength={6}
                  required
                />
              </div>

              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Vérifier et se connecter
              </Button>

              <Button
                type="button"
                variant="ghost"
                fullWidth
                className="mt-2"
                onClick={() => setStep(1)}
              >
                Modifier le numéro
              </Button>
            </form>
          )}

          {/* Note de confidentialité */}
          <p className="mt-6 text-xs text-center text-gray-500">
            Vos données sont protégées et utilisées uniquement pour le service de signalement
          </p>
        </div>

        {/* Lien vers connexion admin */}
        <div className="mt-6 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Espace Administrateur
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
