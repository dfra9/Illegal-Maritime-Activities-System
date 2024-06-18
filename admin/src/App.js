import React, { useEffect } from 'react';
import UsersComparison from './UsersComparison';
import './UsersComparison.css';
const App = () => {
  useEffect(() => {
    document.title = "Admin Panel";
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = 'Compare users based on some criteria';
    document.head.appendChild(metaDescription);
    return () => {
      document.head.removeChild(metaDescription);
    };
  }, []);

  return (
    <div className="app">
      <h1>Admin Panel</h1>
      <UsersComparison />
    </div>
  );
};

export default App;
