require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

// CORS configuration
app.use(
  cors({
    origin: "*", // Be cautious in production
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper function for API requests
async function makeApiRequest(url) {
  try {
    const response = await axios.get(url);
    return {
      status: 200,
      success: true,
      message: "Successfully fetched the data",
      data: response.data,
    };
  } catch (error) {
    console.error("API request error:", error.response ? error.response.data : error);
    return {
      status: 500,
      success: false,
      message: "Failed to fetch data from the API",
      error: error.response ? error.response.data : error.message,
    };
  }
}

// Fetch all news by query
app.get("/all-news", async (req, res) => {
  const pageSize = parseInt(req.query.pageSize) || 80;
  const page = parseInt(req.query.page) || 1;
  const q = req.query.q || "world"; // Default search query

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    q
  )}&page=${page}&pageSize=${pageSize}&apiKey=${process.env.API_KEY}`;
  const result = await makeApiRequest(url);
  res.status(result.status).json(result);
});

// Fetch top headlines by category
app.get("/top-headlines", async (req, res) => {
  const pageSize = parseInt(req.query.pageSize) || 80;
  const page = parseInt(req.query.page) || 1;
  const category = req.query.category || "general";

  const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&page=${page}&pageSize=${pageSize}&apiKey=${process.env.API_KEY}`;
  const result = await makeApiRequest(url);
  res.status(result.status).json(result);
});

// Fetch country-specific news with fallback
app.get("/country/:iso", async (req, res) => {
  const pageSize = parseInt(req.query.pageSize) || 80;
  const page = parseInt(req.query.page) || 1;
  const country = req.params.iso.toLowerCase(); // Ensure lowercase ISO code

  // First try top-headlines
  let url = `https://newsapi.org/v2/top-headlines?country=${country}&page=${page}&pageSize=${pageSize}&apiKey=${process.env.API_KEY}`;
  let result = await makeApiRequest(url);

  // Fallback: if no articles, search with country name
  if (result.success && result.data.articles.length === 0) {
    console.log(`No top-headlines for ${country}, falling back to search`);
    const fallbackUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      country
    )}&page=${page}&pageSize=${pageSize}&apiKey=${process.env.API_KEY}`;
    result = await makeApiRequest(fallbackUrl);
  }

  res.status(result.status).json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server is running at port ${PORT}`);
});
