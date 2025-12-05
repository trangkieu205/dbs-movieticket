const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',
  user: 'sa',
  password: 'DB_Password',
  database: 'MovieTicketDB'
});

module.exports = db;
