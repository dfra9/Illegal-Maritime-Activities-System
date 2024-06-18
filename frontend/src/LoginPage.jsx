import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPageStyle.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    let circles = [];
    const numCircles = 50;
    const speed = 1;

    function getRandomBlueColor() {
      const blue = Math.floor(Math.random() * 256);
      return `rgb(0, 0, ${blue})`;
    }

    function createCircle() {
      let radius = Math.random() * 20 + 10;
      let x = Math.random() * (canvas.width - 2 * radius) + radius;
      let y = Math.random() * (canvas.height - 2 * radius) + radius;
      let dx = (Math.random() - 0.5) * speed;
      let dy = (Math.random() - 0.5) * speed;
      let color = getRandomBlueColor();

      return { x, y, dx, dy, radius, color };
    }

    function isOverlapping(newCircle) {
      for (let circle of circles) {
        let dist = Math.hypot(newCircle.x - circle.x, newCircle.y - circle.y);
        if (dist < newCircle.radius + circle.radius) {
          return true;
        }
      }
      return false;
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      circles = [];
      while (circles.length < numCircles) {
        let newCircle = createCircle();
        if (!isOverlapping(newCircle)) {
          circles.push(newCircle);
        }
      }
      drawCircles();
    }

    function drawCircles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      circles.forEach(circle => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = circle.color;
        ctx.fill();
        ctx.closePath();
      });
    }

    function updatePositions() {
      circles.forEach(circle => {
        if (circle.x + circle.radius > canvas.width || circle.x - circle.radius < 0) {
          circle.dx = -circle.dx;
        }
        if (circle.y + circle.radius > canvas.height || circle.y - circle.radius < 0) {
          circle.dy = -circle.dy;
        }
        circle.x += circle.dx;
        circle.y += circle.dy;
      });
    }

    function animate() {
      drawCircles();
      updatePositions();
      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`https://illegal-maritime-activities-system-server.glitch.me/api/user/${email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.password === password) {
          toast.success('Login successful!');
          login();
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

  const handleRegister = async () => {
    try {
      const response = await fetch('https://illegal-maritime-activities-system-server.glitch.me/api/unverified_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (response.ok) {
        toast.success('Registration successful! Please wait for admin confirmation before logging in');
      } else {
        toast.error('Registration failed');
      }
    } catch (err) {
      console.error('Error registering:', err);
      toast.error('An error occurred while trying to register');
    }
  };

  return (
    <div className="login-container">
      <canvas id="canvas"></canvas>
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
        <div className="button-group">
          <button type="submit" className="submit-button">Login</button>
          <button type="button" className="register-button" onClick={handleRegister}>Register</button>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default LoginPage;
