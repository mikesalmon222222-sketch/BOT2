import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar/Navbar';
import TodaysCount from './components/TodaysCount/TodaysCount';
import HuntingData from './components/HuntingData/HuntingData';
import Credentials from './components/Credentials/Credentials';
import './App.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [activeSection, setActiveSection] = useState('today');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'today':
        return <TodaysCount />;
      case 'hunting':
        return <HuntingData />;
      case 'credentials':
        return <Credentials />;
      default:
        return <TodaysCount />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <div className="app">
          <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />
          <main className="main-content">
            <div className="content-wrapper">
              {renderActiveSection()}
            </div>
          </main>
        </div>
      </AppProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;