import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPageStyle.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Backend URL and query parameters
      const url = `https://your-backend-domain.vercel.app/rest=get?user=${encodeURIComponent(email)}&pass=${encodeURIComponent(password)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          // Assuming data is an array with user details (from SELECT * query)
          toast.success('Login successful!');
          navigate('/view');
        } else {
          toast.error('Invalid email or password');
        }
      } else {
        toast.error('Login failed');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      toast.error('An error occurred while trying to log in');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-button">Login</button>
      </form>
      <ToastContainer />
    </div>
  );
};

export default LoginPage;
