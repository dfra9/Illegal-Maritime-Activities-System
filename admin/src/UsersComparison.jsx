import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UsersComparison.css'; // Import your CSS file for styling

const API_URL = 'https://illegal-maritime-activities-system-server.glitch.me/api';

const UsersComparison = () => {
  const [unverifiedUsers, setUnverifiedUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [editingUnverifiedUser, setEditingUnverifiedUser] = useState(null); // Editing state for unverified users
  const [editingVerifiedUser, setEditingVerifiedUser] = useState(null); // Editing state for verified users

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const unverifiedResponse = await axios.get(`${API_URL}/unverified_users`);
        const verifiedResponse = await axios.get(`${API_URL}/users`);

        setUnverifiedUsers(unverifiedResponse.data);
        setVerifiedUsers(verifiedResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      }
    };

    fetchUsers();
  }, []);

  const handlePush = async (user) => {
    try {
      const existingUser = verifiedUsers.find(u => u.email === user.email);
      if (existingUser) {
        toast.error(`Email ${user.email} already exists in verified users.`);
        return;
      }
  
      await axios.post(`${API_URL}/push_user`, {
        email: user.email,
        password: user.password,
      });
  
      const updatedUnverifiedUsers = unverifiedUsers.filter(u => u.id !== user.id);
      setUnverifiedUsers(updatedUnverifiedUsers);
  
      const verifiedResponse = await axios.get(`${API_URL}/users`);
      setVerifiedUsers(verifiedResponse.data);
  
      toast.success(`User ${user.email} pushed to verified users.`);
    } catch (error) {
      console.error('Error pushing user:', error.response || error.message);
      toast.error('Failed to push user');
    }
  };

  const handleUpdate = (user, type) => {
    if (type === 'unverified') {
      setEditingUnverifiedUser(user);
    } else if (type === 'verified') {
      setEditingVerifiedUser(user);
    }
  };

  const handleSaveUpdate = async (user, type) => {
    try {
      await axios.put(`${API_URL}/update_user/${user.id}`, user);

      if (type === 'unverified') {
        const updatedUnverifiedUsers = unverifiedUsers.map(u => u.id === user.id ? user : u);
        setUnverifiedUsers(updatedUnverifiedUsers);
        setEditingUnverifiedUser(null);
      } else if (type === 'verified') {
        const updatedVerifiedUsers = verifiedUsers.map(u => u.id === user.id ? user : u);
        setVerifiedUsers(updatedVerifiedUsers);
        setEditingVerifiedUser(null);
      }

      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleCancelUpdate = (type) => {
    if (type === 'unverified') {
      setEditingUnverifiedUser(null);
    } else if (type === 'verified') {
      setEditingVerifiedUser(null);
    }
  };

  const handleDelete = async (userId, type) => {
    try {
      // Ensure type is either 'user' or 'unverified_user'
      await axios.delete(`${API_URL}/delete_${type}_user/${userId}`);
  
      if (type === 'unverified') {
        const updatedUnverifiedUsers = unverifiedUsers.filter(u => u.id !== userId);
        setUnverifiedUsers(updatedUnverifiedUsers);
      } else if (type === 'verified') {
        const updatedVerifiedUsers = verifiedUsers.filter(u => u.id !== userId);
        setVerifiedUsers(updatedVerifiedUsers);
      }
  
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };
  

  const handleInputChange = (e, fieldName, user, type) => {
    const updatedUser = { ...user, [fieldName]: e.target.value };
    if (type === 'unverified') {
      setEditingUnverifiedUser(updatedUser);
    } else if (type === 'verified') {
      setEditingVerifiedUser(updatedUser);
    }
  };

  return (
    <div className="users-comparison">
      <ToastContainer />
      <div className="table-container">
        <h2>Unverified Users</h2>
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Password</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {unverifiedUsers.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  {editingUnverifiedUser && editingUnverifiedUser.id === user.id ?
                    <input
                      type="text"
                      value={editingUnverifiedUser.email}
                      onChange={(e) => handleInputChange(e, 'email', editingUnverifiedUser, 'unverified')}
                    />
                    : user.email
                  }
                </td>
                <td>
                  {editingUnverifiedUser && editingUnverifiedUser.id === user.id ?
                    <input
                      type="text"
                      value={editingUnverifiedUser.password}
                      onChange={(e) => handleInputChange(e, 'password', editingUnverifiedUser, 'unverified')}
                    />
                    : user.password
                  }
                </td>
                <td>{user.created_at}</td>
                <td>
                  {editingUnverifiedUser && editingUnverifiedUser.id === user.id ?
                    <>
                      <button onClick={() => handleSaveUpdate(editingUnverifiedUser, 'unverified')}>Save</button>
                      <button onClick={() => handleCancelUpdate('unverified')}>Cancel</button>
                    </>
                    :
                    <>
                      <button onClick={() => handlePush(user)}>Push</button>
                      <button onClick={() => handleUpdate(user, 'unverified')}>Update</button>
                      <button onClick={() => handleDelete(user.id, 'unverified')}>Delete</button>
                    </>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-container">
        <h2>Verified Users</h2>
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifiedUsers.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  {editingVerifiedUser && editingVerifiedUser.id === user.id ?
                    <input
                      type="text"
                      value={editingVerifiedUser.email}
                      onChange={(e) => handleInputChange(e, 'email', editingVerifiedUser, 'verified')}
                    />
                    : user.email
                  }
                </td>
                <td>
                  {editingVerifiedUser && editingVerifiedUser.id === user.id ?
                    <input
                      type="text"
                      value={editingVerifiedUser.password}
                      onChange={(e) => handleInputChange(e, 'password', editingVerifiedUser, 'verified')}
                    />
                    : user.password
                  }
                </td>
                <td>
                  {editingVerifiedUser && editingVerifiedUser.id === user.id ?
                    <>
                      <button onClick={() => handleSaveUpdate(editingVerifiedUser, 'verified')}>Save</button>
                      <button onClick={() => handleCancelUpdate('verified')}>Cancel</button>
                    </>
                    :
                    <>
                      <button onClick={() => handleUpdate(user, 'verified')}>Update</button>
                      <button onClick={() => handleDelete(user.id, 'verified')}>Delete</button>
                    </>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersComparison;
