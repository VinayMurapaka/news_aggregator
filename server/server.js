require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection using .env variable
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Article Schema
const articleSchema = new mongoose.Schema({
  title: String,
  imgUrl: String,
  description: String,
  url: String,
  source: String,
  author: String,
  publishedAt: String,
});

const Article = mongoose.model("Article", articleSchema);

const API_KEY = process.env.API_KEY;

function fetchNews(url, res) {
  axios
    .get(url)
    .then((response) => {
      if (response.data.totalResults > 0) {
        res.json({
          status: 200,
          success: true,
          message: "Successfully fetched the data",
          data: response.data,
        });
      } else {
        res.json({
          status: 200,
          success: true,
          message: "No data found",
        });
      }
    })
    .catch((error) => {
      res.json({
        status: 500,
        success: false,
        message: "Error fetching data",
        error: error.message,
      });
    });
}

app.get("/all-news", (req, res) => {
  const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${API_KEY}`;
  fetchNews(url, res);
});

app.get("/news/:category", (req, res) => {
  const category = req.params.category;
  const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${API_KEY}`;
  fetchNews(url, res);
});

app.get("/search", (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json({
      status: 400,
      success: false,
      message: "Query parameter 'q' is required",
    });
  }
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query
  )}&apiKey=${API_KEY}`;
  fetchNews(url, res);
});

// Save article
app.post("/api/save", async (req, res) => {
  try {
    const exists = await Article.findOne({ url: req.body.url });
    if (exists) return res.status(409).json({ message: "Already saved" });
    const article = new Article(req.body);
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get saved articles
app.get("/api/saved", async (req, res) => {
  const articles = await Article.find();
  res.json(articles);
});

// Remove saved article
app.delete("/api/saved/:id", async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
