import api from './api';

export const prototypeService = {
  async getPrototypes({ category, search } = {}) {
    const params = {};
    if (category && category !== 'All') params.category = category;
    if (search) params.search = search;
    const response = await api.get('/prototypes', { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.prototypes)) return data.prototypes;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  async getPrototypeById(prototypeId) {
    const response = await api.get(`/prototypes/${prototypeId}`);
    return response.data;
  },

  async getPrototypePreview(prototypeId) {
    const response = await api.get(`/prototypes/${prototypeId}/preview`);
    return response.data;
  },

  async syncPrototypes() {
    const response = await api.post('/prototypes/sync');
    return response.data;
  }
};
