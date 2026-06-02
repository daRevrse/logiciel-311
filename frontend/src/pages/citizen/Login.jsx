import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, AuthShell } from '../../components/common';
import reportService from '../../services/reportService';
import { Mail, Smartphone, Fingerprint, Building2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const METHODS = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'fingerprint', label: 'Appareil', icon: Fingerprint },
  { key: 'sms', label: 'SMS', icon: Smartphone },
];

const Login = () => {
  const navigate = useNavigate();
  const { loginByEmail, loginByFingerprint, requestSmsCode, verifyCode, isAuthenticated } = useAuth();

  const [authMethod, setAuthMethod] = useState('email');
  const [step, setStep] = useState(1); // pour SMS : 1 = demande, 2 = vérification
  const [loading, setLoading] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');

  const [formData, setFormData] = useState({
    municipalityId: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
    code: ''
  });

  const needsMunicipality = authMethod === 'fingerprint' || authMethod === 'sms';

  // Charger les municipalités (nécessaire pour device/SMS)
  useEffect(() => {
    reportService.getPublicMunicipalities()
      .then((res) => {
        const list = res.data || res || [];
        setMunicipalities(list);
        if (list.length > 0) {
          setFormData((prev) => (prev.municipalityId ? prev : { ...prev, municipalityId: String(list[0].id) }));
        }
      })
      .catch((err) => console.error('Erreur chargement municipalités:', err));
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/');

    const generateFingerprint = async () => {
      try {
        const raw = [
          navigator.userAgent,
          navigator.language,
          screen.width,
          screen.height,
          screen.colorDepth,
          new Date().getTimezoneOffset(),
          navigator.hardwareConcurrency || 'unknown'
        ].join('|');
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
        const hashHex = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
        setDeviceFingerprint(hashHex);
      } catch (error) {
        console.error('Erreur génération fingerprint:', error);
        setDeviceFingerprint(`fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      }
    };
    generateFingerprint();
  }, [isAuthenticated, navigate]);

  const set = (name) => (e) => setFormData({ ...formData, [name]: e.target.value });

  const switchMethod = (key) => {
    setAuthMethod(key);
    setStep(1);
  };

  // --- Email / mot de passe ---
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      return toast.error('Email et mot de passe requis');
    }
    setLoading(true);
    try {
      await loginByEmail(formData.email.trim(), formData.password);
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  // --- Appareil (fingerprint) ---
  const handleFingerprintLogin = async (e) => {
    e.preventDefault();
    if (!formData.municipalityId) return toast.error('Veuillez sélectionner votre municipalité');
    if (!formData.fullName.trim()) return toast.error('Veuillez entrer votre nom complet');
    if (!deviceFingerprint) return toast.error("Impossible de générer l'empreinte de l'appareil");
    setLoading(true);
    try {
      const data = await loginByFingerprint(formData.municipalityId, deviceFingerprint, formData.fullName);
      toast.success(data.isNewUser ? 'Bienvenue ! Compte créé.' : 'Connexion réussie !');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  // --- SMS ---
  const handleRequestSmsCode = async (e) => {
    e.preventDefault();
    if (!formData.municipalityId) return toast.error('Veuillez sélectionner votre municipalité');
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
    <AuthShell>
      <div className="bg-white rounded-2xl shadow-xl shadow-navy-deep/5 border border-gray-100 p-8">
        <h3 className="text-2xl font-black text-navy-deep tracking-tight">Se connecter</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">Accédez à votre espace citoyen Muno</p>

        {/* Sélecteur de méthode */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl mb-6">
          {METHODS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchMethod(key)}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                authMethod === key ? 'bg-white text-navy-deep shadow-sm' : 'text-gray-500 hover:text-navy-deep'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Municipalité (device / SMS uniquement) */}
        {needsMunicipality && municipalities.length > 0 && (
          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Votre municipalité</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={formData.municipalityId}
                onChange={set('municipalityId')}
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise/30 focus:border-turquoise"
              >
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Méthode Email */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input label="Email" type="email" name="email" value={formData.email} onChange={set('email')} placeholder="vous@exemple.com" required />
            <Input label="Mot de passe" type="password" name="password" value={formData.password} onChange={set('password')} placeholder="Votre mot de passe" required />
            <Button type="submit" variant="primary" fullWidth loading={loading}>Se connecter</Button>
          </form>
        )}

        {/* Méthode Appareil */}
        {authMethod === 'fingerprint' && (
          <form onSubmit={handleFingerprintLogin} className="space-y-4">
            <p className="text-sm text-gray-500">
              Connexion rapide via cet appareil. À votre première connexion, un compte est créé automatiquement.
            </p>
            <Input label="Nom complet" type="text" name="fullName" value={formData.fullName} onChange={set('fullName')} placeholder="Votre nom complet" required />
            <Button type="submit" variant="primary" fullWidth loading={loading}>Continuer avec cet appareil</Button>
          </form>
        )}

        {/* Méthode SMS */}
        {authMethod === 'sms' && step === 1 && (
          <form onSubmit={handleRequestSmsCode} className="space-y-4">
            <p className="text-sm text-gray-500">Recevez un code de vérification par SMS.</p>
            <Input label="Nom complet" type="text" name="fullName" value={formData.fullName} onChange={set('fullName')} placeholder="Votre nom complet" required />
            <Input label="Numéro de téléphone" type="tel" name="phone" value={formData.phone} onChange={set('phone')} placeholder="+228 XX XX XX XX" required />
            <Button type="submit" variant="primary" fullWidth loading={loading}>Recevoir le code</Button>
          </form>
        )}

        {authMethod === 'sms' && step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-gray-500">Code envoyé au <strong className="text-navy-deep">{formData.phone}</strong></p>
            <Input label="Code de vérification" type="text" name="code" value={formData.code} onChange={set('code')} placeholder="Code à 6 chiffres" maxLength={6} required />
            <Button type="submit" variant="primary" fullWidth loading={loading}>Vérifier et se connecter</Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => setStep(1)}>Modifier le numéro</Button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
          <p className="text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-turquoise font-bold hover:underline">Créer un compte</Link>
          </p>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <MapPin className="h-5 w-5 text-turquoise" />
            <div className="text-left">
              <p className="text-sm font-bold text-navy-deep">Signaler sans compte</p>
              <p className="text-xs text-gray-500">Rapide et anonyme</p>
            </div>
          </Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default Login;
