import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CollegesPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the use hook for params
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  use: jest.fn((promise) => ({ orgId: 'test-org-123' })),
}));

describe('CollegesPage - Create Drive Button', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock fetch for colleges
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/organization/test-org-123/colleges')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            colleges: [
              {
                id: 'college-1',
                name: 'IIT Bombay',
                location: 'Mumbai, Maharashtra',
                contactEmail: 'placement@iitb.ac.in',
                contactPhone: '+91-1234567890',
                stats: {
                  totalStudents: 150,
                  interviewsCompleted: 45,
                  averagePlacementScore: 78,
                },
              },
              {
                id: 'college-2',
                name: 'IIT Delhi',
                location: 'Delhi',
                contactEmail: 'placement@iitd.ac.in',
                contactPhone: '+91-9876543210',
                stats: {
                  totalStudents: 200,
                  interviewsCompleted: 60,
                  averagePlacementScore: 82,
                },
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

  it('should render Create Interview Drive button for each college', async () => {
    render(<CollegesPage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    // Wait for colleges to load
    await screen.findByText('IIT Bombay');

    // Check that Create Drive buttons are rendered
    const createDriveButtons = screen.getAllByText(/Create Interview Drive/i);
    expect(createDriveButtons).toHaveLength(2);
  });

  it('should have correct href with collegeId parameter for each college', async () => {
    render(<CollegesPage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await screen.findByText('IIT Bombay');

    // Find all links with the Create Drive button text
    const links = screen.getAllByRole('link', { name: /Create Interview Drive/i });
    
    expect(links[0]).toHaveAttribute('href', '/organization/test-org-123/interview-drives/create?collegeId=college-1');
    expect(links[1]).toHaveAttribute('href', '/organization/test-org-123/interview-drives/create?collegeId=college-2');
  });

  it('should display college information correctly', async () => {
    render(<CollegesPage params={Promise.resolve({ orgId: 'test-org-123' })} />);

    await screen.findByText('IIT Bombay');
    
    expect(screen.getByText('IIT Bombay')).toBeInTheDocument();
    expect(screen.getByText('Mumbai, Maharashtra')).toBeInTheDocument();
    expect(screen.getByText('IIT Delhi')).toBeInTheDocument();
    expect(screen.getByText('Delhi')).toBeInTheDocument();
  });
});
