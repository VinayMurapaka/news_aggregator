require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
// NEW: Import bcryptjs for password hashing and jsonwebtoken for authentication
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection using .env variable
// The useNewUrlParser and useUnifiedTopology options are deprecated and have been removed
mongoose.connect(process.env.MONGODB_URI)
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// ===================================
// NEW: User Schema and Model
// ===================================

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Link saved articles to the specific user
  savedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = mongoose.model("User", userSchema);

// ===================================
// Existing Article Schema
// ===================================
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

// MODIFIED: Added detailed error logging for News API failures
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
        // --- CRUCIAL LOGGING ADDED HERE ---
        if (error.response) {
            console.error("News API Error Status:", error.response.status);
            console.error("News API Error Data:", error.response.data);
            // Pass the API's specific message back to the frontend if available
            const apiErrorMessage = error.response.data.message || 'Error fetching data';
            
            res.json({
                status: error.response.status,
                success: false,
                message: apiErrorMessage,
                error: `News API responded with status ${error.response.status}`,
            });
        } else {
            console.error("Network Error during News Fetch:", error.message);
            res.json({
                status: 500,
                success: false,
                message: "Network Error: Could not reach external News API.",
                error: error.message,
            });
        }
        // --- END CRUCIAL LOGGING ---
    });
}

// ===================================
// NEW: Authentication Middleware
// ===================================

// Verifies the JWT and attaches user ID to req.user
const auth = (req, res, next) => {
  // Get token from header (using common convention 'x-auth-token')
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // decoded.user contains { id: userId }
    next();
  } catch (e) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};


// ===================================
// Existing News API Routes
// ===================================

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


// ===================================
// NEW: User Authentication Routes
// ===================================

// @route   POST /api/auth/register
// @desc    Register new user
app.post("/api/auth/register", async (req, res) => {
  try {
    // Destructure all potentially sent fields, including 'email' from the frontend fix
    const { username, password, email } = req.body; 
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }
    
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // When saving, Mongoose ignores the extra 'email' field since it's not in the schema.
    // We rely on the database collection being dropped to clear the old index.
    user = new User({ username, password }); 
    await user.save();
    
    // Generate JWT
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, message: "Registration successful" });
      }
    );
  } catch (err) {
    // Log the full error object for debugging
    console.error("Registration error:", err);
    
    // *** Provide a helpful error message for the E11000 issue ***
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
        return res.status(400).json({ 
            message: "Registration failed. Database requires unique Email field. Please drop the 'users' collection in MongoDB Atlas to clear the old 'email' index.", 
            error: err.errmsg
        });
    }
    
    // Handle MongoDB validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", error: err.message });
    }
    // Handle MongoDB connection errors
    if (err.name === "MongoError" || err.message.includes("failed to connect")) {
      return res.status(500).json({ message: "Database connection error. Check MongoDB URI and Atlas IP Whitelist.", error: err.message });
    }
    // Return a JSON error message to the frontend
    res.status(500).json({ message: "Server error during registration", error: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare plain text password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, message: "Login successful" });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error during login");
  }
});


// ===================================
// UPDATED: Protected Article Routes (Require 'auth' middleware)
// ===================================

// Save article (Now links to the authenticated user)
app.post("/api/save", auth, async (req, res) => {
  try {
    const { url } = req.body;
    // Find the user by ID provided in the token and populate their saved articles
    const user = await User.findById(req.user.id).populate("savedArticles");
    
    // Check if the article is already saved by this user
    if (user.savedArticles.some((article) => article.url === url)) {
      return res.status(409).json({ message: "Article already saved" });
    }

    const newArticle = new Article(req.body);
    await newArticle.save();
    
    // Add the new article ID to the user's savedArticles array
    user.savedArticles.push(newArticle._id);
    await user.save();

    res.json(newArticle);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error saving article" });
  }
});

// Get saved articles (Now returns articles only for the authenticated user)
app.get("/api/saved", auth, async (req, res) => {
  try {
    // Find the user and load only their associated articles
    const user = await User.findById(req.user.id).populate("savedArticles");
    res.json(user.savedArticles);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error fetching saved articles" });
  }
});

// Remove saved article (Now specific to the authenticated user)
app.delete("/api/saved/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const articleId = req.params.id;
    
    // Remove article from the general Article collection
    await Article.findByIdAndDelete(articleId);

    // Remove the reference from the user's savedArticles array
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

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
