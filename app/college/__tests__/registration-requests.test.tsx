/**
 * College Admin Registration Approval UI Tests
 * 
 * Tests the college admin interface for reviewing and approving/rejecting
 * student registration requests
 * 
 * **Feature: college-name-primary-key**
 * **Validates: Requirements 5.2, 5.3, 5.4**
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import RegistrationRequestsPage from '../[collegeId]/registration-requests/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('College Admin Registration Requests Page', () => {
  const mockCollegeId = 'college-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ collegeId: mockCollegeId });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Page Rendering', () => {
    test('renders page title and description', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [],
          stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      expect(screen.getByText('Student Registration Requests')).toBeInTheDocument();
      expect(screen.getByText(/Review and manage student registration requests/i)).toBeInTheDocument();
    });

    test('renders stats cards', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [],
          stats: { total: 10, pending: 5, approved: 3, rejected: 2 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Requests')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Rejected')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    test('renders filter buttons', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [],
          stats: { total: 10, pending: 5, approved: 3, rejected: 2 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pending \(5\)/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /All \(10\)/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Approved \(3\)/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Rejected \(2\)/i })).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    test('fetches registration requests on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [],
          stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/colleges/${mockCollegeId}/registration-requests?status=pending`)
        );
      });
    });

    test('displays loading state while fetching', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<RegistrationRequestsPage />);

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loader2 icon
    });

    test('handles fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Request Display', () => {
    test('displays pending registration requests', async () => {
      const mockRequests = [
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
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: mockRequests,
          stats: { total: 1, pending: 1, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('2021CS001')).toBeInTheDocument();
        expect(screen.getByText('Computer Science')).toBeInTheDocument();
        expect(screen.getByText(/Year 3/i)).toBeInTheDocument();
      });
    });

    test('displays approve and reject buttons for pending requests', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          studentName: 'John Doe',
          email: 'john@example.com',
          collegeName: 'MIT',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: mockRequests,
          stats: { total: 1, pending: 1, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
      });
    });

    test('displays rejection reason for rejected requests', async () => {
      const mockRequests = [
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
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: mockRequests,
          stats: { total: 1, pending: 0, approved: 0, rejected: 1 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Rejection Reason:/i)).toBeInTheDocument();
        expect(screen.getByText('Invalid roll number')).toBeInTheDocument();
      });
    });

    test('shows empty state when no requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [],
          stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByText('No Registration Requests')).toBeInTheDocument();
        expect(screen.getByText(/There are no pending registration requests/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    test('filters by pending status by default', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [],
          stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=pending')
        );
      });
    });

    test('changes filter when clicking filter buttons', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          requests: [],
          stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
      });

      const allButton = screen.getByRole('button', { name: /All \(/i });
      fireEvent.click(allButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=all')
        );
      });
    });
  });

  describe('Approval Workflow', () => {
    test('opens approve dialog when clicking approve button', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          studentName: 'John Doe',
          email: 'john@example.com',
          collegeName: 'MIT',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: mockRequests,
          stats: { total: 1, pending: 1, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /Approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(screen.getByText('Approve Registration Request')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to approve/i)).toBeInTheDocument();
      });
    });

    test('approves request successfully', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          studentName: 'John Doe',
          email: 'john@example.com',
          collegeName: 'MIT',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            requests: mockRequests,
            stats: { total: 1, pending: 1, approved: 0, rejected: 0 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            studentId: 'student-123',
            message: 'Registration request approved successfully',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            requests: [],
            stats: { total: 1, pending: 0, approved: 1, rejected: 0 },
          }),
        });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /Approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(screen.getByText('Approve Registration Request')).toBeInTheDocument();
      });

      const confirmButton = screen.getAllByRole('button', { name: /Approve/i })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/registration-requests/req-1/approve`,
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('Rejection Workflow', () => {
    test('opens reject dialog when clicking reject button', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          studentName: 'John Doe',
          email: 'john@example.com',
          collegeName: 'MIT',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: mockRequests,
          stats: { total: 1, pending: 1, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
      });

      const rejectButton = screen.getByRole('button', { name: /Reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByText('Reject Registration Request')).toBeInTheDocument();
        expect(screen.getByText(/Please provide a reason for rejecting/i)).toBeInTheDocument();
      });
    });

    test('requires rejection reason', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          studentName: 'John Doe',
          email: 'john@example.com',
          collegeName: 'MIT',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: mockRequests,
          stats: { total: 1, pending: 1, approved: 0, rejected: 0 },
        }),
      });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
      });

      const rejectButton = screen.getByRole('button', { name: /Reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        const confirmButton = screen.getAllByRole('button', { name: /Reject/i })[1];
        expect(confirmButton).toBeDisabled();
      });
    });

    test('rejects request with reason', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          studentName: 'John Doe',
          email: 'john@example.com',
          collegeName: 'MIT',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            requests: mockRequests,
            stats: { total: 1, pending: 1, approved: 0, rejected: 0 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Registration request rejected successfully',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            requests: [],
            stats: { total: 1, pending: 0, approved: 0, rejected: 1 },
          }),
        });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
      });

      const rejectButton = screen.getByRole('button', { name: /Reject/i });
      fireEvent.click(rejectButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Reason for Rejection/i)).toBeInTheDocument();
      });

      const reasonInput = screen.getByLabelText(/Reason for Rejection/i);
      fireEvent.change(reasonInput, { target: { value: 'Invalid roll number' } });

      const confirmButton = screen.getAllByRole('button', { name: /Reject/i })[1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/registration-requests/req-1/reject`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ rejectionReason: 'Invalid roll number' }),
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error when approval fails', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          studentName: 'John Doe',
          email: 'john@example.com',
          collegeName: 'MIT',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            requests: mockRequests,
            stats: { total: 1, pending: 1, approved: 0, rejected: 0 },
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: 'Failed to approve request',
          }),
        });

      render(<RegistrationRequestsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /Approve/i });
      fireEvent.click(approveButton);

      await waitFor(() => {
        const confirmButton = screen.getAllByRole('button', { name: /Approve/i })[1];
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to approve request/i)).toBeInTheDocument();
      });
    });
  });
});
