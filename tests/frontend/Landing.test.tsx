
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Landing } from '../../client/src/pages/Landing';

// Mock window.location.href setter
const mockLocationAssign = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    href: '',
    assign: mockLocationAssign,
  },
  writable: true,
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Landing Component', () => {
  beforeEach(() => {
    mockLocationAssign.mockClear();
  });

  it('should render landing page with both login options', () => {
    renderWithQueryClient(<Landing />);
    
    expect(screen.getByText('ATS Portal')).toBeInTheDocument();
    expect(screen.getByText('INLOGGEN →')).toBeInTheDocument();
    expect(screen.getByText('INLOGGEN MET REPLIT →')).toBeInTheDocument();
  });

  it('should redirect to replit login when Replit button is clicked', () => {
    renderWithQueryClient(<Landing />);
    
    const replitButton = screen.getByText('INLOGGEN MET REPLIT →');
    fireEvent.click(replitButton);
    
    expect(window.location.href).toBe('/api/replit-login');
  });

  it('should show login form for database users', () => {
    renderWithQueryClient(<Landing />);
    
    expect(screen.getByPlaceholderText('E-mail adres')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Wachtwoord')).toBeInTheDocument();
  });
});
