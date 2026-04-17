import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/common';
import { Smartphone, Fingerprint, MapPin, ThumbsUp, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { loginByFingerprint, requestSmsCode, verifyCode, isAuthenticated } = useAuth();

  const [authMethod, setAuthMethod] = useState('fingerprint');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    municipalityId: '1',
    fullName: '',
    phone: '',
    code: ''
  });

  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/');

    const generateFingerprint = async () => {
      try {
        const fingerprint = [
          navigator.userAgent,
          navigator.language,
          screen.width,
          screen.height,
          screen.colorDepth,
          new Date().getTimezoneOffset(),
          navigator.hardwareConcurrency || 'unknown'
        ].join('|');

        const hash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(fingerprint)
        );
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setDeviceFingerprint(hashHex);
      } catch (error) {
        console.error('Erreur génération fingerprint:', error);
        setDeviceFingerprint(
          `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        );
      }
    };

    generateFingerprint();
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFingerprintLogin = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Veuillez entrer votre nom complet');
      return;
    }
    if (!deviceFingerprint) {
      toast.error("Impossible de générer l'empreinte de l'appareil");
      return;
    }
    setLoading(true);
    try {
      const data = await loginByFingerprint(
        formData.municipalityId,
        deviceFingerprint,
        formData.fullName
      );
      toast.success(data.isNewUser ? 'Bienvenue ! Compte créé.' : 'Connexion réussie !');
      navigate('/');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Erreur lors de la connexion';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSmsCode = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return toast.error('Veuillez entrer votre nom complet');
    if (!formData.phone.trim()) return toast.error('Veuillez entrer votre numéro de téléphone');
    setLoading(true);
    try {
      await requestSmsCode(formData.municipalityId, formData.phone, formData.fullName);
      toast.success('Code envoyé par SMS');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de l'envoi du code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return toast.error('Veuillez entrer le code reçu par SMS');
    setLoading(true);
    try {
      await verifyCode(formData.municipalityId, formData.phone, formData.code);
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row">
      {/* Hero gauche (desktop) / haut (mobile) */}
      <div className="relative lg:w-1/2 bg-gradient-to-br from-[#1E3A5F] to-primary-600 text-white p-8 lg:p-16 flex flex-col justify-between overflow-hidden">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>

          <div className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center p-2">
              <img src="/icone.png" alt="Muno" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-none">Muno</h1>
              <p className="text-xs text-white/70 mt-1">Signalement citoyen</p>
            </div>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 max-w-md">
            Ma ville à portée de main.
          </h2>
          <p className="text-white/80 max-w-md leading-relaxed">
            Signalez un problème, suivez son traitement, appuyez les signalements qui comptent pour vous.
          </p>
        </div>

        <div className="hidden lg:flex gap-6 mt-12">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <MapPin className="h-4 w-4 text-support-light" />
            Localisation précise
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <ThumbsUp className="h-4 w-4 text-support-light" />
            Appui citoyen
          </div>
        </div>
      </div>

      {/* Formulaire droite */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="bg-white rounded-[12px] shadow-card w-full max-w-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Se connecter</h3>
          <p className="text-sm text-gray-500 mb-6">
            Accédez à votre espace citoyen
          </p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setAuthMethod('fingerprint'); setStep(1); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                authMethod === 'fingerprint'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <Fingerprint className="h-5 w-5" />
              <span className="font-medium">Appareil</span>
            </button>

            <button
              onClick={() => { setAuthMethod('sms'); setStep(1); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                authMethod === 'sms'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <Smartphone className="h-5 w-5" />
              <span className="font-medium">SMS</span>
            </button>
          </div>

          {authMethod === 'fingerprint' && (
            <form onSubmit={handleFingerprintLogin}>
              <p className="text-sm text-gray-600 mb-4">
                Utilisez votre appareil pour vous connecter. Si c'est votre première fois, un compte sera créé automatiquement.
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
              <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-4">
                Se connecter avec cet appareil
              </Button>
            </form>
          )}

          {authMethod === 'sms' && step === 1 && (
            <form onSubmit={handleRequestSmsCode}>
              <p className="text-sm text-gray-600 mb-4">
                Entrez votre numéro pour recevoir un code de vérification.
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
              <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-4">
                Recevoir le code par SMS
              </Button>
            </form>
          )}

          {authMethod === 'sms' && step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <p className="text-sm text-gray-600 mb-4">
                Code envoyé au <strong>{formData.phone}</strong>
              </p>
              <Input
                label="Code de vérification"
                name="code"
                type="text"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Code à 6 chiffres"
                maxLength={6}
                required
              />
              <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-4">
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

          <p className="mt-6 text-xs text-center text-gray-500">
            Vos données sont protégées et utilisées uniquement pour le service de signalement.
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-surface text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <MapPin className="h-5 w-5 text-primary-600" />
              <div className="text-left">
                <p className="text-sm font-semibold">Signaler sans compte</p>
                <p className="text-xs text-gray-500">Rapide et anonyme</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
