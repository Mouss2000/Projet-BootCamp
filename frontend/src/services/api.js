// src/services/api.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ SOIGNANTS ============
export const staffAPI = {
  getAll: (params = {}) => api.get('/staff/', { params }),
  getById: (id) => api.get(`/staff/${id}/`),
  create: (data) => api.post('/staff/', data),
  update: (id, data) => api.put(`/staff/${id}/`, data),
  delete: (id) => api.delete(`/staff/${id}/`),
  getAbsences: (id) => api.get(`/staff/${id}/absences/`),
  getShifts: (id) => api.get(`/staff/${id}/shifts/`),
  getCertifications: (id) => api.get(`/staff/${id}/certifications/`), // NOUVEAU
};

// ============ POSTES DE GARDE ============
export const shiftAPI = {
  getAll: (params = {}) => api.get('/shifts/', { params }),
  getById: (id) => api.get(`/shifts/${id}/`),
  create: (data) => api.post('/shifts/', data),
  update: (id, data) => api.put(`/shifts/${id}/`, data),
  delete: (id) => api.delete(`/shifts/${id}/`),
  getAvailableStaff: (id) => api.get(`/shifts/${id}/available_staff/`),
  addCertification: (id, certificationId) => api.post(`/shifts/${id}/add_certification/`, { certification_id: certificationId }),
  removeCertification: (id, certificationId) => api.post(`/shifts/${id}/remove_certification/`, { certification_id: certificationId }),
};

// ============ AFFECTATIONS ============
export const assignmentAPI = {
  getAll: (params = {}) => api.get('/assignments/', { params }),
  create: (data) => api.post('/assignments/', data),
  delete: (id) => api.delete(`/assignments/${id}/`),
  validate: (data) => api.post('/assignments/validate/', data),
};

// ============ ABSENCES ============
export const absenceAPI = {
  getAll: (params = {}) => api.get('/absences/', { params }),
  create: (data) => api.post('/absences/', data),
  update: (id, data) => api.put(`/absences/${id}/`, data),
  delete: (id) => api.delete(`/absences/${id}/`),
};

// ============ SERVICES ============
export const serviceAPI = {
  getAll: () => api.get('/services/'),
  getById: (id) => api.get(`/services/${id}/`),
  create: (data) => api.post('/services/', data),
  update: (id, data) => api.patch(`/services/${id}/`, data),
  delete: (id) => api.delete(`/services/${id}/`),
};

// ============ CERTIFICATIONS ============
export const certificationAPI = {
  getAll: () => api.get('/certifications/'),
  getById: (id) => api.get(`/certifications/${id}/`),
  create: (data) => api.post('/certifications/', data),
  update: (id, data) => api.put(`/certifications/${id}/`, data),
  delete: (id) => api.delete(`/certifications/${id}/`),
};

// ============ CERTIFICATIONS SOIGNANTS ============
export const staffCertificationAPI = {
  getAll: (params = {}) => api.get('/staff-certifications/', { params }),
  getByStaff: (staffId) => api.get('/staff-certifications/', { params: { staff: staffId } }),
  create: (data) => api.post('/staff-certifications/', data),
  update: (id, data) => api.put(`/staff-certifications/${id}/`, data),
  delete: (id) => api.delete(`/staff-certifications/${id}/`),
};

// ============ CONTRATS ============
export const contractAPI = {
  getAll: (params = {}) => api.get('/contracts/', { params }),
  create: (data) => api.post('/contracts/', data),
  update: (id, data) => api.put(`/contracts/${id}/`, data),
  delete: (id) => api.delete(`/contracts/${id}/`),
};

export const contractTypeAPI = {
  getAll: () => api.get('/contract-types/'),
  create: (data) => api.post('/contract-types/', data),
  update: (id, data) => api.put(`/contract-types/${id}/`, data),
  delete: (id) => api.delete(`/contract-types/${id}/`),
};

// ============ DONNÉES DE RÉFÉRENCE ============
export const referenceAPI = {
  getServices: () => api.get('/services/'),
  getCareUnits: (serviceId = null) => {
    const params = serviceId ? { service: serviceId } : {};
    return api.get('/care-units/', { params });
  },
  getShiftTypes: () => api.get('/shift-types/'),
  getAbsenceTypes: () => api.get('/absence-types/'),
  getCertifications: () => api.get('/certifications/'),
  getContractTypes: () => api.get('/contract-types/'),
};

export default api;