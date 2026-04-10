// src/components/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { referenceAPI, contractTypeAPI } from '../services/api';
import Badge from './common/Badge';
import Modal from './common/Modal';
import {
  Settings,
  Shield,
  Clock,
  FileText,
  Award,
  Calendar,
  Users,
  Bell,
  Database,
  RefreshCw,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    shiftTypes: [],
    absenceTypes: [],
    contractTypes: [],
    certifications: [],
  });

  // Modal pour l'édition des types
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'contractType', etc.
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shiftTypesRes, absenceTypesRes, contractTypesRes, certificationsRes] = await Promise.all([
        referenceAPI.getShiftTypes(),
        referenceAPI.getAbsenceTypes(),
        referenceAPI.getContractTypes(),
        referenceAPI.getCertifications(),
      ]);

      setData({
        shiftTypes: shiftTypesRes.data,
        absenceTypes: absenceTypesRes.data,
        contractTypes: contractTypesRes.data,
        certifications: certificationsRes.data,
      });
    } catch (err) {
      console.error('Erreur chargement paramètres:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'contractType') {
      setFormData(item || {
        name: '',
        max_hours_per_week: 35,
        leave_days_per_year: 25,
        night_shift_allowed: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === 'contractType') {
        if (editingItem) {
          await contractTypeAPI.update(editingItem.id, formData);
        } else {
          await contractTypeAPI.create(formData);
        }
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContractType = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce type de contrat ?')) return;
    try {
      await contractTypeAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Erreur lors de la suppression. Ce type est peut-être utilisé par des contrats existants.');
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'shifts', label: 'Types de garde', icon: Clock },
    { id: 'absences', label: 'Types d\'absence', icon: Calendar },
    { id: 'contracts', label: 'Types de contrat', icon: FileText },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="bg-dark-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-400" />
                Informations système
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-dark-700 rounded-lg">
                  <p className="text-sm text-muted">Version</p>
                  <p className="text-main font-medium">MedPlan v1.0.0</p>
                </div>
                <div className="p-4 bg-dark-700 rounded-lg">
                  <p className="text-sm text-muted">Environnement</p>
                  <p className="text-main font-medium">Production</p>
                </div>
                <div className="p-4 bg-dark-700 rounded-lg">
                  <p className="text-sm text-muted">Base de données</p>
                  <p className="text-main font-medium">PostgreSQL</p>
                </div>
                <div className="p-4 bg-dark-700 rounded-lg">
                  <p className="text-sm text-muted">API Backend</p>
                  <p className="text-main font-medium">Django REST Framework</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Règles métier actives
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-main">Vérification des chevauchements horaires</span>
                  </div>
                  <Badge variant="success" size="sm">Actif</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-main">Vérification des certifications</span>
                  </div>
                  <Badge variant="success" size="sm">Actif</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-main">Repos minimum après garde de nuit</span>
                  </div>
                  <Badge variant="success" size="sm">Actif</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-main">Quota heures hebdomadaires</span>
                  </div>
                  <Badge variant="success" size="sm">Actif</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-main">Blocage si absence déclarée</span>
                  </div>
                  <Badge variant="success" size="sm">Actif</Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case 'shifts':
        return (
          <div className="bg-dark-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Types de garde ({data.shiftTypes.length})
            </h3>
            {data.shiftTypes.length > 0 ? (
              <div className="space-y-3">
                {data.shiftTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium text-main">{type.name}</p>
                        <p className="text-sm text-muted">Durée : {type.duration_hours}h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {type.requires_rest_after && (
                        <Badge variant="warning" size="sm">Repos requis</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-8">Aucun type de garde configuré</p>
            )}
          </div>
        );

      case 'absences':
        return (
          <div className="bg-dark-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Types d'absence ({data.absenceTypes.length})
            </h3>
            {data.absenceTypes.length > 0 ? (
              <div className="space-y-3">
                {data.absenceTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-main">{type.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {type.impacts_quota && (
                        <Badge variant="info" size="sm">Impact quota</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-8">Aucun type d'absence configuré</p>
            )}
          </div>
        );

      case 'contracts':
        return (
          <div className="bg-dark-600 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-main flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Types de contrat ({data.contractTypes.length})
              </h3>
              <button 
                onClick={() => handleOpenModal('contractType')}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-main rounded-lg text-sm hover:bg-emerald-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouveau type
              </button>
            </div>
            
            {data.contractTypes.length > 0 ? (
              <div className="space-y-3">
                {data.contractTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-main">{type.name}</p>
                        <p className="text-sm text-muted">
                          Max {type.max_hours_per_week}h/semaine • {type.leave_days_per_year} jours congés/an
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {type.night_shift_allowed ? (
                          <Badge variant="success" size="sm">Nuit autorisée</Badge>
                        ) : (
                          <Badge variant="danger" size="sm">Pas de nuit</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 border-l border-dark-500 pl-3 ml-1">
                        <button 
                          onClick={() => handleOpenModal('contractType', type)}
                          className="p-1.5 text-muted hover:text-main hover:bg-dark-500 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteContractType(type.id)}
                          className="p-1.5 text-muted hover:text-rose-400 hover:bg-dark-500 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-8">Aucun type de contrat configuré</p>
            )}
          </div>
        );

      case 'certifications':
        return (
          <div className="bg-dark-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-400" />
              Certifications ({data.certifications.length})
            </h3>
            {data.certifications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center gap-3 p-4 bg-dark-700 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-main">{cert.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-8">Aucune certification configurée</p>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="bg-dark-600 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-400" />
              Préférences de notification
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div>
                  <p className="font-medium text-main">Alertes sous-effectif</p>
                  <p className="text-sm text-muted">Recevoir une alerte quand un poste manque de personnel</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div>
                  <p className="font-medium text-main">Nouvelles absences</p>
                  <p className="text-sm text-muted">Notification lors d'une déclaration d'absence</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div>
                  <p className="font-medium text-main">Certifications expirées</p>
                  <p className="text-sm text-muted">Alerte avant expiration d'une certification</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div>
                  <p className="font-medium text-main">Rappels de planning</p>
                  <p className="text-sm text-muted">Rappel quotidien des gardes du jour</p>
                </div>
                <div className="w-12 h-6 bg-dark-500 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderModal = () => (
    <Modal isOpen={showModal} onClose={handleCloseModal}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-main mb-6">
          {editingItem ? 'Modifier le type de contrat' : 'Nouveau type de contrat'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Nom du type *</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main"
              placeholder="CDI, CDD, Intérim..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Heures max / semaine</label>
              <input
                type="number"
                name="max_hours_per_week"
                value={formData.max_hours_per_week || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Jours congés / an</label>
              <input
                type="number"
                name="leave_days_per_year"
                value={formData.leave_days_per_year || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="night_shift_allowed"
              id="night_shift_allowed"
              checked={formData.night_shift_allowed || false}
              onChange={handleInputChange}
              className="w-4 h-4 rounded border-dark-400 bg-dark-600 text-primary-500"
            />
            <label htmlFor="night_shift_allowed" className="text-main">
              Autoriser le travail de nuit
            </label>
          </div>
          
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-primary-500 text-main rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2 bg-dark-600 text-main rounded-lg"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-muted">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-main flex items-center gap-3">
            <Settings className="w-8 h-8 text-muted" />
            Paramètres
          </h1>
          <p className="text-muted mt-1">Configuration du système et données de référence</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-dark-600 text-main rounded-lg hover:bg-dark-500 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Tabs et contenu */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-dark-700 rounded-xl border border-dark-500 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-muted hover:bg-dark-600 hover:text-main'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1">{renderTabContent()}</div>
      </div>
      
      {renderModal()}
    </div>
  );
}

export default SettingsPage;
