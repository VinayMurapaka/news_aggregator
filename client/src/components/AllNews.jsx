import React, { useState, useEffect } from 'react';
import EverythingCard from './EverythingCard';
import Loader from './Loader';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance'; // Assumes axiosInstance uses env variable

// Add the API_URL from Vite env
const API_URL = import.meta.env.VITE_API_URL;

function AllNews({ isAuthenticated }) {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveMessage, setSaveMessage] = useState(null);
    const navigate = useNavigate();

    function handlePrev() {
        setPage(page - 1);
    }

    function handleNext() {
        setPage(page + 1);
    }

    let pageSize = 12;

    const handleSaveArticle = async (articleData) => {
        if (!isAuthenticated) {
            setSaveMessage({ type: 'error', text: 'Please log in to save articles.' });
            setTimeout(() => navigate('/login'), 1500);
            return;
        }

        const articleToSave = {
            title: articleData.title,
            description: articleData.description,
            imgUrl: articleData.urlToImage,
            url: articleData.url,
            source: articleData.source,
            author: articleData.author,
            publishedAt: articleData.publishedAt,
        };

        try {
            // Always POST to your backend using absolute URL in production
            const response = await axiosInstance.post(`${API_URL}/api/save`, articleToSave);
            if (response.status === 200 || response.status === 201) {
                setSaveMessage({ type: 'success', text: 'Article saved successfully!' });
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to save article. Try again.';
            setSaveMessage({ type: 'error', text: message });
        } finally {
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        // Always GET from your backend using absolute URL in production
        axiosInstance.get(`${API_URL}/all-news?page=${page}&pageSize=${pageSize}`)
            .then(response => {
                const myJson = response.data;
                if (myJson.success) {
                    setTotalResults(myJson.data.totalResults);
                    setData(myJson.data.articles || []);
                } else {
                    setError(myJson.message || 'An error occurred');
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                setError('Failed to fetch news. Please check your backend server and API key.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [page]);

    return (
        <>
            {saveMessage && (
                <div
                    className={`fixed top-20 right-5 p-3 rounded-lg shadow-xl text-white font-semibold z-50 transition-opacity duration-500 ${
                        saveMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                >
                    {saveMessage.text}
                </div>
            )}
            <h2 className='text-3xl font-bold text-center mt-4'>All News</h2>
            {error && <div className="text-red-500 mb-4 text-center p-4 bg-red-100 rounded-lg mx-auto max-w-lg">**Error Fetching News:** {error}</div>}
            <div className='my-10 cards grid lg:place-content-center md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 xs:grid-cols-1 xs:gap-4 md:gap-10 lg:gap-14 md:px-16 xs:p-3'>
                {!isLoading ? data.map((element, index) => (
                    <EverythingCard
                        title={element.title}
                        description={element.description}
                        imgUrl={element.urlToImage}
                        publishedAt={element.publishedAt}
                        url={element.url}
                        author={element.author}
                        source={element.source.name}
                        key={index}
                        onSave={handleSaveArticle}
                        saved={false}
                    />
                )) : <Loader />}
            </div>
            {!isLoading && data.length > 0 && (
                <div className="pagination flex justify-center gap-14 my-10 items-center">
                    <button disabled={page <= 1} className='pagination-btn text-center' onClick={handlePrev}>&larr; Prev</button>
                    <p className='font-semibold opacity-80'>{page} of {Math.ceil(totalResults / pageSize)}</p>
                    <button className='pagination-btn text-center' disabled={page >= Math.ceil(totalResults / pageSize)} onClick={handleNext}>Next &rarr;</button>
                </div>
            )}
        </>
    );
}

export default AllNews;
