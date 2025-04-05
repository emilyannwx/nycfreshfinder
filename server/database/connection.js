require('dotenv').config();
const {Client} = require('pg')

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    ssl: {
        rejectUnauthorized: false, // !!! ONLY FOT TESTING !!!; CA certificate in production.
    },
})

client.connect();

// client.query(`Select * from "Users"`, (err, res) => {
//     if(!err)
//     {
//         console.log(res.rows);
//     }
//     else
//     {
//         console.log("Error");
//         console.log(err.message);
//     }
//     client.end;
// })

module.exports = client;

