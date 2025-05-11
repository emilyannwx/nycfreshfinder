const express = require('express');
const svgCaptcha = require('svg-captcha');
const { generateCaptcha, verifyCaptcha } = require('./captchaMiddleware');
const client = require('../server/database/connection');
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authenticateToken = require('../routes/authenticateToken');
const crypto = require("crypto");
const nodemailer = require("nodemailer");


// Import Database Entities
const { 
    sequelize, 
    User, 
    FoodLocation, 
    FoodPrice, 
    FoodDesert, 
    Review, 
    SavedLocation, 
    CommunityResource } = require("../server/model/model");


// Generate CAPTCHA
router.get('/api/captcha', generateCaptcha, (req, res) => {
    res.type('svg').send(res.locals.captchaData);
});

// JWT Middleware
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    try 
    {
      const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } 
    catch (err) 
    {
      res.status(401).json({ message: "Invalid token" });
    }
};

/* 
    Load Pages
*/

// Home Page
router.get('/', (req, res) => {
    res.render('index');
});

// Maps Page
router.get('/map', (req, res) => {
    res.render('map');
});

// Analysis Page
router.get('/analysis', (req, res) => {
    res.render('analysis');
});

// Compare Page
router.get('/compare', (req, res) => {
    res.render('compare');
});

// Resources Page
router.get('/resources', (req, res) => {
    res.render('resources');
});

