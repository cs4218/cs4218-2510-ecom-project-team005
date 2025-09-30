import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Users from './Users';

// Mock Layout and AdminMenu so the test doesn't try to render full app
jest.mock('../../components/Layout', () => ({ children, title }) => (
    <div data-testid="layout">{children}</div>
));

jest.mock('../../components/AdminMenu', () => () => <div data-testid="admin-menu" />);

describe('Users Component', () => {
    it('renders correctly with Layout and AdminMenu', () => {
        const { getByText, getByTestId } = render(
            <MemoryRouter>
                <Users />
            </MemoryRouter>
        );

        // Check Layout wrapper
        expect(getByTestId('layout')).toBeInTheDocument();

        // Check AdminMenu
        expect(getByTestId('admin-menu')).toBeInTheDocument();

        // Check main content
        expect(getByText(/All Users/i)).toBeInTheDocument();
    });
});




/*
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Users from './Users';
import Layout from '../../components/Layout';
import AdminMenu from '../../components/AdminMenu';

// AdminMenu mocken, weil wir es nicht testen wollen
jest.mock('../../components/AdminMenu', () => () => <div data-testid="admin-menu" />);

describe('Users Component', () => {
    it('renders without crashing', () => {
        // Technique: Statement coverage / smoke test
        const { getByText } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText('All Users')).toBeInTheDocument();
    });

    it('includes Layout with correct title', () => {
        // Technique: Specification-based / structural test
        const { container } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        // Prüfen, dass Layout gerendert wurde
        const layoutTitle = container.querySelector('title');
        // Da unser Layout vermutlich document.title setzt, könnten wir auch testen:
        // expect(document.title).toBe('Dashboard - All Users')
        // Aber hier einfach check, dass es existiert
        expect(container).toBeTruthy();
    });

    it('renders AdminMenu component', () => {
        // Technique: Statement/structural coverage
        const { getByTestId } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByTestId('admin-menu')).toBeInTheDocument();
    });

    it('renders correct grid layout', () => {
        // Technique: Specification-based / structural test
        const { container } = render(
            <MemoryRouter initialEntries={['/users']}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                </Routes>
            </MemoryRouter>
        );

        // Prüfen, dass die Bootstrap-Klassen korrekt sind
        expect(container.querySelector('.container-fluid')).toBeInTheDocument();
        expect(container.querySelector('.row')).toBeInTheDocument();
        expect(container.querySelector('.col-md-3')).toBeInTheDocument();
        expect(container.querySelector('.col-md-9')).toBeInTheDocument();
    });
});
*/