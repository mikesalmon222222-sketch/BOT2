import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar/Navbar';
import TodaysCount from './components/TodaysCount/TodaysCount';
import HuntingData from './components/HuntingData/HuntingData';
import Credentials from './components/Credentials/Credentials';
import './App.css';

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
  );
}

export default App;