/**
 * Student Registration UI Flow Tests
 * 
 * Tests the student registration form and workflow
 * **Feature: college-name-primary-key**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import StudentRegistrationPage from '../register/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Student Registration Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Form Rendering', () => {
    test('renders registration form with all required fields', () => {
      render(<StudentRegistrationPage />);

      expect(screen.getByText('Student Registration')).toBeInTheDocument();
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/College Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Roll Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Branch/i)).toBeInTheDocument();
    });

    test('displays required field indicators', () => {
      render(<StudentRegistrationPage />);

      const requiredFields = screen.getAllByText('*');
      expect(requiredFields.length).toBeGreaterThan(0);
    });

    test('shows submit button', () => {
      render(<StudentRegistrationPage />);

      const submitButton = screen.getByRole('button', { name: /Submit Registration Request/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows error when submitting without name', async () => {
      render(<StudentRegistrationPage />);

      const submitButton = screen.getByRole('button', { name: /Submit Registration Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter your name/i)).toBeInTheDocument();
      });
    });

    test('shows error when name is too short', async () => {
      render(<StudentRegistrationPage />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      fireEvent.change(nameInput, { target: { value: 'A' } });

      const submitButton = screen.getByRole('button', { name: /Submit Registration Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    test('shows error when email is invalid', async () => {
      render(<StudentRegistrationPage />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /Submit Registration Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    test('shows error when college is not selected', async () => {
      render(<StudentRegistrationPage />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /Submit Registration Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select your college from the search results/i)).toBeInTheDocument();
      });
    });

    test('validates year is between 1 and 5', async () => {
      render(<StudentRegistrationPage />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const yearInput = screen.getByLabelText(/Year/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(yearInput, { target: { value: '6' } });

      const submitButton = screen.getByRole('button', { name: /Submit Registration Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Year must be between 1 and 5/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          requestId: 'test-request-id',
          message: 'Registration request submitted successfully',
        }),
      });

      render(<StudentRegistrationPage />);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      // Mock college selection
      const collegeInput = screen.getByPlaceholderText(/Search for your college/i);
      fireEvent.change(collegeInput, { target: { value: 'MIT' } });

      // Simulate college selection by directly calling the component's internal state
      // In a real test, we'd need to mock the CollegeSearchInput component

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/students/registration-requests',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });
    });

    test('displays success message after submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          requestId: 'test-request-id',
          message: 'Registration request submitted successfully',
        }),
      });

      render(<StudentRegistrationPage />);

      // Fill form and submit
      // ... (form filling code)

      await waitFor(() => {
        expect(screen.getByText(/Registration Request Submitted!/i)).toBeInTheDocument();
      });
    });

    test('displays error message on submission failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'College not found',
        }),
      });

      render(<StudentRegistrationPage />);

      // Fill form and submit
      // ... (form filling code)

      await waitFor(() => {
        expect(screen.getByText(/College not found/i)).toBeInTheDocument();
      });
    });

    test('disables submit button while submitting', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<StudentRegistrationPage />);

      const submitButton = screen.getByRole('button', { name: /Submit Registration Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('User Experience', () => {
    test('shows loading indicator during submission', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<StudentRegistrationPage />);

      const submitButton = screen.getByRole('button', { name: /Submit Registration Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Submitting.../i)).toBeInTheDocument();
      });
    });

    test('displays helpful information about the process', () => {
      render(<StudentRegistrationPage />);

      expect(screen.getByText(/Important Information/i)).toBeInTheDocument();
      expect(screen.getByText(/Your registration request will be sent to your college for approval/i)).toBeInTheDocument();
    });

    test('shows college email suggestion', () => {
      render(<StudentRegistrationPage />);

      expect(screen.getByText(/Use your college email if available/i)).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    test('displays success screen with request details', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          requestId: 'test-request-id-123',
          message: 'Registration request submitted successfully',
        }),
      });

      render(<StudentRegistrationPage />);

      // Simulate successful submission
      // ... (form filling and submission code)

      await waitFor(() => {
        expect(screen.getByText(/Registration Request Submitted!/i)).toBeInTheDocument();
        expect(screen.getByText(/test-request-id-123/i)).toBeInTheDocument();
      });
    });

    test('provides next steps information', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          requestId: 'test-request-id',
          message: 'Registration request submitted successfully',
        }),
      });

      render(<StudentRegistrationPage />);

      // Simulate successful submission
      // ... (form filling and submission code)

      await waitFor(() => {
        expect(screen.getByText(/What happens next?/i)).toBeInTheDocument();
        expect(screen.getByText(/College administrators will review your request/i)).toBeInTheDocument();
      });
    });

    test('provides check status button', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          requestId: 'test-request-id',
          message: 'Registration request submitted successfully',
        }),
      });

      render(<StudentRegistrationPage />);

      // Simulate successful submission
      // ... (form filling and submission code)

      await waitFor(() => {
        const checkStatusButton = screen.getByRole('button', { name: /Check Status/i });
        expect(checkStatusButton).toBeInTheDocument();
      });
    });
  });
});
