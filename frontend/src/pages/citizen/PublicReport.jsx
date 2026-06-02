import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  ThumbsUp,
  Users,
  ShieldCheck,
  Zap,
  Globe,
  Map as MapIcon,
  Search,
  CheckCircle
} from 'lucide-react';
import { Button, Card, Input, Textarea, HeroBackground, ImageWithFallback } from '../../components/common';
import { LocationPicker } from '../../components/citizen';
import { IMAGES } from '../../config/images';
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
  const [params] = useSearchParams();
  const [municipalities, setMunicipalities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: accueil/choix municipalite, 2: formulaire, 3: succès
  const [createdReport, setCreatedReport] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const muniResp = await reportService.getPublicMunicipalities();
      setMunicipalities(muniResp.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erreur de chargement');
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

  // Pré-sélection de la mairie si on arrive depuis sa page publique (?municipality=slug)
  useEffect(() => {
    const slug = params.get('municipality');
    if (!slug || step !== 1 || municipalities.length === 0) return;
    const match = municipalities.find((m) => m.slug === slug);
    if (match) handleMunicipalitySelect(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalities]);

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
      toast.success('Signalement envoyé. Merci !');
      setStep(3);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialForm);
    setCreatedReport(null);
    setStep(1);
    window.scrollTo(0, 0);
  };

  if (loading && step === 1 && municipalities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-deep"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header Institutionnel */}
      <nav className="bg-navy-deep border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-lg shadow-turquoise/20">
                <img src="/logo_muno.png" alt="Muno" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight leading-none">Muno</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-turquoise font-bold mt-1">Signalement citoyen</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/login" className="text-sm font-medium text-white/80 hover:text-turquoise transition-colors">Suivre mes signalements</Link>
              <Link
                to="/admin/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all border border-white/10"
              >
                <LogIn className="w-4 h-4" />
                Espace Mairie
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {step === 1 && (
          <>
            {/* Hero Section Restructuré */}
            <section className="relative bg-navy-deep overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
              <HeroBackground image={IMAGES.heroCity} opacity={0.3} />
              {/* Cercles décoratifs */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-turquoise/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-turquoise/10 rounded-full blur-3xl"></div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-8 animate-in slide-in-from-left-8 duration-700">
                    <div>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-turquoise/20 text-turquoise text-xs font-bold uppercase tracking-wider mb-6">
                        <Zap className="w-3 h-3" />
                        Engagement Citoyen 2.0
                      </span>
                      <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                        Votre ville vous <span className="text-turquoise italic">écoute.</span><br /> 
                        Agissons ensemble.
                      </h1>
                      <p className="mt-6 text-xl text-white/70 max-w-xl leading-relaxed">
                        Signalez les dysfonctionnements urbains en 60 secondes. Une plateforme souveraine pour des municipalités plus réactives et un cadre de vie amélioré.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => {
                          const element = document.getElementById('municipality-grid');
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-turquoise text-navy-deep font-bold text-lg hover:bg-turquoise/90 transition-all transform hover:-translate-y-1 shadow-xl shadow-turquoise/20"
                      >
                        Faire un signalement
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </button>
                      <Link 
                        to="/login"
                        className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-all border border-white/20 backdrop-blur-sm"
                      >
                        Suivre mes cas
                      </Link>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-sm text-white/60">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-turquoise" /> Localisation précise
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-turquoise" /> Suivi du traitement
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-turquoise" /> Appui citoyen
                      </span>
                    </div>
                  </div>

                  {/* Carte flottante (Visualisation) */}
                  <div className="relative hidden lg:block animate-in zoom-in-95 duration-1000 delay-200">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-navy-deep/40 to-transparent pointer-events-none"></div>
                      
                      {/* Fake Map Content */}
                      <div className="aspect-[4/3] bg-navy-deep/50 rounded-2xl relative">
                        {/* Map Pins */}
                        <div className="absolute top-1/4 left-1/3 animate-bounce">
                          <MapPin className="w-8 h-8 text-turquoise fill-turquoise/20" />
                        </div>
                        <div className="absolute top-1/2 left-2/3 animate-bounce delay-150">
                          <MapPin className="w-6 h-6 text-white/50" />
                        </div>
                        <div className="absolute bottom-1/3 left-1/4 animate-bounce delay-300">
                          <MapPin className="w-6 h-6 text-white/30" />
                        </div>

                        {/* Légende décorative */}
                        <div className="absolute bottom-6 left-6 right-6">
                          <div className="bg-white/90 backdrop-blur p-4 rounded-xl border border-white">
                            <p className="text-sm font-bold text-navy-deep">Signalez en quelques secondes</p>
                            <p className="text-xs text-gray-500 mt-1">Placez le problème sur la carte, décrivez-le, et suivez son traitement par votre mairie.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Grille de Municipalités */}
            <section id="municipality-grid" className="py-24 bg-gray-50/50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 space-y-4">
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-navy-deep tracking-tight">Où voulez-vous agir ?</h2>
                  <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
                    Sélectionnez votre municipalité pour commencer un signalement. Nous étendons notre réseau chaque semaine.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {municipalities.map((muni) => (
                    <div
                      key={muni.id}
                      className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:border-turquoise/30 transition-all relative overflow-hidden flex flex-col"
                    >
                      {/* Bannière photo */}
                      <div className="relative h-32">
                        <ImageWithFallback
                          src={muni.logo_url || IMAGES.municipalityDefault}
                          alt={muni.name}
                          className="w-full h-full"
                          imgClassName="transition-transform duration-700 group-hover:scale-110"
                        >
                          <Building2 className="w-10 h-10 text-white/70" />
                        </ImageWithFallback>
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/70 via-navy-deep/10 to-transparent" />
                        {muni.name.includes('Lomé') && (
                          <div className="absolute top-0 right-0 bg-turquoise text-navy-deep text-[10px] px-4 py-1 font-black uppercase tracking-widest rounded-bl-xl">
                            Disponible
                          </div>
                        )}
                      </div>

                      <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-2xl font-bold text-navy-deep mb-2">{muni.name}</h3>
                      <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        Signalez les problèmes de voirie, éclairage et propreté directement aux services de la ville de {muni.name}.
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <button
                          onClick={() => handleMunicipalitySelect(muni)}
                          className="px-6 py-3 bg-navy-deep text-white rounded-xl font-bold text-sm hover:bg-navy-deep/90 transition-all flex items-center gap-2"
                        >
                          Signaler ici
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        {muni.slug && (
                          <Link to={`/m/${muni.slug}`} className="text-xs font-bold text-navy-deep/60 hover:text-navy-deep underline underline-offset-4 tracking-tight">
                            Page Mairie
                          </Link>
                        )}
                      </div>
                      </div>
                    </div>
                  ))}

                  {/* Carte Bientôt */}
                  <div className="group bg-navy-deep/5 rounded-3xl p-8 border-2 border-dashed border-navy-deep/10 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-navy-deep shadow-sm">
                      <Globe className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-navy-deep">Votre ville ?</h3>
                      <p className="text-sm text-gray-500 max-w-[200px] mt-2 font-medium">Bientôt disponible dans toutes les préfectures du Togo.</p>
                    </div>
                    <Link to="/login" className="text-xs font-black uppercase tracking-widest text-navy-deep hover:text-turquoise transition-colors">
                      Proposer ma mairie
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {step === 2 && (
          <div className="max-w-4xl mx-auto px-4 py-16">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 text-sm font-bold text-navy-deep hover:text-turquoise mb-8 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour au portail
            </button>

            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-navy-deep p-8 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-turquoise/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <h2 className="text-3xl font-extrabold tracking-tight">Soumettre un signalement</h2>
                <p className="text-white/60 mt-1">Les services municipaux traiteront votre demande avec priorité.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-sm font-black text-navy-deep uppercase tracking-widest">
                      Catégorie <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className={`w-full px-4 py-4 rounded-xl bg-gray-50 border ${errors.categoryId ? 'border-rose-500' : 'border-gray-200'} focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all font-medium`}
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">Que voulez-vous signaler ?</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-rose-500 text-xs font-bold">{errors.categoryId}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-black text-navy-deep uppercase tracking-widest">
                      Titre bref <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : Panne éclairage rue X"
                      className={`w-full px-4 py-4 rounded-xl bg-gray-50 border ${errors.title ? 'border-rose-500' : 'border-gray-200'} focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all font-medium`}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    {errors.title && <p className="text-rose-500 text-xs font-bold">{errors.title}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-black text-navy-deep uppercase tracking-widest">
                    Description détaillée <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Apportez plus de précisions pour aider les équipes techniques..."
                    className={`w-full px-4 py-4 rounded-xl bg-gray-50 border ${errors.description ? 'border-rose-500' : 'border-gray-200'} focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none transition-all font-medium`}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  {errors.description && <p className="text-rose-500 text-xs font-bold">{errors.description}</p>}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-turquoise" />
                    <h3 className="font-bold text-navy-deep text-lg">Localisation précise</h3>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
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
                </div>

                {nearby.length > 0 && (
                  <div className="bg-navy-deep/5 rounded-2xl p-6 border border-navy-deep/10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-turquoise/20 text-navy-deep">
                        <Search className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-navy-deep">Cas similaires à proximité</h3>
                    </div>
                    <div className="space-y-3">
                      {nearby.map((r) => (
                        <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                          <div className="min-w-0 pr-4">
                            <p className="font-bold text-navy-deep text-sm truncate">{r.title}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">{r.address}</p>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-xs font-bold text-turquoise bg-turquoise/10 px-2 py-1 rounded-md flex items-center gap-1.5">
                              <ThumbsUp className="w-3 h-3" />
                              {r.support_count ?? 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                  <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100 max-w-sm">
                    <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                      Compte invité : votre signalement est anonyme et ne peut pas inclure de photos pour des raisons de sécurité.
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-navy-deep text-white font-black text-lg hover:bg-navy-deep/90 transition-all shadow-xl shadow-navy-deep/20 disabled:opacity-50"
                  >
                    Envoyer le signalement
                    <Send className="ml-3 w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-2xl mx-auto px-4 py-24 text-center">
            <div className="w-24 h-24 bg-turquoise/10 text-turquoise rounded-full flex items-center justify-center mx-auto mb-10 animate-in zoom-in-95">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-navy-deep mb-6 tracking-tight">Héritage citoyen !</h2>
            <p className="text-xl text-gray-500 mb-12 max-w-lg mx-auto">
              Votre signalement a été transmis avec succès. Ensemble, nous bâtissons des villes plus modernes.
            </p>

            <div className="bg-navy-deep rounded-3xl p-8 mb-12 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-2">Référence de suivi</p>
              <p className="text-4xl font-black text-turquoise tracking-wider mb-6">#{createdReport?.id || '311-TG-82'}</p>
              <div className="bg-white/10 p-4 rounded-xl text-xs text-white/80 leading-relaxed font-medium">
                Notez ce numéro. Pour recevoir des mises à jour en direct et ajouter des photos, créez votre compte citoyen maintenant.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-turquoise text-navy-deep rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Créer mon compte
              </Link>
              <button
                onClick={handleReset}
                className="px-8 py-4 bg-white text-navy-deep border-2 border-navy-deep/10 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Nouveau signalement
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Institutionnel */}
      <footer className="bg-navy-deep text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-white/10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1">
                  <img src="/logo_muno.png" alt="Muno" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-bold tracking-tight">Muno</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                La plateforme de signalement citoyen au service de l'action communale au Togo.
              </p>
              <div className="flex gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-turquoise/20 transition-colors cursor-pointer">
                    <div className="w-4 h-4 bg-white/20 rounded-sm"></div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-turquoise">Municipalité</h4>
              <ul className="space-y-4 text-sm text-white/60">
                <li><Link to="/admin/login" className="hover:text-white transition-colors">Espace Mairie</Link></li>
                <li><Link to="/admin/login" className="hover:text-white transition-colors">Portail administrateur</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-turquoise">Ressources</h4>
              <ul className="space-y-4 text-sm text-white/40">
                <li>Guide du citoyen</li>
                <li>Questions fréquentes</li>
                <li>Support technique</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-turquoise">Légal</h4>
              <ul className="space-y-4 text-sm text-white/40">
                <li>Mentions légales</li>
                <li>Protection des données</li>
                <li>Conditions d'utilisation</li>
              </ul>
            </div>
          </div>

          <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-white/40 text-xs font-medium tracking-wide">
              © 2026 MUNO — TOUS DROITS RÉSERVÉS.
            </p>
            <div className="flex items-center gap-8">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Modernité</span>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Réactivité</span>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Civisme</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicReport;
