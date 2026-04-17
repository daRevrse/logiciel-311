import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Button, Card, Input, Textarea, PhotoUploader } from '../../components/common';
import { CategorySelector, LocationPicker } from '../../components/citizen';
import { useReports } from '../../hooks/useReports';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

/**
 * Page de création de signalement avec formulaire multi-étapes
 */
const CreateReport = () => {
  const navigate = useNavigate();
  const { createReport } = useReports({}, false);

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Données du formulaire
  const [formData, setFormData] = useState({
    categoryId: null,
    category: null,
    title: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    photos: []
  });

  // Erreurs de validation
  const [errors, setErrors] = useState({});

  const totalSteps = 5;

  const stepLabels = ['Catégorie', 'Description', 'Localisation', 'Photos', 'Récapitulatif'];

  const categoryChips = ['Voirie', 'Éclairage', 'Eau', 'Déchets', 'Autre'];

  useEffect(() => {
    loadCategories();
    // Charger brouillon depuis localStorage
    const draft = localStorage.getItem('reportDraft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        setFormData(draftData);
        toast.success('Brouillon restauré');
      } catch (error) {
        console.error('Erreur chargement brouillon:', error);
      }
    }
  }, []);

  // Sauvegarder en brouillon à chaque modification
  useEffect(() => {
    if (formData.category || formData.title || formData.description) {
      localStorage.setItem('reportDraft', JSON.stringify(formData));
    }
  }, [formData]);

  const loadCategories = async () => {
    try {
      const response = await reportService.getCategories();
      setCategories(response.data || response);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      toast.error('Erreur lors du chargement des catégories');
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.category) {
          newErrors.category = 'Veuillez sélectionner une catégorie';
        }
        break;

      case 2:
        if (!formData.title || formData.title.trim().length < 5) {
          newErrors.title = 'Le titre doit contenir au moins 5 caractères';
        }
        if (!formData.description || formData.description.trim().length < 10) {
          newErrors.description = 'La description doit contenir au moins 10 caractères';
        }
        break;

      case 3:
        if (!formData.address || formData.address.trim().length < 3) {
          newErrors.address = 'Veuillez saisir une adresse';
        }
        break;

      case 4:
        // Photos optionnelles, pas d'erreur
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep - 1)) {
      toast.error('Veuillez corriger les erreurs avant de soumettre');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Créer le signalement
      const reportData = {
        categoryId: formData.category.id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      console.log('📤 Données envoyées au backend:', reportData);

      const response = await reportService.createReport(reportData);
      const reportId = response.data?.id || response.id;

      // 2. Upload des photos si présentes
      if (formData.photos.length > 0 && reportId) {
        for (const photo of formData.photos) {
          const photoFormData = new FormData();
          photoFormData.append('photo', photo.file);

          try {
            // Appel direct à l'API car uploadPhotos attend un tableau
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL}/reports/${reportId}/photos`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: photoFormData
            });
          } catch (photoError) {
            console.error('Erreur upload photo:', photoError);
            // Continuer même si une photo échoue
          }
        }
      }

      // 3. Supprimer le brouillon
      localStorage.removeItem('reportDraft');

      // 4. Rediriger
      toast.success('Signalement créé avec succès !');
      navigate(`/reports/${reportId}`);

    } catch (error) {
      console.error('❌ Erreur création signalement:', error);
      console.error('📋 Détails erreur:', error.response?.data);

      const errorData = error.response?.data;
      let errorMessage = 'Erreur lors de la création du signalement';

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Afficher les erreurs de validation
        errorMessage = errorData.errors.map(err => err.msg).join(', ');
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center mb-8 px-2">
      {stepLabels.map((label, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              idx < currentStep - 1 ? 'bg-support text-white' :
              idx === currentStep - 1 ? 'bg-primary-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {idx < currentStep - 1 ? '✓' : idx + 1}
            </div>
            <span className="text-xs mt-1 text-muted hidden sm:block text-center w-16 leading-tight">{label}</span>
          </div>
          {idx < stepLabels.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 ${idx < currentStep - 1 ? 'bg-support' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Catégorie du problème
            </h2>
            <p className="text-gray-600 mb-6">
              Sélectionnez la catégorie qui correspond le mieux à votre signalement
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {categoryChips.map(cat => (
                <button key={cat} type="button"
                  onClick={() => {
                    const matched = categories.find(c => c.name === cat);
                    if (matched) {
                      setFormData(p => ({ ...p, category: matched, categoryId: matched.id }));
                      setErrors(e => ({ ...e, category: null }));
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    formData.category?.name === cat
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>

            <CategorySelector
              categories={categories}
              selectedCategory={formData.category}
              onChange={(category) => {
                setFormData({ ...formData, category, categoryId: category.id });
                setErrors({ ...errors, category: null });
              }}
              error={errors.category}
            />
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Description du problème
            </h2>
            <p className="text-gray-600 mb-6">
              Décrivez clairement le problème rencontré
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    setErrors({ ...errors, title: null });
                  }}
                  placeholder="Ex: Fuite d'eau importante sur l'avenue"
                  error={errors.title}
                  maxLength={255}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/255 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description détaillée <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    setErrors({ ...errors, description: null });
                  }}
                  placeholder="Décrivez en détail le problème: localisation précise, gravité, depuis quand, etc."
                  rows={6}
                  error={errors.description}
                  maxLength={5000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/5000 caractères
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Localisation
            </h2>
            <p className="text-gray-600 mb-6">
              Indiquez l'emplacement exact du problème
            </p>

            <LocationPicker
              address={formData.address}
              setAddress={(address) => setFormData(prev => ({ ...prev, address }))}
              latitude={formData.latitude}
              setLatitude={(latitude) => setFormData(prev => ({ ...prev, latitude }))}
              longitude={formData.longitude}
              setLongitude={(longitude) => setFormData(prev => ({ ...prev, longitude }))}
              error={errors.address}
            />
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Photos (optionnel)
            </h2>
            <p className="text-gray-600 mb-6">
              Ajoutez des photos pour illustrer le problème (max 5 photos)
            </p>

            <PhotoUploader
              photos={formData.photos}
              onChange={(photos) => setFormData({ ...formData, photos })}
              maxPhotos={5}
              maxSizeInMB={5}
            />
          </div>
        );

      case 5:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Récapitulatif
            </h2>
            <p className="text-gray-600 mb-6">
              Vérifiez les informations avant de soumettre
            </p>

            <div className="space-y-4">
              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Catégorie</h3>
                <p className="text-gray-700">{formData.category?.name}</p>
              </Card>

              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Titre</h3>
                <p className="text-gray-700">{formData.title}</p>
              </Card>

              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
              </Card>

              <Card>
                <h3 className="font-semibold text-gray-900 mb-3">Localisation</h3>
                <p className="text-gray-700">{formData.address}</p>
                {formData.latitude && formData.longitude && (
                  <p className="text-sm text-gray-500 mt-1">
                    Coordonnées: {formData.latitude}, {formData.longitude}
                  </p>
                )}
              </Card>

              {formData.photos.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Photos ({formData.photos.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {formData.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.preview}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">
            Nouveau signalement
          </h1>
          <p className="text-gray-600 mt-2">
            Étape {currentStep} sur {totalSteps}
          </p>
        </div>

        {/* Indicateur d'étapes */}
        {renderStepIndicator()}

        {/* Contenu de l'étape */}
        <Card className="mb-8">
          {renderStep()}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          {currentStep < totalSteps ? (
            <Button
              variant="primary"
              fullWidth
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi...' : 'Soumettre le signalement'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateReport;
