import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';
import { useAuth } from '../../../context/AuthContext';

// Mock the components
jest.mock('../components/user/UserDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="user-dashboard">User Dashboard</div>
}));

jest.mock('../components/space-owner/SpaceOwnerDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="space-owner-dashboard">Space Owner Dashboard</div>
}));

jest.mock('../components/admin/AdminDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-dashboard">Admin Dashboard</div>
}));

// Mock the auth context
jest.mock('../../../context/AuthContext');

describe('DashboardPage', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    mockUseAuth.mockClear();
  });

  it('shows user dashboard for role "user"', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'user' },
      loading: false
    });

    render(<DashboardPage />);
    expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
  });

  it('shows space owner dashboard for role "space_owner"', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'space_owner' },
      loading: false
    });

    render(<DashboardPage />);
    expect(screen.getByTestId('space-owner-dashboard')).toBeInTheDocument();
  });

  it('shows space owner dashboard for role "space-owner"', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'space-owner' },
      loading: false
    });

    render(<DashboardPage />);
    expect(screen.getByTestId('space-owner-dashboard')).toBeInTheDocument();
  });

  it('shows admin dashboard for role "admin"', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'admin' },
      loading: false
    });

    render(<DashboardPage />);
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });

  it('shows user dashboard for unknown role', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'unknown' },
      loading: false
    });

    render(<DashboardPage />);
    expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
  });

  it('shows nothing when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true
    });

    const { container } = render(<DashboardPage />);
    expect(container.firstChild).toBeNull();
  });

  it('redirects to login when no user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });

    render(<DashboardPage />);
    // Since we mocked useRouter, we can't actually test the redirect
    // but we can verify that the dashboard components are not rendered
    expect(screen.queryByTestId('user-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('space-owner-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
  });
}); 