// Get Saved Locations
router.get("/api/get_saved_locations", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const savedLocation = await SavedLocation.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: FoodLocation,
                    attributes: ['name', 'address'] // only get needed fields
                }
            ]
        });

        res.json({ savedLocation });
    } 
    catch (err) 
    {
        console.error("Error retrieving locations:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Show all locations
router.get('/api/locations', async (req, res) => {
    try {
      const locations = await FoodLocation.findAll();
      res.json(locations);
    } 
    catch (err) 
    {
      console.error("Error fetching locations:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  

// Get Locations on Map Page
router.get("/api/get_locations/search", async (req, res) => {
    try 
    {
        console.log(req.query.search);
        const zip_code = req.query.search;

        const locations = await FoodLocation.findAll({
            where: {
                zip_code: zip_code
            }
        });

        const locationIds = locations.map(loc => loc.location_id);

        const reviews = await Review.findAll({
            where: {
              location_id: locationIds
            }
        });

        return res.json({ locations, reviews });
    } 
    catch (err) 
    {
        console.error("Error retrieving locations:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

// Get Reviews
router.get("/api/get_reviews", async (req, res) => {
    try {
        const { name } = req.query;

        const location = await FoodLocation.findOne({
            where: { name }
        });

        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }

        const reviews = await Review.findAll({
            where: { location_id: location.location_id }
        });

        const userIds = [...new Set(reviews.map(r => r.user_id))]; // unique user IDs

        const users = await User.findAll({
            where: { user_id: userIds }
        });


        return res.json({ reviews, users });
  
    } catch (err) {
      console.error("Error getting reviews:", err);
      return res.status(500).json({ message: "Server error" });
    }
});
  

// Edit User
router.put("/api/edit_user", async (req, res) => {
    try 
    {
        const { email, username, password, zip_code } = req.body;

        if (!username || !password || !email || !zip_code) {
            return res.status(400).json({ error: "username and password are required." });
        }
        
        const updatedAt = new Date()

        // Insert into the database
        const newUser = await client.query(
            'INSERT INTO "Users" (username, email, password, zip_code, "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [username, email, password, zip_code, updatedAt]
        );
        res.status(201).json({ message: "User added successfully!", user: newUser.rows[0] });
    } 
    catch (err) 
    {
        console.error(err.message);
        res.status(500).json({ error: "Unable to add user." });
    }
});

// Create User
router.post('/api/new_user', async (req, res) => {
    try 
    {
        console.log(req.body);
        const { email, username, password, zip_code } = req.body;

        if (!username || !password || !email || !zip_code) {
            return res.status(400).json({ error: "username and password are required." });
        }
        
        const createdAt = new Date()

        // Encrpyt password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into the database
        const newUser = await client.query(
            'INSERT INTO "Users" (username, email, password, zip_code, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [username, email, hashedPassword, zip_code, createdAt, createdAt]
        );

        res.redirect("/");
    } 
    catch (err) 
    {
        console.error(err.message);
        res.status(500).json({ error: "Unable to add user." });
    }
});

// Sign In
router.post('/api/signin', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Find user by username
        const user = await User.findOne({ where: { username } });

        if (!user)
        {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        
        
        if (!isMatch)
        {
            return res.status(400).json({ message: "Invalid credentials" });  
        } 
            
        // Generate JWT Token (Fix this later)
        const jwtSecret = process.env.JWT_SECRET || "fake_key";

        // const token = jwt.sign({ userId: user.user_id }, jwtSecret, { expiresIn: "1h" });

        const token = jwt.sign({ userId: user.user_id }, jwtSecret);

        return res.json({ token, message: "Sign-in successful"});

    } 
    catch (err)
    {
        console.log(err);
    }
});

// Forgot Password
router.post('/api/request_new_password', async (req, res) => {
    const { email, username, zip_code } = req.body;

    try {
        const user = await User.findOne({ where: { email, username, zip_code } });

        if (!user) return res.status(404).json({ message: "User not found" });

        // Generate token
        const token = crypto.randomBytes(32).toString("hex");
        const tokenExpires = Date.now() + 3600000; // 1 hour from now

        await user.update({
            reset_token: token,
            reset_token_expiry: tokenExpires
        });

        // Send email
        const resetLink = `https://domain.com/reset-password?token=${token}`; // 
        
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            to: user.email,
            subject: "Password Reset Request",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        });

        return res.status(200).json({ message: "Reset email sent" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }

});

// Toggle FoodLocation Save/Unsave
router.post("/api/toggle_location", async (req, res) => {
    try {
        
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "Unauthorized: No token provided" });

        // verify token
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, "fake_key");
        const userId = decoded.userId;

        // Get name and address from request body
        const { name, address } = req.body;
        if (!name || !address) 
        {
            return res.status(400).json({ message: "Location name and address are required" });
        }

        // Check if the user exists
        const user = await User.findByPk(userId);
        if (!user) 
        {
            return res.status(404).json({ message: "User not found" });
        }

        // Find or create the FoodLocation
        let foodLocation = await FoodLocation.findOne({ where: { name, address } });
        if (!foodLocation) {
            foodLocation = await FoodLocation.create({ name, address });
        }

        // Check if already saved
        const existingSaved = await SavedLocation.findOne({
            where: { user_id: userId, location_id: foodLocation.location_id },
        });

        if (existingSaved) {
            // Unsave if already saved
            await existingSaved.destroy();
            return res.status(200).json({ message: "Location unsaved" });
        } 
        else 
        {
            // Save if not saved yet
            await SavedLocation.create({
                user_id: userId,
                location_id: foodLocation.location_id,
            });
            return res.status(201).json({ message: "Location saved" });
        }

    }
    catch (err) 
    {
        console.error("Error toggling food location:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

// Save Review
router.post("/api/review", async (req, res) => {
    try {
        console.log("BODY:", JSON.stringify(req.body));
        // Extract data from request body
        const { name, token, review, price_rating, quality_rating } = req.body;
        const decoded = jwt.verify(token, "fake_key", { ignoreExpiration: true }); // Ensure JWT_SECRET is used
        console.log(decoded);
        const userId = decoded.userId;

        if (!review) {
            return res.status(400).json({ message: "Review cannot be empty" });
        }
    
        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
    
        // Find the food location by name
        const foodLocation = await FoodLocation.findOne({ where: { name } });
        if (!foodLocation) return res.status(404).json({ message: "Food location not found" });
    
        // Save review in the database
        await Review.create({
            user_id: userId,
            location_id: foodLocation.location_id,
            comment: review,  // Ensure review text is saved
            price_rating: price_rating,  // Save ratingm
            quality_rating: quality_rating,
        });

        return res.json({ user, message: "Sign-in successful"});
    } 
    catch (err) 
    {
        console.error("Error saving review:", err);
        return res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;