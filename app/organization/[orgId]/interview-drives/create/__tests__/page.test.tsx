import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateDrivePage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the use hook for params
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  use: jest.fn(() => ({ orgId: 'test-org-123' })),
}));

describe('CreateDrivePage - Pre-population', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should parse jobId from URL parameters', async () => {
    const mockSearchParams = {
      get: jest.fn((key) => (key === 'jobId' ? 'job-123' : null)),
    };
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    global.fetch = jest.fn((url) => {
      if (url.includes('/api/job-profiles/job-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            job: { id: 'job-123', title: 'Software Engineer' },
          }),
        } as Response);
      }
      if (url.includes('/api/organization/test-org-123/colleges')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ colleges: [] }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    render(<CreateDrivePage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await waitFor(() => {
      expect(mockSearchParams.get).toHaveBeenCalledWith('jobId');
    });
  });

  it('should fetch and pre-populate job profile data', async () => {
    const mockSearchParams = {
      get: jest.fn((key) => (key === 'jobId' ? 'job-123' : null)),
    };
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    global.fetch = jest.fn((url) => {
      if (url.includes('/api/job-profiles/job-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            job: { id: 'job-123', title: 'Software Engineer' },
          }),
        } as Response);
      }
      if (url.includes('/api/organization/test-org-123/colleges')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ colleges: [] }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    render(<CreateDrivePage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await waitFor(() => {
      expect(screen.getByText(/Creating drive for job:/i)).toBeInTheDocument();
      expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument();
    });
  });

  it('should fetch and pre-select college data', async () => {
    const mockSearchParams = {
      get: jest.fn((key) => (key === 'collegeId' ? 'college-456' : null)),
    };
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    global.fetch = jest.fn((url) => {
      if (url.includes('/api/colleges/college-456')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            college: { id: 'college-456', name: 'IIT Bombay' },
          }),
        } as Response);
      }
      if (url.includes('/api/organization/test-org-123/colleges')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ colleges: [] }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    render(<CreateDrivePage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await waitFor(() => {
      expect(screen.getByText(/Pre-selected college:/i)).toBeInTheDocument();
      expect(screen.getByText(/IIT Bombay/i)).toBeInTheDocument();
    });
  });

  it('should handle both jobId and collegeId parameters', async () => {
    const mockSearchParams = {
      get: jest.fn((key) => {
        if (key === 'jobId') return 'job-123';
        if (key === 'collegeId') return 'college-456';
        return null;
      }),
    };
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    global.fetch = jest.fn((url) => {
      if (url.includes('/api/job-profiles/job-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            job: { id: 'job-123', title: 'Software Engineer' },
          }),
        } as Response);
      }
      if (url.includes('/api/colleges/college-456')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            college: { id: 'college-456', name: 'IIT Bombay' },
          }),
        } as Response);
      }
      if (url.includes('/api/organization/test-org-123/colleges')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ colleges: [] }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    render(<CreateDrivePage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await waitFor(() => {
      expect(screen.getByText(/Creating drive for job:/i)).toBeInTheDocument();
      expect(screen.getByText(/Software Engineer/i)).toBeInTheDocument();
      expect(screen.getByText(/Pre-selected college:/i)).toBeInTheDocument();
      expect(screen.getByText(/IIT Bombay/i)).toBeInTheDocument();
    });
  });

  it('should handle invalid jobId gracefully', async () => {
    const mockSearchParams = {
      get: jest.fn((key) => (key === 'jobId' ? 'invalid-job' : null)),
    };
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    global.fetch = jest.fn((url) => {
      if (url.includes('/api/job-profiles/invalid-job')) {
        return Promise.resolve({
          ok: false,
          status: 404,
        } as Response);
      }
      if (url.includes('/api/organization/test-org-123/colleges')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ colleges: [] }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    render(<CreateDrivePage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Job profile not found')
      );
    });

    consoleWarnSpy.mockRestore();
  });

  it('should display empty form when no parameters are present', async () => {
    const mockSearchParams = {
      get: jest.fn(() => null),
    };
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);

    global.fetch = jest.fn((url) => {
      if (url.includes('/api/organization/test-org-123/colleges')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ colleges: [] }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;

    render(<CreateDrivePage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await waitFor(() => {
      expect(screen.getByText('Create Interview Drive')).toBeInTheDocument();
    });

    // Should not show any pre-population indicators
    expect(screen.queryByText(/Creating drive for job:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pre-selected college:/i)).not.toBeInTheDocument();
  });
});
