import React from 'react';
import NavigationMenuDemo from './NavBar';
import AlertDemo from './Alert'
import CardWithForm from './InputCard';
import CardWithArguments from './ArgumentsCard';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col container gap-4">
      {/* Navbar */}
      <NavigationMenuDemo  />
      {/* Main content area */}
      <AlertDemo/>
      <main className="flex sm:flex-row flex-col gap-2">
            <CardWithForm />
            <CardWithArguments/>
            
        </main>
            
    </div>
  );
};

export default Layout;