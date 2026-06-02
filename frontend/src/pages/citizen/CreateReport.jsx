import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Camera, MapPin, ClipboardList, Zap } from 'lucide-react';
import { Input, Textarea, PhotoUploader, HeroBackground } from '../../components/common';
import { CategorySelector, LocationPicker } from '../../components/citizen';
import { IMAGES } from '../../config/images';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

/**
 * Création d'un signalement — formulaire unique, simple & mobile-first.
 */
const CreateReport = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    category: null,
    title: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    photos: []
  });

  useEffect(() => {
    loadCategories();
    const draft = localStorage.getItem('reportDraft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // Les fichiers photos ne sont pas persistés : on garde toujours un tableau
        setFormData((prev) => ({ ...prev, ...parsed, photos: [] }));
        toast.success('Brouillon restauré');
      } catch (error) {
        console.error('Erreur draft:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (formData.category || formData.title || formData.description) {
      // On ne persiste pas les fichiers photos (non sérialisables proprement)
      const { photos, ...serializable } = formData;
      localStorage.setItem('reportDraft', JSON.stringify(serializable));
    }
  }, [formData]);

  const loadCategories = async () => {
    try {
      const response = await reportService.getCategories();
      setCategories(response.data || response);
    } catch (error) {
      console.error('Erreur catégories:', error);
    }
  };

  const validate = () => {
    const e = {};
    if (!formData.category) e.category = 'Choisissez une catégorie';
    if (!formData.title || formData.title.trim().length < 5) e.title = 'Titre trop court (min 5)';
    if (!formData.description || formData.description.trim().length < 10) e.description = 'Description trop courte (min 10)';
    if (!formData.address) e.address = 'La localisation est obligatoire';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error('Veuillez compléter les champs manquants');
      return false;
    }
    return true;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const response = await reportService.createReport({
        categoryId: formData.category.id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      });
      const reportId = response.data?.id || response.id;

      if (formData.photos.length > 0 && reportId) {
        const token = localStorage.getItem('token');
        for (const photo of formData.photos) {
          const fd = new FormData();
          fd.append('photo', photo.file);
          await fetch(`${import.meta.env.VITE_API_URL}/reports/${reportId}/photos`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd
          });
        }
      }

      localStorage.removeItem('reportDraft');
      toast.success('Signalement transmis !');
      navigate(`/reports/${reportId}`);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Échec de la transmission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionTitle = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg bg-turquoise/10 flex items-center justify-center text-turquoise">
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="font-bold text-navy-deep">{children}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* En-tête compact */}
      <div className="relative overflow-hidden bg-navy-deep text-white">
        <HeroBackground image={IMAGES.heroCivic} opacity={0.25} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-5 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-semibold mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight">Nouveau signalement</h1>
          <p className="text-white/60 text-sm mt-1">Décrivez le problème, nous le transmettons à votre mairie.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {/* Catégorie */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={ClipboardList}>Catégorie</SectionTitle>
          <CategorySelector
            categories={categories}
            selectedCategory={formData.category}
            onChange={(category) => {
              setFormData({ ...formData, category });
              setErrors({ ...errors, category: null });
            }}
            error={errors.category}
          />
        </section>

        {/* Détails */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={Zap}>Détails</SectionTitle>
          <Input
            label="Titre"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex : Lampadaire en panne"
            error={errors.title}
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Décrivez précisément ce que vous observez..."
            rows={5}
            error={errors.description}
          />
        </section>

        {/* Localisation */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={MapPin}>Localisation</SectionTitle>
          <LocationPicker
            address={formData.address}
            setAddress={(address) => setFormData((prev) => ({ ...prev, address }))}
            latitude={formData.latitude}
            setLatitude={(latitude) => setFormData((prev) => ({ ...prev, latitude }))}
            longitude={formData.longitude}
            setLongitude={(longitude) => setFormData((prev) => ({ ...prev, longitude }))}
            error={errors.address}
          />
        </section>

        {/* Photos */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={Camera}>Photos <span className="font-normal text-gray-400 text-sm">(optionnel)</span></SectionTitle>
          <PhotoUploader
            photos={formData.photos}
            onChange={(photos) => setFormData({ ...formData, photos })}
            maxPhotos={5}
          />
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-turquoise text-navy-deep font-bold shadow-lg shadow-turquoise/20 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {isSubmitting ? 'Transmission…' : <>Envoyer le signalement <Send className="w-5 h-5" /></>}
        </button>
      </form>
    </div>
  );
};

export default CreateReport;
