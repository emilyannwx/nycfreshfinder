require('dotenv').config();
const express = require('express');
const app = express();
//const client = require('./server/database/connection')
const session = require('express-session');

app.use(express.static("assets"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');

const router = require('./routes/routes');
/*
// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
