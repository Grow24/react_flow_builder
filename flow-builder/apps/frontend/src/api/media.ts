

import { API_BASE } from './origin';

export interface MediaAsset {
  id: string;
  kind: string;
  name: string;
  mimeType?: string;
  url: string;
  thumbnail?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSec?: number;
  meta?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Attachment {
  id: string;
  scope: string;
  scopeId: string;
  mediaId: string;
  order: number;
  createdAt: string;
  media: MediaAsset;
}

export const mediaApi = {
  uploadFile: async (file: File): Promise<MediaAsset> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  createLink: async (url: string): Promise<MediaAsset> => {
    const response = await fetch(`${API_BASE}/media/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return response.json();
  },

  createText: async (content: string, title?: string): Promise<MediaAsset> => {
    const response = await fetch(`${API_BASE}/media/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, title })
    });
    return response.json();
  }
};

export const attachmentApi = {
  create: async (scope: string, scopeId: string, mediaId: string): Promise<Attachment> => {
    const response = await fetch(`${API_BASE}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, scopeId, mediaId })
    });
    return response.json();
  },

  getByScope: async (scope: string, scopeId: string): Promise<Attachment[]> => {
    const response = await fetch(`${API_BASE}/attachments?scope=${scope}&scopeId=${scopeId}`);
    return response.json();
  },

  updateOrder: async (id: string, order: number): Promise<Attachment> => {
    const response = await fetch(`${API_BASE}/attachments/${id}/order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/attachments/${id}`, { method: 'DELETE' });
  }
};