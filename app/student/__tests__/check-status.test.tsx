/**
 * Student Registration Status Check Tests
 * 
 * Tests the registration status checking functionality
 * **Feature: college-name-primary-key**
 * **Validates: Requirements 4.3**
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckStatusPage from '../check-status/page';

// Mock fetch
global.fetch = jest.fn();

describe('Check Status Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Page Rendering', () => {
    test('renders status check form', () => {
      render(<CheckStatusPage />);

      expect(screen.getByText('Check Registration Status')).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
    });

    test('shows helpful description', () => {
      render(<CheckStatusPage />);

      expect(screen.getByText(/Enter your email to view your registration requests/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows error when email is empty', async () => {
      render(<CheckStatusPage />);

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter your email address/i)).toBeInTheDocument();
      });
    });

    test('shows error when email is invalid', async () => {
      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('searches for registration requests with valid email', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [
            {
              id: 'req-1',
              studentName: 'John Doe',
              email: 'john@example.com',
              collegeName: 'MIT',
              status: 'pending',
              submittedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/students/registration-requests?email=john%40example.com')
        );
      });
    });

    test('displays loading state during search', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/Searching.../i)).toBeInTheDocument();
      });
    });
  });

  describe('Results Display', () => {
    test('displays no results message when no requests found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [],
        }),
      });

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/No Registration Requests Found/i)).toBeInTheDocument();
      });
    });

    test('displays pending request with correct status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [
            {
              id: 'req-1',
              studentName: 'John Doe',
              email: 'john@example.com',
              collegeName: 'MIT',
              rollNumber: '2021CS001',
              branch: 'Computer Science',
              year: 3,
              status: 'pending',
              submittedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('MIT')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('2021CS001')).toBeInTheDocument();
        expect(screen.getByText('Computer Science')).toBeInTheDocument();
        expect(screen.getByText(/Pending/i)).toBeInTheDocument();
      });
    });

    test('displays approved request with success message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [
            {
              id: 'req-1',
              studentName: 'John Doe',
              email: 'john@example.com',
              collegeName: 'MIT',
              status: 'approved',
              submittedAt: new Date().toISOString(),
              reviewedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/Approved/i)).toBeInTheDocument();
        expect(screen.getByText(/Congratulations!/i)).toBeInTheDocument();
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });
    });

    test('displays rejected request with reason', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [
            {
              id: 'req-1',
              studentName: 'John Doe',
              email: 'john@example.com',
              collegeName: 'MIT',
              status: 'rejected',
              submittedAt: new Date().toISOString(),
              reviewedAt: new Date().toISOString(),
              rejectionReason: 'Invalid roll number',
            },
          ],
        }),
      });

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/Rejected/i)).toBeInTheDocument();
        expect(screen.getByText(/Request Rejected/i)).toBeInTheDocument();
        expect(screen.getByText(/Invalid roll number/i)).toBeInTheDocument();
      });
    });

    test('displays multiple requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [
            {
              id: 'req-1',
              studentName: 'John Doe',
              email: 'john@example.com',
              collegeName: 'MIT',
              status: 'pending',
              submittedAt: new Date().toISOString(),
            },
            {
              id: 'req-2',
              studentName: 'John Doe',
              email: 'john@example.com',
              collegeName: 'Stanford',
              status: 'approved',
              submittedAt: new Date().toISOString(),
              reviewedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('MIT')).toBeInTheDocument();
        expect(screen.getByText('Stanford')).toBeInTheDocument();
      });
    });
  });

  describe('Status Indicators', () => {
    test('shows correct icon for pending status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [
            {
              id: 'req-1',
              studentName: 'John Doe',
              email: 'john@example.com',
              collegeName: 'MIT',
              status: 'pending',
              submittedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/pending review/i)).toBeInTheDocument();
      });
    });

    test('shows helpful message for pending requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [
            {
              id: 'req-1',
              studentName: 'John Doe',
              email: 'john@example.com',
              collegeName: 'MIT',
              status: 'pending',
              submittedAt: new Date().toISOString(),
            },
          ],
        }),
      });

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/You'll receive an email notification once it's reviewed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message on API failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<CheckStatusPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });
});
