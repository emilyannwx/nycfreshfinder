const express = require('express');
const app = express();
const client = require('./server/database/connection')
const session = require('express-session');


app.use(express.static("assets"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.set('view engine', 'ejs');

const router = require('./routes/routes');

// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));


app.use('/', router);

app.listen(3000);

/* 
http://localhost:3000/
*/