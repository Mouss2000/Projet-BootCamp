// src/components/ServiceList.js
import React, { useState, useEffect, useCallback } from 'react';
import { serviceAPI, referenceAPI, staffAPI } from '../services/api';
import Badge from './common/Badge';
import Modal from './common/Modal';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  Bed,
  RefreshCw,
  MoreVertical,
  X,
  Check,
  AlertCircle,
  Activity,
  MapPin,
  ChevronRight,
} from 'lucide-react';

function ServiceList() {
  // États principaux
  const [services, setServices] = useState([]);
  const [careUnits, setCareUnits] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Recherche
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // view, create, edit
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    bed_capacity: 0,
    criticality_level: 1,
    manager: '',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Menu contextuel
  const [openMenuId, setOpenMenuId] = useState(null);

  // Charger les données
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [servicesRes, careUnitsRes, staffRes] = await Promise.all([
        serviceAPI.getAll(),
        referenceAPI.getCareUnits(),
        staffAPI.getAll({ is_active: true }),
      ]);

      setServices(servicesRes.data);
      setCareUnits(careUnitsRes.data);
      setStaff(staffRes.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des services');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fermer le menu contextuel
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filtrer les services
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Obtenir les unités d'un service
  const getServiceCareUnits = (serviceId) => {
    return careUnits.filter((cu) => cu.service === serviceId || cu.service_id === serviceId);
  };

  // Stats
  const stats = {
    total: services.length,
    totalBeds: services.reduce((acc, s) => acc + (s.bed_capacity || 0), 0),
    totalUnits: careUnits.length,
  };

  // Ouvrir modal de visualisation
  const openViewModal = (service) => {
    setSelectedService(service);
    setModalMode('view');
    setShowModal(true);
    setOpenMenuId(null);
  };

  // Ouvrir modal de création
  const openCreateModal = () => {
    setFormData({
      name: '',
      bed_capacity: 0,
      criticality_level: 1,
      manager: '',
    });
    setModalMode('create');
    setFormError(null);
    setShowModal(true);
  };

  // Ouvrir modal d'édition
  const openEditModal = (service) => {
    setFormData({
      name: service.name,
      bed_capacity: service.bed_capacity,
      criticality_level: service.criticality_level,
      manager: service.manager || '',
    });
    setSelectedService(service);
    setModalMode('edit');
    setFormError(null);
    setShowModal(true);
    setOpenMenuId(null);
  };

  // Fermer modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
    setFormData({ name: '', bed_capacity: 0, criticality_level: 1, manager: '' });
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const submissionData = {
      ...formData,
      manager: formData.manager === '' ? null : parseInt(formData.manager)
    };

    try {
      if (modalMode === 'create') {
        await serviceAPI.create(submissionData);
      } else if (modalMode === 'edit') {
        await serviceAPI.update(selectedService.id, submissionData);
      }
      closeModal();
      loadData();
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object') {
          const errors = Object.values(data).flat();
          setFormError(errors.join(' '));
        } else {
          setFormError('Une erreur est survenue lors de l\'enregistrement');
        }
      } else {
        setFormError('Une erreur est survenue lors de l\'enregistrement');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer un service
  const handleDelete = async (service) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le service "${service.name}" ?`)) return;

    try {
      await serviceAPI.delete(service.id);
      loadData();
    } catch (err) {
      alert('Impossible de supprimer ce service car il contient peut-être des unités de soins actives.');
    }
  };

  // Toggle menu
  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Obtenir la couleur du niveau de criticité
  const getCriticalityColor = (level) => {
    switch (level) {
      case 1: return 'success';
      case 2: return 'warning';
      case 3: return 'danger';
      default: return 'default';
    }
  };

  const getCriticalityLabel = (level) => {
    switch (level) {
      case 1: return 'Normal';
      case 2: return 'Élevé';
      case 3: return 'Critique';
      default: return 'Non défini';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-muted">Chargement des services...</p>
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
            <Building2 className="w-8 h-8 text-emerald-400" />
            Services
          </h1>
          <p className="text-muted mt-1">
            {stats.total} services • {stats.totalUnits} unités • {stats.totalBeds} lits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 text-muted hover:text-main hover:bg-dark-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-main rounded-lg font-medium hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouveau service
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-lg">
            <Building2 className="w-6 h-6 text-main" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main">{stats.total}</p>
            <p className="text-sm text-muted">Services actifs</p>
          </div>
        </div>
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-lg">
            <MapPin className="w-6 h-6 text-main" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main">{stats.totalUnits}</p>
            <p className="text-sm text-muted">Unités de soins</p>
          </div>
        </div>
        <div className="bg-dark-700 rounded-xl border border-dark-500 p-4 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-600 to-amber-400 rounded-lg">
            <Bed className="w-6 h-6 text-main" />
          </div>
          <div>
            <p className="text-2xl font-bold text-main">{stats.totalBeds}</p>
            <p className="text-sm text-muted">Capacité totale (lits)</p>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-dark-700 rounded-xl border border-dark-500 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Rechercher un service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Liste des services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => {
          const serviceUnits = getServiceCareUnits(service.id);
          return (
            <div
              key={service.id}
              onClick={() => openViewModal(service)}
              className="bg-dark-700 rounded-xl border border-dark-500 p-5 hover:border-dark-400 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-lg">
                  <Building2 className="w-6 h-6 text-main" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getCriticalityColor(service.criticality_level)} size="sm">
                    {getCriticalityLabel(service.criticality_level)}
                  </Badge>
                  <div className="relative">
                    <button
                      onClick={(e) => toggleMenu(e, service.id)}
                      className="p-1 text-muted hover:text-main hover:bg-dark-500 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === service.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-dark-600 rounded-lg shadow-xl border border-dark-500 py-1 z-50">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(service); }}
                          className="w-full px-4 py-2 text-left text-main hover:bg-dark-500 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" /> Modifier
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(service); }}
                          className="w-full px-4 py-2 text-left text-rose-400 hover:bg-dark-500 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-main text-lg group-hover:text-emerald-400 transition-colors mb-2">
                {service.name}
              </h3>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Capacité</span>
                  <span className="text-main">{service.bed_capacity} lits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Unités</span>
                  <span className="text-main">{serviceUnits.length}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dark-500 flex justify-end">
                <span className="text-primary-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Voir détails <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={closeModal} size="lg">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-main flex items-center gap-3">
              <Building2 className="w-6 h-6 text-emerald-400" />
              {modalMode === 'view' ? selectedService?.name : modalMode === 'create' ? 'Nouveau Service' : 'Modifier Service'}
            </h2>
            <button onClick={closeModal} className="text-muted hover:text-main"><X /></button>
          </div>

          {formError && (
            <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-3 text-rose-400">
              <AlertCircle className="w-5 h-5" /> {formError}
            </div>
          )}

          {modalMode === 'view' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-dark-600 p-4 rounded-lg">
                  <p className="text-sm text-muted">Responsable</p>
                  <p className="text-lg font-bold text-main">{selectedService?.manager_name || 'Non défini'}</p>
                </div>
                <div className="bg-dark-600 p-4 rounded-lg">
                  <p className="text-sm text-muted">Criticité</p>
                  <p className="text-lg font-bold text-main">{getCriticalityLabel(selectedService?.criticality_level)}</p>
                </div>
                <div className="bg-dark-600 p-4 rounded-lg">
                  <p className="text-sm text-muted">Capacité</p>
                  <p className="text-lg font-bold text-main">{selectedService?.bed_capacity} lits</p>
                </div>
                <div className="bg-dark-600 p-4 rounded-lg">
                  <p className="text-sm text-muted">Unités</p>
                  <p className="text-lg font-bold text-main">{getServiceCareUnits(selectedService?.id).length}</p>
                </div>
              </div>
              <button onClick={() => openEditModal(selectedService)} className="w-full py-3 bg-primary-500 text-main rounded-lg font-medium hover:bg-primary-600 transition-colors">
                Modifier ce service
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1">Nom du service</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Responsable (Manager)</label>
                <select
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main"
                >
                  <option value="">-- Aucun responsable --</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted mb-1">Capacité (lits)</label>
                  <input
                    type="number"
                    required
                    value={formData.bed_capacity}
                    onChange={(e) => setFormData({ ...formData, bed_capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">Criticité</label>
                  <select
                    value={formData.criticality_level}
                    onChange={(e) => setFormData({ ...formData, criticality_level: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-main"
                  >
                    <option value={1}>1 - Normal</option>
                    <option value={2}>2 - Élevé</option>
                    <option value={3}>3 - Critique</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-emerald-500 text-main rounded-lg font-medium flex items-center justify-center gap-2">
                  {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
                <button type="button" onClick={closeModal} className="flex-1 py-3 bg-dark-600 text-main rounded-lg">Annuler</button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ServiceList;
