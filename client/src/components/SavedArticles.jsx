import React, { useState, useEffect } from "react";
import EverythingCard from "./EverythingCard";
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';

// Use backend URL from env
const API_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${API_URL}/api/saved`;

function SavedArticles() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchSavedArticles = async () => {
        setLoading(true);
        setError('');

        if (!localStorage.getItem('token')) {
            setError("You must be logged in to view saved articles.");
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await axiosInstance.get(API_BASE_URL);
            setArticles(response.data);
        } catch (err) {
            console.error("Error fetching saved articles:", err);
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
                setError("Session expired. Please log in again.");
            } else {
                setError("Failed to load saved articles.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedArticles();
    }, []);

    const handleRemoveArticle = async (id) => {
        if (!localStorage.getItem('token')) return;

        try {
            await axiosInstance.delete(`${API_BASE_URL}/${id}`);
            setArticles(articles.filter(article => article._id !== id));
        } catch (err) {
            console.error("Error removing article:", err);
            setError("Failed to remove article.");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto mt-8 text-center text-xl text-indigo-600">
                Loading saved articles...
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto mt-8 text-center text-xl text-red-600">
                {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto mt-8 p-4">
            <br/>
            {articles.length === 0 ? (
                <p className="text-gray-500 text-lg p-4 bg-white rounded-lg shadow">
                    You haven't saved any articles yet.
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {articles.map(article => (
                        <div key={article._id} className="relative group">
                            <EverythingCard
                                {...article}
                                saved={true}
                                onSave={null}
                            />
                            <button
                                className="absolute top-2 right-2 px-3 py-1 bg-red-600 text-white  rounded-full shadow-lg font-semibold text-sm opacity-90 hover:opacity-100 transition duration-300 transform group-hover:scale-105"
                                onClick={() => handleRemoveArticle(article._id)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SavedArticles;
