import { useState } from "react";
import "./App.css";
import Header from "./components/Header";
import AllNews from "./components/AllNews";
import TopHeadlines from "./components/TopHeadlines";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CountryNews from "./components/CountryNews";
import SavedArticles from "./components/SavedArticles";

function App() {
  const [savedArticles, setSavedArticles] = useState([]);

  const handleSaveArticle = (article) => {
    if (!savedArticles.some(a => a.url === article.url)) {
      setSavedArticles([...savedArticles, article]);
    }
  };

  const handleRemoveArticle = (url) => {
    setSavedArticles(savedArticles.filter(a => a.url !== url));
  };

  return (
    <div className="w-full">
      <BrowserRouter>
        <Header savedCount={savedArticles.length} />
        <Routes>
          <Route path="/" element={<AllNews onSave={handleSaveArticle} savedArticles={savedArticles} />} />
          <Route path="/top-headlines/:category" element={<TopHeadlines onSave={handleSaveArticle} savedArticles={savedArticles} />} />
          <Route path="/country/:iso" element={<CountryNews onSave={handleSaveArticle} savedArticles={savedArticles} />} />
          <Route path="/saved" element={<SavedArticles articles={savedArticles} onRemove={handleRemoveArticle} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
