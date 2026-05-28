import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GlobalQuickAdd from './GlobalQuickAdd';
import { AuthProvider } from '../contexts/AuthContext';
import * as AuthContextModule from '../contexts/AuthContext';
import axios from 'axios';

jest.mock('axios');

// Mock react-router-dom
let mockLocation = { pathname: '/history' };
jest.mock('react-router-dom', () => ({
  useLocation: () => mockLocation,
}), { virtual: true });

const renderWithProviders = (ui, { route = '/history', user = { id: '1', name: 'Test' } } = {}) => {
  mockLocation = { pathname: route };
  jest.spyOn(AuthContextModule, 'useAuth').mockImplementation(() => ({
    user,
  }));

  return render(ui);
};

describe('GlobalQuickAdd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render if user is not logged in', () => {
    renderWithProviders(<GlobalQuickAdd />, { user: null });
    expect(screen.queryByTestId('global-quick-add-fab')).not.toBeInTheDocument();
  });

  it('does not render on the dashboard route (/)', () => {
    renderWithProviders(<GlobalQuickAdd />, { route: '/' });
    expect(screen.queryByTestId('global-quick-add-fab')).not.toBeInTheDocument();
  });

  it('renders the FAB on non-dashboard routes for logged in users', () => {
    renderWithProviders(<GlobalQuickAdd />, { route: '/history' });
    expect(screen.getByTestId('global-quick-add-fab')).toBeInTheDocument();
  });

  it('shows the speed dial options when FAB is clicked', async () => {
    renderWithProviders(<GlobalQuickAdd />, { route: '/settings' });
    
    const fab = screen.getByTestId('global-quick-add-fab');
    fireEvent.click(fab);
    
    // Check that quick options are rendered (Sip, Glass, Cup, Bottle)
    await waitFor(() => {
      expect(screen.getByText('100ml')).toBeInTheDocument();
    });
    expect(screen.getByText('250ml')).toBeInTheDocument();
  });
  
  it('calls API when a quick log option is clicked', async () => {
    axios.post.mockResolvedValueOnce({ data: { message: 'Logged' } });
    renderWithProviders(<GlobalQuickAdd />, { route: '/settings' });
    
    const fab = screen.getByTestId('global-quick-add-fab');
    fireEvent.click(fab);
    
    const sipButton = await screen.findByText('100ml');
    fireEvent.click(sipButton);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/water/log'),
        { amount: 100, label: 'Sip' },
        { withCredentials: true }
      );
    });
  });
});
