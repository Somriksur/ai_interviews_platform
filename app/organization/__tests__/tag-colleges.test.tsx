/**
 * Organization College Tagging UI Tests
 * 
 * Tests the organization interface for tagging colleges to job postings
 * with original casing display and approval status
 * 
 * **Feature: college-name-primary-key**
 * **Validates: Requirements 2.1, 2.4**
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import TagCollegesPage from '../[orgId]/tag-colleges/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('Organization College Tagging Page', () => {
  const mockParams = Promise.resolve({ orgId: 'org-123' });

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Page Rendering', () => {
    test('renders page title and description', () => {
      render(<TagCollegesPage params={mockParams} />);

      expect(screen.getByText('Tag Colleges for Recruitment')).toBeInTheDocument();
      expect(screen.getByText(/Create a job posting and tag colleges/i)).toBeInTheDocument();
    });

    test('renders job details form when creating new job', () => {
      render(<TagCollegesPage params={mockParams} />);

      expect(screen.getByText('Job Details')).toBeInTheDocument();
      expect(screen.getByLabelText(/Job Role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Number of Vacancies/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Required Skills/i)).toBeInTheDocument();
    });

    test('hides job details form when editing existing job', () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('job-123'),
      });

      render(<TagCollegesPage params={mockParams} />);

      expect(screen.queryByText('Job Details')).not.toBeInTheDocument();
      expect(screen.getByText(/Tagging colleges for existing job posting/i)).toBeInTheDocument();
    });
  });

  describe('College Search', () => {
    test('searches for colleges as user types', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          colleges: [
            {
              id: 'college-1',
              name: 'Massachusetts Institute of Technology',
              location: 'Cambridge, MA',
              contactEmail: 'admin@mit.edu',
            },
          ],
        }),
      });

      render(<TagCollegesPage params={mockParams} />);

      const searchInput = screen.getByPlaceholderText(/Type college name to search/i);
      fireEvent.change(searchInput, { target: { value: 'MIT' } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/colleges/search?q=MIT')
        );
      });
    });

    test('displays search results with original casing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          colleges: [
            {
              id: 'college-1',
              name: 'Massachusetts Institute of Technology',
              location: 'Cambridge, MA',
              contactEmail: 'admin@mit.edu',
            },
          ],
        }),
      });

      render(<TagCollegesPage params={mockParams} />);

      const searchInput = screen.getByPlaceholderText(/Type college name to search/i);
      fireEvent.change(searchInput, { target: { value: 'mit' } });

      await waitFor(() => {
        // Should display with original casing
        expect(screen.getByText('Massachusetts Institute of Technology')).toBeInTheDocument();
        expect(screen.getByText(/Cambridge, MA/i)).toBeInTheDocument();
      });
    });

    test('shows case-insensitive search hint', () => {
      render(<TagCollegesPage params={mockParams} />);

      expect(screen.getByText(/Search is case-insensitive/i)).toBeInTheDocument();
      expect(screen.getByText(/College names will be displayed with their original casing/i)).toBeInTheDocument();
    });
  });

  describe('Adding Colleges', () => {
    test('adds college to tagged list when clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          colleges: [
            {
              id: 'college-1',
              name: 'Stanford University',
              location: 'Stanford, CA',
              contactEmail: 'admin@stanford.edu',
            },
          ],
        }),
      });

      render(<TagCollegesPage params={mockParams} />);

      const searchInput = screen.getByPlaceholderText(/Type college name to search/i);
      fireEvent.change(searchInput, { target: { value: 'Stanford' } });

      await waitFor(() => {
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Add/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Tagged Colleges \(1\)/i)).toBeInTheDocument();
      });
    });

    test('displays tagged colleges with original casing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          colleges: [
            {
              id: 'college-1',
              name: 'Massachusetts Institute of Technology',
              location: 'Cambridge, MA',
              contactEmail: 'admin@mit.edu',
            },
          ],
        }),
      });

      render(<TagCollegesPage params={mockParams} />);

      const searchInput = screen.getByPlaceholderText(/Type college name to search/i);
      fireEvent.change(searchInput, { target: { value: 'mit' } });

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add/i });
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        // Should show in tagged section with original casing
        const taggedSection = screen.getByText(/Tagged Colleges/i).closest('div');
        expect(taggedSection).toHaveTextContent('Massachusetts Institute of Technology');
      });
    });
  });

  describe('Removing Colleges', () => {
    test('removes college from tagged list', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          colleges: [
            {
              id: 'college-1',
              name: 'Stanford University',
              location: 'Stanford, CA',
              contactEmail: 'admin@stanford.edu',
            },
          ],
        }),
      });

      render(<TagCollegesPage params={mockParams} />);

      // Add a college first
      const searchInput = screen.getByPlaceholderText(/Type college name to search/i);
      fireEvent.change(searchInput, { target: { value: 'Stanford' } });

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add/i });
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Tagged Colleges \(1\)/i)).toBeInTheDocument();
      });

      // Now remove it
      const removeButtons = screen.getAllByRole('button');
      const removeButton = removeButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('text-red')
      );
      
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText(/Tagged Colleges/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Approval Status Display', () => {
    test('shows pending status for newly tagged colleges', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          colleges: [
            {
              id: 'college-1',
              name: 'Stanford University',
              location: 'Stanford, CA',
              contactEmail: 'admin@stanford.edu',
            },
          ],
        }),
      });

      render(<TagCollegesPage params={mockParams} />);

      const searchInput = screen.getByPlaceholderText(/Type college name to search/i);
      fireEvent.change(searchInput, { target: { value: 'Stanford' } });

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add/i });
        fireEvent.click(addButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });

    test('loads and displays approval status for existing job', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('job-123'),
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            taggedColleges: ['Stanford University', 'MIT'],
            collegeApprovals: {
              'Stanford University': 'approved',
              'MIT': 'pending',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            colleges: [
              {
                id: 'college-1',
                name: 'Stanford University',
                location: 'Stanford, CA',
                contactEmail: 'admin@stanford.edu',
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            colleges: [
              {
                id: 'college-2',
                name: 'MIT',
                location: 'Cambridge, MA',
                contactEmail: 'admin@mit.edu',
              },
            ],
          }),
        });

      render(<TagCollegesPage params={mockParams} />);

      await waitFor(() => {
        expect(screen.getByText('Approved')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('validates that at least one college is selected', async () => {
      const { toast } = require('sonner');

      render(<TagCollegesPage params={mockParams} />);

      // Fill in job details
      fireEvent.change(screen.getByLabelText(/Job Role/i), {
        target: { value: 'Software Engineer' },
      });
      fireEvent.change(screen.getByLabelText(/Number of Vacancies/i), {
        target: { value: '5' },
      });
      fireEvent.change(screen.getByLabelText(/Required Skills/i), {
        target: { value: 'JavaScript, React' },
      });

      const submitButton = screen.getByRole('button', { name: /Create Job & Tag Colleges/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please select at least one college');
      });
    });

    test('submits form with tagged colleges', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            colleges: [
              {
                id: 'college-1',
                name: 'Stanford University',
                location: 'Stanford, CA',
                contactEmail: 'admin@stanford.edu',
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'job-123' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<TagCollegesPage params={mockParams} />);

      // Add a college
      const searchInput = screen.getByPlaceholderText(/Type college name to search/i);
      fireEvent.change(searchInput, { target: { value: 'Stanford' } });

      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add/i });
        fireEvent.click(addButton);
      });

      // Fill in job details
      fireEvent.change(screen.getByLabelText(/Job Role/i), {
        target: { value: 'Software Engineer' },
      });
      fireEvent.change(screen.getByLabelText(/Number of Vacancies/i), {
        target: { value: '5' },
      });
      fireEvent.change(screen.getByLabelText(/Required Skills/i), {
        target: { value: 'JavaScript, React' },
      });
      fireEvent.change(screen.getByLabelText(/Salary Min/i), {
        target: { value: '300000' },
      });
      fireEvent.change(screen.getByLabelText(/Salary Max/i), {
        target: { value: '500000' },
      });
      fireEvent.change(screen.getByLabelText(/Job Description/i), {
        target: { value: 'Great opportunity' },
      });

      const submitButton = screen.getByRole('button', { name: /Create Job & Tag Colleges/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/organization/org-123/job-postings'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('Original Casing Preservation', () => {
    test('preserves original casing throughout the flow', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          colleges: [
            {
              id: 'college-1',
              name: 'Massachusetts Institute of Technology',
              location: 'Cambridge, MA',
              contactEmail: 'admin@mit.edu',
            },
          ],
        }),
      });

      render(<TagCollegesPage params={mockParams} />);

      // Search with lowercase
      const searchInput = screen.getByPlaceholderText(/Type college name to search/i);
      fireEvent.change(searchInput, { target: { value: 'massachusetts' } });

      await waitFor(() => {
        // Should display with original casing in search results
        expect(screen.getByText('Massachusetts Institute of Technology')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Add/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        // Should display with original casing in tagged section
        const taggedSection = screen.getByText(/Tagged Colleges/i).closest('div');
        expect(taggedSection).toHaveTextContent('Massachusetts Institute of Technology');
      });
    });
  });
});
