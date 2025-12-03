import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import JobProfilesPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the use hook for params
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  use: jest.fn((promise) => ({ orgId: 'test-org-123' })),
}));

describe('JobProfilesPage - Create Drive Button', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock fetch for auth check
    global.fetch = jest.fn((url) => {
      if (url === '/api/auth/me') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { role: 'organization' } }),
        } as Response);
      }
      if (url.includes('/api/job-profiles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            jobs: [
              {
                id: 'job-1',
                title: 'Software Developer',
                company: 'Tech Corp',
                description: 'Great job',
                requiredSkills: ['JavaScript', 'React'],
                minimumScore: 70,
                salaryBand: { min: 500000, max: 800000, category: 'medium' },
              },
              {
                id: 'job-2',
                title: 'Data Scientist',
                company: 'Data Inc',
                description: 'Analyze data',
                requiredSkills: ['Python', 'ML'],
                minimumScore: 80,
                salaryBand: { min: 700000, max: 1000000, category: 'high' },
              },
            ],
          }),
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render Create Interview Drive button for each job profile', async () => {
    render(<JobProfilesPage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    // Wait for jobs to load
    await screen.findByText('Software Developer');

    // Check that Create Drive buttons are rendered
    const createDriveButtons = screen.getAllByText(/Create Interview Drive/i);
    expect(createDriveButtons).toHaveLength(2);
  });

  it('should have correct href with jobId parameter for each job', async () => {
    render(<JobProfilesPage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await screen.findByText('Software Developer');

    // Find all links with the Create Drive button text
    const links = screen.getAllByRole('link', { name: /Create Interview Drive/i });
    
    expect(links[0]).toHaveAttribute('href', '/organization/test-org-123/interview-drives/create?jobId=job-1');
    expect(links[1]).toHaveAttribute('href', '/organization/test-org-123/interview-drives/create?jobId=job-2');
  });

  it('should display job profile information correctly', async () => {
    render(<JobProfilesPage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await screen.findByText('Software Developer');
    
    expect(screen.getByText('Software Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Data Scientist')).toBeInTheDocument();
    expect(screen.getByText('Data Inc')).toBeInTheDocument();
  });
});
