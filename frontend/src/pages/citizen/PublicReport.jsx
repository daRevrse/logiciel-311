import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Send,
  Building2,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Lock,
  LogIn,
  ThumbsUp
} from 'lucide-react';
import { Button, Card, Input, Textarea } from '../../components/common';
import { LocationPicker } from '../../components/citizen';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

const initialForm = {
  municipalityId: '',
  categoryId: '',
  title: '',
  description: '',
  address: '',
  latitude: '',
  longitude: ''
};

const PublicReport = () => {
  const [municipalities, setMunicipalities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: municipalité, 2: formulaire, 3: succès
  const [createdReport, setCreatedReport] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchMunicipalities();
  }, []);

  const fetchMunicipalities = async () => {
    try {
      const resp = await reportService.getPublicMunicipalities();
      setMunicipalities(resp.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Impossible de charger les municipalités');
    } finally {
      setLoading(false);
    }
  };

  const handleMunicipalitySelect = async (muni) => {
    setFormData(prev => ({ ...prev, municipalityId: muni.id }));
    try {
      setLoading(true);
      const resp = await reportService.getCategories(muni.id);
      setCategories(resp.data || resp);
      setStep(2);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      toast.error('Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  // Recherche signalements similaires à proximité dès coordonnées connues
  useEffect(() => {
    const fetchNearby = async () => {
      if (!formData.latitude || !formData.longitude) {
        setNearby([]);
        return;
      }
      try {
        const resp = await reportService.searchByLocation(
          formData.latitude,
          formData.longitude,
          1
        );
        setNearby((resp.data || resp || []).slice(0, 3));
      } catch (err) {
        // Silencieux : fonctionnalité bonus
        setNearby([]);
      }
    };
    fetchNearby();
  }, [formData.latitude, formData.longitude]);

  const validate = () => {
    const newErrors = {};
    if (!formData.categoryId) newErrors.categoryId = 'La catégorie est requise';
    if (!formData.title || formData.title.length < 5) newErrors.title = 'Le titre doit faire au moins 5 caractères';
    if (!formData.description || formData.description.length < 10) newErrors.description = 'La description doit faire au moins 10 caractères';
    if (!formData.address) newErrors.address = "L'adresse est requise";
    if (!formData.latitude || !formData.longitude) newErrors.address = "Veuillez préciser la localisation sur la carte";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { ...formData, is_anonymous: true };
      const resp = await reportService.createReport(payload);
      setCreatedReport(resp.data || resp);
      toast.success('Signalement envoyé. Merci pour votre civisme !');
      setStep(3);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi du signalement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialForm);
    setCreatedReport(null);
    setCategories([]);
    setStep(1);
    window.scrollTo(0, 0);
  };

  if (loading && step === 1 && municipalities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header sobre */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-deep flex items-center justify-center p-1.5">
              <img src="/icone.png" alt="Muno" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-deep">Muno</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero allégé */}
      <section className="bg-deep text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 lg:py-20">
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-4 max-w-3xl">
            Signalez un problème dans votre ville.
          </h1>
          <p className="text-white/80 max-w-2xl text-lg">
            En quelques secondes, anonymement ou avec un compte.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Choisissez votre municipalité
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {municipalities.map((muni) => (
                <button
                  key={muni.id}
                  onClick={() => handleMunicipalitySelect(muni)}
                  className="group bg-white rounded-card shadow-card hover:shadow-card-hover border border-transparent hover:border-primary-200 transition-all p-6 text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4 text-primary-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-gray-900">{muni.name}</p>
                  <p className="text-xs text-muted mt-1">{muni.code}</p>
                </button>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Clock, title: 'Rapide', desc: 'Moins d’une minute' },
                { icon: Lock, title: 'Anonyme', desc: 'Aucun compte requis' },
                { icon: ThumbsUp, title: 'Impact', desc: "L'appui citoyen priorise les cas" }
              ].map((f, i) => (
                <div key={i} className="bg-white rounded-card shadow-card p-5 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{f.title}</p>
                    <p className="text-sm text-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary-600 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Changer de ville
            </button>

            <Card className="p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Détails du signalement</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-3 py-2 rounded-lg border ${errors.categoryId ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none`}
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
                </div>

                <Input
                  label="Titre"
                  placeholder="Ex : Éclairage en panne, nid-de-poule..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={errors.title}
                  required
                />

                <Textarea
                  label="Description"
                  placeholder="Décrivez le problème avec le plus de précision possible..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  error={errors.description}
                  required
                />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <h3 className="font-medium text-gray-900">Localisation</h3>
                  </div>
                  <LocationPicker
                    address={formData.address}
                    setAddress={(addr) => setFormData(prev => ({ ...prev, address: addr }))}
                    latitude={formData.latitude}
                    setLatitude={(lat) => setFormData(prev => ({ ...prev, latitude: lat }))}
                    longitude={formData.longitude}
                    setLongitude={(lng) => setFormData(prev => ({ ...prev, longitude: lng }))}
                    error={errors.address}
                  />
                </div>

                {nearby.length > 0 && (
                  <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                    <p className="font-medium text-deep mb-2 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-support" />
                      Signalements similaires à proximité
                    </p>
                    <p className="text-xs text-muted mb-3">
                      Connectez-vous pour appuyer un signalement existant plutôt que d'en créer un doublon.
                    </p>
                    <ul className="space-y-2">
                      {nearby.map((r) => (
                        <li key={r.id} className="bg-white rounded p-3 text-sm flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{r.title}</p>
                            <p className="text-xs text-muted truncate">{r.address}</p>
                          </div>
                          <span className="text-xs text-muted flex items-center gap-1 ml-2">
                            <ThumbsUp className="w-3 h-3" />
                            {r.support_count ?? 0}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex gap-2 text-amber-800 text-sm">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Note :</strong> les photos ne sont acceptées que depuis un compte citoyen.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button variant="primary" type="submit" loading={submitting}>
                    Envoyer le signalement
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </Card>

            {/* Incitation compte */}
            <div className="mt-6 bg-white rounded-card shadow-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">Boostez votre signalement</p>
                <p className="text-sm text-muted">
                  Les signalements authentifiés reçoivent un bonus de <strong>+10</strong> en priorité.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-support text-white font-medium hover:bg-support-dark transition-colors text-sm"
              >
                Créer un compte
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {step === 3 && (
          <Card className="p-10 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-support/10 text-support rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre civisme !</h2>
            <p className="text-muted mb-6">
              Votre signalement a été enregistré et transmis aux services municipaux.
            </p>

            {createdReport?.id && (
              <div className="bg-surface rounded-lg p-4 mb-6 text-sm">
                <p className="text-muted">Numéro de référence</p>
                <p className="font-bold text-deep text-lg">#{createdReport.id}</p>
                <p className="text-xs text-muted mt-2">
                  Sans compte, le suivi n'est pas accessible. Créez un compte pour suivre et appuyer vos signalements.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login"
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Créer mon compte
              </Link>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Nouveau signalement
              </button>
            </div>
          </Card>
        )}
      </main>

      <footer className="py-8 text-center text-muted text-sm border-t border-gray-100 bg-white">
        <p>© 2026 Muno — Engagement citoyen & modernité municipale</p>
      </footer>
    </div>
  );
};

export default PublicReport;
