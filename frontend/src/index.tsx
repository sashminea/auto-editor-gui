import React from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root') as HTMLElement;

if (rootElement) {
    createRoot(rootElement).render(
        <ErrorBoundary>
            <Layout />
        </ErrorBoundary>
    );
} else {
    console.error('Root element not found');
}