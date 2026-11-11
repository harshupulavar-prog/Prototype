import api from './api';

export const hostingService = {
  // Instance creation
  async createHostedInstance(prototypeId, customization = null) {
    const response = await api.post(`/prototypes/${prototypeId}/instances`, {
      customization,
      appName: customization?.app_name || customization?.appName,
      notificationEmail: customization?.notification_email || customization?.notificationEmail,
      primaryColor: customization?.primary_color || customization?.primaryColor,
      secondaryColor: customization?.secondary_color || customization?.secondaryColor,
      logo: customization?.logo,
    });
    return response.data;
  },

  // Legacy alias
  async createInstance(prototypeId, data) {
    return this.createHostedInstance(prototypeId, data);
  },

  // List user instances
  async getMyInstances() {
    const response = await api.get('/prototypes/instances');
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.instances)) return data.instances;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  // Get details
  async getInstanceDetails(instanceId) {
    const response = await api.get(`/prototypes/instances/${instanceId}`);
    return response.data;
  },

  // Start deployment
  async hostInstance(instanceId) {
    const response = await api.post(`/prototypes/instances/${instanceId}/host`);
    return response.data;
  },

  // Check deployment status
  async getDeploymentStatus(instanceId) {
    const response = await api.get(`/prototypes/instances/${instanceId}/deployment-status`);
    return response.data;
  },

  // Trigger redeployment
  async redeployInstance(instanceId, customization = null) {
    const response = await api.post(`/prototypes/instances/${instanceId}/redeploy`, {
      customization,
      appName: customization?.app_name,
      primaryColor: customization?.primary_color,
      secondaryColor: customization?.secondary_color,
      logo: customization?.logo,
    });
    return response.data;
  },

  // Download customized source code ZIP
  async downloadInstanceSource(instanceId) {
    const response = await api.get(`/prototypes/instances/${instanceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get source files for code viewer
  async getInstanceFiles(instanceId) {
    const response = await api.get(`/prototypes/instances/${instanceId}/files`);
    return response.data;
  },

  // Delete instance
  async deleteInstance(instanceId) {
    const response = await api.delete(`/prototypes/instances/${instanceId}`);
    return response.data;
  },

  // Developer Git / VS Code options
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
