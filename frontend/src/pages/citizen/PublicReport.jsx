import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Send, 
  User, 
  Shield, 
  Info, 
  Building2, 
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Button, Card, Input, Textarea } from '../../components/common';
import { LocationPicker } from '../../components/citizen';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

const PublicReport = () => {
  const navigate = useNavigate();
  const [municipalities, setMunicipalities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Municipality, 2: Form

  const [formData, setFormData] = useState({
    municipalityId: '',
    categoryId: '',
    title: '',
    description: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchMunicipalities();
  }, []);

  const fetchMunicipalities = async () => {
    try {
      const resp = await reportService.getPublicMunicipalities();
      setMunicipalities(resp.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Impossible de charger les municipalités');
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

  const validate = () => {
    const newErrors = {};
    if (!formData.categoryId) newErrors.categoryId = 'La catégorie est requise';
    if (!formData.title || formData.title.length < 5) newErrors.title = 'Le titre doit faire au moins 5 caractères';
    if (!formData.description || formData.description.length < 10) newErrors.description = 'La description doit faire au moins 10 caractères';
    if (!formData.address) newErrors.address = 'L\'adresse est requise';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        is_anonymous: true
      };
      await reportService.createReport(payload);
      toast.success('Signalement envoyé anonymement ! Merci pour votre civisme.');
      
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi du signalement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && step === 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Dynamic Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1E3A5F] to-[#2F6FED] opacity-95"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm mb-6 backdrop-blur-md border border-white/20">
            <Shield className="w-4 h-4 text-green-400" />
            <span>Service Citoyen Ouvert à Tous</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Ma municipalité <span className="text-green-400">à l'écoute</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8 font-light">
            Signalez un dysfonctionnement dans votre ville en quelques secondes. Anonyme ou authentifié, votre voix compte.
          </p>

          <Link to="/login" className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-[#1E3A5F] font-semibold hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1">
            <User className="w-5 h-5" />
            Créer un compte pour un impact +10
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 -mt-10 pb-20">
        {step === 1 && (
          <div className="animate-in slide-in-from-bottom-5 duration-700">
            <Card className="p-8 border-none shadow-2xl bg-white/80 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-[#1E3A5F] mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Choisissez votre municipalité
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {municipalities.map((muni) => (
                  <button
                    key={muni.id}
                    onClick={() => handleMunicipalitySelect(muni)}
                    className="group relative h-40 rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary-500 transition-all bg-slate-50 flex flex-col items-center justify-center p-6 text-center shadow-sm hover:shadow-lg"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-primary-600">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-slate-800 text-lg">{muni.name}</span>
                    <span className="text-xs text-slate-500 mt-1">{muni.code}</span>
                  </button>
                ))}
              </div>
            </Card>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Clock, title: "Rapide", desc: "Moins de 1 minute pour signaler" },
                { icon: Shield, title: "Anonyme", desc: "Aucun compte obligatoire" },
                { icon: AlertCircle, title: "Suivi", desc: "Priorisé selon l'urgence" }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-50 text-primary-600">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{feature.title}</h3>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right-5 duration-500">
            {/* Account Incentive Banner */}
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[#1E3A5F] to-[#2F6FED] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-white/20 backdrop-blur-md">
                  <User className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Boostez votre signalement !</h3>
                  <p className="text-blue-100 text-sm opacity-90">
                    Les signalements authentifiés reçoivent un bonus de **+10** en priorité.
                  </p>
                </div>
              </div>
              <Link to="/login" className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-lg whitespace-nowrap">
                M'inscrire maintenant
              </Link>
            </div>

            <Card className="p-8 shadow-2xl border-none">
              <div className="flex items-center justify-between mb-8 border-b pb-6">
                <h2 className="text-2xl font-bold text-[#1E3A5F]">Détails du Signalement</h2>
                <button 
                  onClick={() => setStep(1)}
                  className="text-sm text-slate-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Changer de ville
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Catégorie <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full p-4 rounded-xl border ${errors.categoryId ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-slate-50`}
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

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Titre de votre signalement <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Ex: Éclairage en panne, Nid de poule..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      error={errors.title}
                      className="bg-slate-50 p-4 rounded-xl border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description détaillée <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Fournissez le plus de précisions possibles sur le problème..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    error={errors.description}
                    className="bg-slate-50 p-4 rounded-xl border-slate-200"
                  />
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    <h3 className="font-bold text-slate-800">Localisation</h3>
                  </div>
                  <LocationPicker
                    address={formData.address}
                    setAddress={(addr) => setFormData({ ...formData, address: addr })}
                    latitude={formData.latitude}
                    setLatitude={(lat) => setFormData({ ...formData, latitude: lat })}
                    longitude={formData.longitude}
                    setLongitude={(lng) => setFormData({ ...formData, longitude: lng })}
                    error={errors.address}
                  />
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 text-amber-800 text-sm">
                  <Lock className="w-5 h-5 flex-shrink-0" />
                  <p>
                    <span className="font-bold">Note sur les photos :</span> Pour des raisons de sécurité, les photos ne sont acceptées que de la part des citoyens connectés.
                  </p>
                </div>

                <div className="pt-6 flex justify-end">
                  <Button
                    variant="primary"
                    type="submit"
                    className="px-10 py-4 h-auto text-lg shadow-xl shadow-primary-200 hover:scale-105 transition-transform"
                    disabled={submitting}
                  >
                    {submitting ? 'Envoi en cours...' : 'Envoyer le signalement'}
                    <Send className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in zoom-in-95 duration-500">
            <Card className="p-16 text-center border-none shadow-2xl bg-white">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Merci pour votre civisme !</h2>
              <p className="text-slate-600 text-lg mb-10 max-w-md mx-auto">
                Votre signalement a bien été reçu. Nos services municipaux ont été notifiés et interviendront dans les plus brefs délais.
              </p>
              
              <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 mb-10">
                <h3 className="text-[#1E3A5F] font-bold mb-4">Envie d'en faire plus ?</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Créez un compte pour suivre l'avancement de vos signalements et participer activement à l'amélioration de votre commune.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/login" className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all">
                    Créer mon compte
                  </Link>
                  <button 
                    onClick={() => {
                        setFormData({ municipalityId: '', categoryId: '', title: '', description: '', address: '', latitude: '', longitude: '' });
                        setStep(1);
                    }}
                    className="px-8 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Nouveau signalement
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <footer className="py-10 text-center text-slate-400 text-sm">
        <p>© 2026 Muno - Engagement Citoyen & Modernité Municipale</p>
      </footer>
    </div>
  );
};

export default PublicReport;
