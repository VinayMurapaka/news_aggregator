import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EverythingCard from './EverythingCard';
import Loader from './Loader';
import axiosInstance from '../axiosInstance';

// Add API_URL from Vite env
const API_URL = import.meta.env.VITE_API_URL;

function CountryNews({ isAuthenticated }) {
    const params = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saveMessage, setSaveMessage] = useState(null);

    function handlePrev() {
        setPage(page - 1);
    }

    function handleNext() {
        setPage(page + 1);
    }

    const pageSize = 6;

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
        axiosInstance.get(`${API_URL}/country/${params.iso}?page=${page}&pageSize=${pageSize}`)
            .then((response) => {
                const myJson = response.data;
                if (myJson.success) {
                    setTotalResults(myJson.data.totalResults);
                    setData(myJson.data.articles);
                } else {
                    setError(myJson.message || 'An error occurred');
                }
            })
            .catch((error) => {
                console.error('Fetch error:', error);
                setError('Failed to fetch news. Please try again later.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [page, params.iso]);

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
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="my-10 cards grid lg:place-content-center md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 xs:grid-cols-1 xs:gap-4 md:gap-10 lg:gap-14 md:px-16 xs:p-3">
                {!isLoading ? (
                    data.length > 0 ? (
                        data.map((element, index) => (
                            <EverythingCard
                                key={index}
                                title={element.title}
                                description={element.description}
                                imgUrl={element.urlToImage}
                                publishedAt={element.publishedAt}
                                url={element.url}
                                author={element.author}
                                source={element.source.name}
                                onSave={handleSaveArticle}
                                saved={false}
                            />
                        ))
                    ) : (
                        <p>No news articles found for this criteria.</p>
                    )
                ) : (
                    <Loader />
                )}
            </div>
            {!isLoading && data.length > 0 && (
                <div className="pagination flex justify-center gap-14 my-10 items-center">
                    <button
                        disabled={page <= 1}
                        className="pagination-btn"
                        onClick={handlePrev}
                    >
                        Prev
                    </button>
                    <p className="font-semibold opacity-80">
                        {page} of {Math.ceil(totalResults / pageSize)}
                    </p>
                    <button
                        disabled={page >= Math.ceil(totalResults / pageSize)}
                        className="pagination-btn"
                        onClick={handleNext}
                    >
                        Next
                    </button>
                </div>
            )}
        </>
    );
}

export default CountryNews;
