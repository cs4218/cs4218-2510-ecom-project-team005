import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import AdminMenu from './AdminMenu';

describe('AdminMenu Component', () => { //AI was used to generate some of the test cases: Tool used: Cursor, Prompt: "Write tests for the admin menu simular to the ones for the login screen. Keep it short and precise. Use arrange act assert structure. Focus on the most necessary test like checking if the Header is present and if the navigation works as expected"
    it('renders Admin Panel header', () => {
        // Arrange
        render(
            <MemoryRouter>
                <AdminMenu />
            </MemoryRouter>
        );

        // Act & Assert
        expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    it('renders all navigation links', () => {
        // Arrange
        render(
            <MemoryRouter>
                <AdminMenu />
            </MemoryRouter>
        );

        // Act & Assert
        expect(screen.getByText('Create Category')).toBeInTheDocument();
        expect(screen.getByText('Create Product')).toBeInTheDocument();
        expect(screen.getByText('Products')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('applies correct CSS classes to navigation links', () => {
        // Arrange
        render(
            <MemoryRouter>
                <AdminMenu />
            </MemoryRouter>
        );

        // Act
        const linkTexts = ['Create Category', 'Create Product', 'Products', 'Orders', 'Users'];
        const links = linkTexts.map(text => screen.getByText(text));

        // Assert
        links.forEach(link => {
            expect(link).toHaveClass('list-group-item', 'list-group-item-action');
        });
    });

    it('has correct href attributes for navigation', () => {
        // Arrange
        render(
            <MemoryRouter>
                <AdminMenu />
            </MemoryRouter>
        );

        // Act & Assert
        expect(screen.getByText('Create Category')).toHaveAttribute('href', '/dashboard/admin/create-category');
        expect(screen.getByText('Create Product')).toHaveAttribute('href', '/dashboard/admin/create-product');
        expect(screen.getByText('Products')).toHaveAttribute('href', '/dashboard/admin/products');
        expect(screen.getByText('Orders')).toHaveAttribute('href', '/dashboard/admin/orders');
        expect(screen.getByText('Users')).toHaveAttribute('href', '/dashboard/admin/users');
    });
});