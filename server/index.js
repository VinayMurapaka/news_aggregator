require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// PRODUCTION CORS CONFIGURATION
app.use(
  cors({
    origin: [
      "https://news-aggregator-ecj4.vercel.app", // your actual Vercel frontend URL
      "http://localhost:5173" // for local development
    ],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if database connection fails
  });

// SCHEMAS & MODELS
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  savedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }]
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});
const User = mongoose.model("User", userSchema);

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

// Utility for News API requests
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
      status: error.response ? error.response.status : 500,
      success: false,
      message: error.response && error.response.data && error.response.data.message ? error.response.data.message : "Failed to fetch data from the API",
      error: error.response ? error.response.data : error.message,
    };
  }
}

// AUTHENTICATION MIDDLEWARE
const auth = (req, res, next) => {
  const token = req.header("x-auth-token") || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (e) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// NEWS API ROUTES
app.get("/all-news", async (req, res) => {
  const pageSize = parseInt(req.query.pageSize) || 80;
  const page = parseInt(req.query.page) || 1;
  const q = req.query.q || "world";
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`;
  const result = await makeApiRequest(url);
  res.status(result.status).json(result);
});

app.get("/top-headlines", async (req, res) => {
  const pageSize = parseInt(req.query.pageSize) || 80;
  const page = parseInt(req.query.page) || 1;
  const category = req.query.category || "general";
  const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`;
  const result = await makeApiRequest(url);
  res.status(result.status).json(result);
});

app.get("/country/:iso", async (req, res) => {
  const pageSize = parseInt(req.query.pageSize) || 80;
  const page = parseInt(req.query.page) || 1;
  const country = req.params.iso.toLowerCase();
  let url = `https://newsapi.org/v2/top-headlines?country=${country}&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`;
  let result = await makeApiRequest(url);
  if (result.success && result.data.articles.length === 0) {
    const fallbackUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(country)}&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`;
    result = await makeApiRequest(fallbackUrl);
  }
  res.status(result.status).json(result);
});

// AUTH ROUTES
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    user = new User({ username, password });
    await user.save();
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ token, message: "Registration successful" });
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ token, message: "Login successful" });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error during login");
  }
});

// ARTICLE ROUTES (PROTECTED)
app.post("/api/save", auth, async (req, res) => {
  try {
    const { url } = req.body;
    const user = await User.findById(req.user.id).populate("savedArticles");
    if (user.savedArticles.some((article) => article.url === url)) {
      return res.status(409).json({ message: "Article already saved" });
    }
    const newArticle = new Article(req.body);
    await newArticle.save();
    user.savedArticles.push(newArticle._id);
    await user.save();
    res.json(newArticle);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error saving article" });
  }
});

app.get("/api/saved", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("savedArticles");
    res.json(user.savedArticles);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error fetching saved articles" });
  }
});

app.delete("/api/saved/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const articleId = req.params.id;
    await Article.findByIdAndDelete(articleId);
    user.savedArticles = user.savedArticles.filter(
      (article) => article.toString() !== articleId
    );
    await user.save();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error deleting article" });
  }
});

// Health Check Endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
