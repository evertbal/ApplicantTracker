
import { QueryClient } from '@tanstack/react-query';

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  ...overrides,
});

export const createMockCandidate = (overrides = {}) => ({
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+31612345678',
  dateAdded: new Date().toISOString(),
  status: 'active',
  ...overrides,
});

export const createMockClient = (overrides = {}) => ({
  id: 1,
  name: 'Test Company',
  contactPerson: 'Jane Smith',
  email: 'jane@testcompany.com',
  phone: '+31687654321',
  ...overrides,
});

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

export const mockFetch = (responses: Array<{ ok: boolean; status?: number; data?: any }>) => {
  const fetchMock = jest.fn();
  
  responses.forEach((response, index) => {
    fetchMock.mockResolvedValueOnce({
      ok: response.ok,
      status: response.status || (response.ok ? 200 : 400),
      json: async () => response.data || {},
    });
  });
  
  global.fetch = fetchMock;
  return fetchMock;
};
