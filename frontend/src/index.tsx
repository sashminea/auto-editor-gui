import React from 'react';
import { createRoot } from 'react-dom/client'; // Import the createRoot function from react-dom/client
import ExportXML from './components/ExportXML'; // Import your main component
import NavigationMenuDemo from './components/NavBar'
import './index.css'; // Import your CSS styles
import Layout from './components/Layout'

// Get the root element from the DOM and assert its type
const rootElement = document.getElementById('root') as HTMLElement;

// Ensure the root element is not null
if (rootElement) {
    // Create a root for rendering
    const root = createRoot(rootElement);
    
    // Render the main component inside the root
    root.render(<div>
                    <Layout/>
                </div>
    );
} else {
    console.error('Root element not found');
}
