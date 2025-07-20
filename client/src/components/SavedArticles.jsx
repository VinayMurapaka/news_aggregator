import React from "react";
import EverythingCard from "./EverythingCard";

function SavedArticles({ articles, onRemove }) {
  return (
    <div className="container mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Saved Articles</h2>
      {articles.length === 0 ? (
        <p className="text-gray-500">No saved articles.</p>
      ) : (
        <div className="flex flex-wrap gap-6 justify-center">
          {articles.map(article => (
            <div key={article.url} style={{ position: "relative" }}>
              <EverythingCard
                {...article}
                saved={true}
                onSave={null}
              />
              <button
                className="remove-article-btn"
                onClick={() => onRemove(article.url)}
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