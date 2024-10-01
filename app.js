// Import required modules
const express = require("express");
const axios = require("axios");
const path = require("path");

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// In-memory cache for card data
let allCards = [];

/**
 * Fetch and cache Hearthstone card data from the API.
 * This function is called at server startup and every 24 hours.
 */
async function fetchAndCacheData() {
  try {
    const response = await axios.get(
      "https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json"
    );
    allCards = response.data;
    console.log("Card data cached successfully.");
  } catch (error) {
    console.error("Error fetching card data:", error.message);
  }
}

// Fetch data at server startup
fetchAndCacheData();

// Refresh data every 24 hours
setInterval(fetchAndCacheData, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

/**
 * Route: GET /
 * Description: Home page with search and filter forms.
 */
app.get("/", (req, res) => {
  res.render("index");
});

/**
 * Route: GET /api/cards/info
 * Description: Provides sets, types, and classes for populating filter options.
 */
app.get("/api/cards/info", (req, res) => {
  const sets = new Set();
  const types = new Set();
  const classes = new Set();

  allCards.forEach((card) => {
    if (card.set) sets.add(card.set);
    if (card.type) types.add(card.type);
    if (card.cardClass) classes.add(card.cardClass);
  });

  res.json({
    sets: Array.from(sets).sort(),
    types: Array.from(types).sort(),
    classes: Array.from(classes).sort(),
  });
});

/**
 * Route: GET /search
 * Description: Search for cards by name.
 * Query Params:
 *   - q: (string) The search term for the card name.
 */
app.get("/search", (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.render("error", { message: "No search query provided." });
  }

  const searchTerm = query.toLowerCase();

  // Filter cards based on the search term
  const matchingCards = allCards.filter(
    (card) => card.name && card.name.toLowerCase().includes(searchTerm)
  );

  if (matchingCards.length === 0) {
    return res.render("error", { message: "No matching cards found." });
  }

  res.render("results", {
    cards: matchingCards,
    title: `Search results for "${query}"`,
  });
});

/**
 * Route: GET /cards/filter
 * Description: Filter cards based on multiple criteria.
 * Query Params:
 *   - set: (string) The card set.
 *   - type: (string) The card type.
 *   - className: (string) The card class.
 *   - cost: (number) The mana cost of the card.
 */
app.get("/cards/filter", (req, res) => {
  let { set, type, className, cost } = req.query;

  let filteredCards = allCards;

  if (set) {
    set = set.toUpperCase();
    filteredCards = filteredCards.filter(
      (card) => card.set && card.set.toUpperCase() === set
    );
  }

  if (type) {
    type = type.toUpperCase();
    filteredCards = filteredCards.filter(
      (card) => card.type && card.type.toUpperCase() === type
    );
  }

  if (className) {
    className = className.toUpperCase();
    filteredCards = filteredCards.filter(
      (card) => card.cardClass && card.cardClass.toUpperCase() === className
    );
  }

  if (cost) {
    if (cost === "10+") {
      filteredCards = filteredCards.filter((card) => card.cost >= 10);
    } else {
      cost = parseInt(cost);
      if (!isNaN(cost)) {
        filteredCards = filteredCards.filter((card) => card.cost === cost);
      }
    }
  }

  res.json(filteredCards);
});

/**
 * Middleware to handle 404 Not Found errors.
 */
app.use((req, res, next) => {
  res.status(404).render("error", { message: "Page not found." });
});

/**
 * Error-handling middleware for server errors.
 */
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err.stack);
  res
    .status(500)
    .render("error", { message: "An internal server error occurred." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
