import { apiRequest } from "./queryClient";
import type { 
  InsertCandidate, 
  InsertClient, 
  InsertTrajectory, 
  InsertNote, 
  InsertDocument,
  Candidate,
  Client,
  Trajectory,
  Note,
  Document
} from "@shared/schema";

// Get headers for requests - includes admin token if available
function getRequestHeaders() {
  const adminToken = localStorage.getItem('adminToken');
  const headers: Record<string, string> = {
    'credentials': 'include'
  };
  
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }
  
  return headers;
}

// Candidate API
export const candidateApi = {
  getAll: (filters?: {
    search?: string;
    phase?: string[];
    region?: string;
    drivingLicenses?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.phase?.length) params.append('phase', filters.phase.join(','));
    if (filters?.region) params.append('region', filters.region);
    if (filters?.drivingLicenses?.length) params.append('drivingLicenses', filters.drivingLicenses.join(','));
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
    if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
    
    const queryString = params.toString();
    return fetch(`/api/candidates${queryString ? `?${queryString}` : ''}`, {
      credentials: 'include',
      headers: getRequestHeaders()
    }).then(res => res.json());
  },

  getById: (id: number) => 
    fetch(`/api/candidates/${id}`, { credentials: 'include', headers: getRequestHeaders() }).then(res => res.json()),

  create: async (data: InsertCandidate): Promise<Candidate> => {
    const response = await apiRequest('POST', '/api/candidates', data);
    
    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.message || 'Failed to create candidate');
      (error as any).response = {
        status: response.status,
        data: errorData
      };
      throw error;
    }
    
    return response.json();
  },

  update: async (id: number, data: Partial<InsertCandidate>): Promise<Candidate> => {
    const response = await apiRequest('PUT', `/api/candidates/${id}`, data);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/candidates/${id}`);
  }
};

// Client API
export const clientApi = {
  getAll: (filters?: {
    search?: string;
    workType?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.workType) params.append('workType', filters.workType);
    
    const queryString = params.toString();
    return fetch(`/api/clients${queryString ? `?${queryString}` : ''}`, {
      credentials: 'include'
    }).then(res => res.json());
  },

  getById: (id: number) => 
    fetch(`/api/clients/${id}`, { credentials: 'include' }).then(res => res.json()),

  create: async (data: InsertClient): Promise<Client> => {
    const response = await apiRequest('POST', '/api/clients', data);
    return response.json();
  },

  update: async (id: number, data: Partial<InsertClient>): Promise<Client> => {
    const response = await apiRequest('PUT', `/api/clients/${id}`, data);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/clients/${id}`);
  }
};

// Trajectory API
export const trajectoryApi = {
  getAll: (filters?: {
    search?: string;
    status?: string[];
    candidateId?: number;
    clientId?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status?.length) params.append('status', filters.status.join(','));
    if (filters?.candidateId) params.append('candidateId', filters.candidateId.toString());
    if (filters?.clientId) params.append('clientId', filters.clientId.toString());
    
    const queryString = params.toString();
    return fetch(`/api/trajectories${queryString ? `?${queryString}` : ''}`, {
      credentials: 'include'
    }).then(res => res.json());
  },

  getById: (id: number) => 
    fetch(`/api/trajectories/${id}`, { credentials: 'include' }).then(res => res.json()),

  create: async (data: InsertTrajectory): Promise<Trajectory> => {
    const response = await apiRequest('POST', '/api/trajectories', data);
    return response.json();
  },

  update: async (id: number, data: Partial<InsertTrajectory>): Promise<Trajectory> => {
    const response = await apiRequest('PUT', `/api/trajectories/${id}`, data);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/trajectories/${id}`);
  }
};

// Notes API
export const notesApi = {
  getByEntity: async (entityType: string, entityId: number) => {
    const response = await fetch(`/api/notes?entityType=${entityType}&entityId=${entityId}`, { 
      credentials: 'include',
      headers: getRequestHeaders()
    });
    if (!response.ok) {
      throw new Error(`${response.status}: Failed to fetch notes`);
    }
    return response.json();
  },

  create: async (data: InsertNote): Promise<Note> => {
    const response = await apiRequest('POST', '/api/notes', data);
    return response.json();
  },

  update: async (id: number, content: string): Promise<Note> => {
    const response = await apiRequest('PUT', `/api/notes/${id}`, { content });
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/notes/${id}`);
  }
};

// Documents API
export const documentsApi = {
  getByEntity: async (entityType: string, entityId: number) => {
    const adminToken = localStorage.getItem('adminToken');
    const headers: HeadersInit = {};
    
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
    
    const response = await fetch(`/api/documents/${entityType}/${entityId}`, { 
      credentials: 'include',
      headers
    });
    if (!response.ok) {
      throw new Error(`${response.status}: Failed to fetch documents`);
    }
    return response.json();
  },

  create: async (data: InsertDocument): Promise<Document> => {
    const response = await apiRequest('POST', '/api/documents', data);
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest('DELETE', `/api/documents/${id}`);
  }
};
