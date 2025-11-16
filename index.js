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

// Use environment-backed session secret
app.use(session({
    secret: process.env.SESSION_SECRET || 'local-dev-secret',
    resave: false,
    saveUninitialized: true
}));
/*
// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
*/

app.use('/', router);

//app.listen(3000);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
/* 
http://localhost:3000/
*/
