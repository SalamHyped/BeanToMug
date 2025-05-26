// dbSingleton.js
const mysql = require('mysql2/promise');

let connection;

const dbSingleton = {
    getConnection: async () => {
        if (!connection) {
            try {
                connection = await mysql.createConnection({
                    host: 'localhost',
                    user: 'root',
                    password: '',
                    database: 'beantomug',
                });
                console.log('Connected to MySQL!');
            } catch (err) {
                console.error('Error connecting to database:', err);
                throw err;
            }

            // אין צורך ב־connection.on(...) עבור promise-based API
        }

        return connection;
    },
};


const dbMiddleware = async (req, res, next) => {
  try {
    req.db = await dbSingleton.getConnection();
    next();
  } catch (err) {
    next(err); // יעבור ל-error handler של Express
  }
};


module.exports = {dbSingleton, dbMiddleware};
