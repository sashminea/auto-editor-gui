import React from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';

const rootElement = document.getElementById('root') as HTMLElement;

if (rootElement) {
    createRoot(rootElement).render(<Layout />);
} else {
    console.error('Root element not found');
}