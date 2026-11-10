import api from './api';

export const hostingService = {
  async createHostedInstance(prototypeId, customization = null) {
    const response = await api.post('/hosting/create', {
      prototype_id: prototypeId,
      customization,
    });
    return response.data;
  },

  async getMyInstances() {
    const response = await api.get('/hosting/my-instances');
    return response.data;
  },

  async getInstanceDetails(instanceId) {
    const response = await api.get(`/hosting/${instanceId}`);
    return response.data;
  },

  async getCloneInfo(instanceId) {
    const response = await api.get(`/hosting/${instanceId}/clone-info`);
    return response.data;
  },

  async exportInstance(instanceId) {
    const response = await api.post(`/export/${instanceId}`);
    return response.data;
  },

  async openInVSCodeDirectly(instanceId) {
    const response = await api.post(`/hosting/${instanceId}/open-in-vscode`);
    return response.data;
  }
};
