import axios from 'axios';
import { Node, Edge } from '@xyflow/react';
import { API_BASE } from './origin';

export interface Flow {
  id: number;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlowPayload {
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RunResult {
  status: 'completed' | 'error';
  logs: string[];
  outputContext: Record<string, any>;
}

export const flowsAPI = {
  async getFlows(): Promise<Flow[]> {
    const response = await axios.get(`${API_BASE}/flows`);
    return response.data;
  },

  async getFlow(id: number): Promise<Flow> {
    const response = await axios.get(`${API_BASE}/flows/${id}`);
    return response.data;
  },

  async createFlow(payload: CreateFlowPayload): Promise<Flow> {
    try {
      console.log('Creating flow with payload:', payload);
      console.log('API endpoint:', `${API_BASE}/flows`);
      const response = await axios.post(`${API_BASE}/flows`, payload);
      console.log('Flow created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create flow:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        validationDetails: error.response?.data?.details,
        payload: payload
      });
      throw error;
    }
  },

  async updateFlow(id: number, payload: CreateFlowPayload): Promise<Flow> {
    const response = await axios.put(`${API_BASE}/flows/${id}`, payload);
    return response.data;
  },

  async validateFlow(id: number): Promise<ValidationResult> {
    const response = await axios.post(`${API_BASE}/flows/${id}/validate`);
    return response.data;
  },

  async runFlow(id: number, inputContext?: Record<string, any>): Promise<RunResult> {
    const response = await axios.post(`${API_BASE}/flows/${id}/run`, { inputContext });
    return response.data;
  },
};