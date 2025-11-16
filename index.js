require('dotenv').config();
const express = require('express'); 
const app = express();
const path = require('path');
//const client = require('./server/database/connection')
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session); 
const PORT = process.env.PORT || 3000;

// import sequelize + models from models.js
const {
  sequelize,
  User,
  FoodLocation,
  FoodPrice,
  FoodDesert,
  Review,
  SavedLocation,
  CommunityResource
} = require('./server/model/model.js');

app.use(express.static("assets"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//app.set('view engine', 'ejs');

// Serve webpages folder
app.use(express.static(path.join(__dirname, 'webpages')));
// Serve assets folder
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const router = require('./routes/routes');

// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
/*
// Use environment-backed session secret
app.use(session({
    secret: process.env.SESSION_SECRET || 'local-dev-secret',
    resave: false,
    saveUninitialized: true
}));

app.use('/', router);
*/

//app.listen(3000);

// Use Postgres-backed session store
app.use(session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // required for Render Postgres
  }),
  secret: process.env.SESSION_SECRET || 'local-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // ensures cookies are only sent over HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

app.use('/', router);

//Connect to DB and sync models before starting server
sequelize.authenticate()
  .then(() => {
    console.log('Database connected');

    return sequelize.sync({ alter: true }); // sync all models
  })
  .then(() => {
    console.log('Models synced');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database error:', err);
  });

/*
    console.error('Database error:', err);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
*/
