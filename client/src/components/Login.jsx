import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Add this line for your backend from Vite env
const API_URL = import.meta.env.VITE_API_URL;

const Login = ({ setAuth }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const url = isLogin
            ? `${API_URL}/api/auth/login`
            : `${API_URL}/api/auth/register`;

        if (username.length === 0 || password.length === 0) {
            setLoading(false);
            return setError("Please fill out this field.");
        }
        const payload = {
            username: username,
            password: password,
            email: username
        };

        try {
            console.log("Sending request to:", url);
            console.log("With data:", payload);

            const response = await axios.post(url, payload);

            console.log("Response received:", response);
            const token = response.data.token;
            console.log("Token received:", token);

            if (token) {
                localStorage.setItem('token', token);
                if (typeof setAuth === 'function') setAuth(true);
                navigate('/');
            } else {
                setError(response.data.message || "No token received.");
            }
        } catch (err) {
            // Improved error handling
            console.error("Authentication Error Details:", err.response || err);
            let errorMessage = 'Authentication failed. Check credentials.';
            if (err.response) {
                errorMessage =
                    `Error ${err.response.status}: ` +
                    (err.response.data?.message || JSON.stringify(err.response.data) || errorMessage);
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        }
        setLoading(false);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                    {isLogin ? 'Login' : 'Create Account'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm transition-all duration-300">
                            {error}
                        </p>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>
                <p 
                    className="mt-6 text-center text-sm text-indigo-600 cursor-pointer hover:text-indigo-800 transition duration-150" 
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                >
                    {isLogin ? 'Need an account? Register here.' : 'Already have an account? Login here.'}
                </p>
            </div>
        </div>
    );
};

export default Login;
