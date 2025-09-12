import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import axios from 'axios';
import { AuthProvider, useAuth } from './auth';

jest.mock('axios');

const localStorageMock = {
    getItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

const TestComponent = () => {
    const [auth, setAuth] = useAuth();
    return (
        <div>
            <div data-testid="user">{auth.user ? auth.user.name : 'null'}</div>
            <div data-testid="token">{auth.token}</div>
            <button onClick={() => setAuth({ user: { name: 'Test User' }, token: 'test-token' })}>
                Update Auth
            </button>
        </div>
    );
};

describe('AuthProvider', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    it("should initialize with null user, empty token and set default axios headers", () => {
        // Arrange & Act
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Assert
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('token')).toHaveTextContent('');
        expect(axios.defaults.headers.common["Authorization"]).toBe('');
    });

    it("should render child components", () => {
        // Arrange & Act
        render(
            <AuthProvider>
                <div data-testid="child">Child Component</div>
            </AuthProvider>
        );

        // Assert
        expect(screen.getByTestId('child')).toBeInTheDocument();
    });
    
    it("should update header on auth state change", () => {
        // Arrange
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Act
        const updateButton = screen.getByText('Update Auth');
        act(() => { //AI was used to generate this: Tool used: Cursor, Prompt: "How can I change the state of the auth context"
            updateButton.click();
        });

        // Assert
        expect(axios.defaults.headers.common["Authorization"]).toBe('test-token');
    });

    describe("local storage handling", () => {
        it("should load local storage on mount", () => {
            // Arrange
            const mockAuthData = {
                user: { name: 'Jakob Landbrecht', email: 'jakob.landbrecht@gmail.com' },
                token: 'mock-token'
            };
            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));

            // Act
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Assert
            expect(localStorageMock.getItem).toHaveBeenCalledWith('auth');
            expect(screen.getByTestId('user')).toHaveTextContent('Jakob Landbrecht');
            expect(screen.getByTestId('token')).toHaveTextContent('mock-token');
        });

        it("should handle empty local storage", () => {
            // Arrange
            localStorageMock.getItem.mockReturnValue(null);

            // Act
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Assert
            expect(localStorageMock.getItem).toHaveBeenCalledWith('auth');
            expect(screen.getByTestId('user')).toHaveTextContent('null');
            expect(screen.getByTestId('token')).toHaveTextContent('');
        });

        it("should handle invalid local storage data", () => {
            // Arrange
            localStorageMock.getItem.mockReturnValue('invalid-json');
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Act
            render(
                <AuthProvider>
                    <TestComponent />
                </AuthProvider>
            );

            // Assert
            expect(localStorageMock.getItem).toHaveBeenCalledWith('auth');
            expect(screen.getByTestId('user')).toHaveTextContent('null');
            expect(screen.getByTestId('token')).toHaveTextContent('');
            expect(consoleSpy).toHaveBeenCalled();
            
            // Cleanup
            consoleSpy.mockRestore();
        });
    });
});