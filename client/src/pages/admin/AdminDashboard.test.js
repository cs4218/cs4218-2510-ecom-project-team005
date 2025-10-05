import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import AdminDashboard from './AdminDashboard';

jest.mock('../../context/auth', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/AdminMenu', () => ({ children}) => <div>{children}</div>);
jest.mock("./../../components/Layout", () => ({ children }) => <div>{children}</div>);

const {useAuth} = jest.requireMock("../../context/auth");

describe('AdminDashboard Component', () => {

    it("Should render AdminDashboard component with AdminMenu and AdminInfo", () => {
        // Arrange
        const authMock = {
            user: {
                name: 'Jakob Landbrecht',
                email: 'jakob.landbrecht@gmail.com',
                phone: '1234567890'
            }
        };
        useAuth.mockReturnValue([authMock, jest.fn()]);

        // Act
        render(
            <MemoryRouter>
              <AdminDashboard />
            </MemoryRouter>
          );

        // Assert
        expect(screen.getByText('Admin Name : Jakob Landbrecht')).toBeInTheDocument();
        expect(screen.getByText('Admin Email : jakob.landbrecht@gmail.com')).toBeInTheDocument();
        expect(screen.getByText('Admin Contact : 1234567890')).toBeInTheDocument();
    });
})