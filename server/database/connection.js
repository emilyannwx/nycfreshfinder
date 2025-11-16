require('dotenv').config(); 
const {Client} = require('pg')
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production'
      ? { require: true, rejectUnauthorized: false }
      : false
  }
});

module.exports = sequelize;




/*
const connectionString = process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB}`;

const client = new Client({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

client.connect().catch(err => {
  console.error('Postgres client connect error', err);
});
/*
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

console.log("DB_PASS is:", typeof process.env.DB_PASSWORD, process.env.DB_PASSWORD);

client.connect();
//

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

*/
