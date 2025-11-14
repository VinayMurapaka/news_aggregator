import React from "react";

function EverythingCard(props) { 
  const { title, imgUrl, description, url, source, author, publishedAt, onSave, saved } = props;

  const articleData = { 
    title, 
    description, 
    urlToImage: imgUrl, 
    url, 
    source, 
    author, 
    publishedAt 
  };

  return (
    <div
      className="everything-card mt-10 relative"
      style={{
        fontSize: "0.85rem",
        minHeight: "390px",
        maxWidth: "320px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative"
      }}
    >
      <div className="flex flex-wrap p-4 gap-1 mb-1" style={{ fontSize: "0.85rem" }}>
        <b className="title" style={{ fontSize: "1.05rem" }}>{title}</b>
        <div className="everything-card-img mx-auto">
          <img className="everything-card-img" src={imgUrl} alt="img" />
        </div>
        <div className="description">
          <p className="description-text leading-6" style={{ fontSize: "0.84rem" }}>
            {description?.substring(0, 200)}
          </p>
        </div>
        <div className="info w-full mt-2" style={{ fontSize: "0.8rem", wordBreak: "break-word" }}>
          <div className="source-info flex flex-wrap items-center gap-2" style={{ fontSize: "0.8rem" }}>
            <span className="font-semibold">Source:</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="link underline break-words"
              style={{ maxWidth: "120px", display: "inline-block", overflowWrap: "break-word" }}
            >
              {source?.substring(0, 70)}
            </a>
          </div>
          <div className="origin flex flex-col" style={{ fontSize: "0.8rem" }}>
            <p className="origin-item">
              <span className="font-semibold">Author:</span> {author}
            </p>
            <p className="origin-item">
              <span className="font-semibold">Published At:</span> {publishedAt}
            </p>
          </div>
        </div>
      </div>
      {/* Save button at bottom right */}
      <button
        className={`save-article-btn absolute right-4 bottom-4 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition ${
          saved ? "opacity-60 cursor-not-allowed" : ""
        }`}
        // Pass the structured articleData object to onSave
        onClick={() => onSave && onSave(articleData)} 
        disabled={saved}
      >
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

export default EverythingCard;
