require('dotenv').config(); // Load environment variables from .env
const mysql = require('mysql2');

// Function to create a new MySQL connection
const createConnection = () => {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
};

const insertData = (data) => {
    return new Promise((resolve, reject) => {
        const db = createConnection(); // Create a new connection
        db.connect(err => {
            if (err) {
                console.error('Error connecting to MySQL:', err.message);
                reject({ success: false, message: 'Database connection failed.' });
                return;
            }

            // Loop through each cardid and insert them one by one
            const cardidArray = data.cardid; // Extract cardid array from the input data
            const insertPromises = [];

            cardidArray.forEach(cardid => {
                const query = `INSERT INTO RollcallSwipeAttendance (superid, machineid, cardid, dateoftransaction, createdby, updatedby)
                               VALUES (?, ?, ?, ?, ?, ?)`;

                const values = [
                    data.superid,
                    data.machineid,
                    cardid, // Inserting one cardid at a time
                    data.dateoftransaction,
                    data.createdby || 'admin', // Default to 'admin' if not provided
                    data.updatedby || 'admin'  // Default to 'admin' if not provided
                ];

                // Push each insert operation as a Promise into the array
                insertPromises.push(new Promise((resolve, reject) => {
                    db.query(query, values, (err, results) => {
                        if (err) {
                            // Enhanced error logging
                            console.error(`Insert failed for cardid ${cardid}:`, err.message);
                            reject({ success: false, message: `Failed to insert data for cardid ${cardid}`, error: err.message });
                        } else {
                            resolve({ success: true, message: `Data inserted successfully for cardid ${cardid}`, id: results.insertId });
                        }
                    });
                }));
            });

            // Wait for all insert promises to complete
            Promise.all(insertPromises)
                .then(results => {
                    db.end(); // Close the connection after all inserts
                    resolve({ success: true, message: 'All data inserted successfully.', results });
                })
                .catch(error => {
                    db.end(); // Close the connection if there's any error
                    reject(error);
                });
        });
    });
};


// Function to retrieve data from the database
const getData = (date,superid,conditions = {}) => {
    return new Promise((resolve, reject) => {
        const db = createConnection(); // Create a new connection
        db.connect(err => {
            if (err) {
                console.error('Error connecting to MySQL:', err.message);
                reject({ success: false, message: 'Database connection failed.' });
                return;
            }

            let query = `SELECT id,superid, machineid, cardid, dateoftransaction FROM  RollcallSwipeAttendance  where dateoftransaction 
                            between '${date} 00:00:00' and '${date} 23:59:59' and superid = ${superid}`;
            console.log(query)
            const conditionKeys = Object.keys(conditions);
            if (conditionKeys.length > 0) {
                const whereClause = conditionKeys
                    .map(key => `${key} = ?`)
                    .join(' AND ');
                query += ` WHERE ${whereClause}`;
            }

            db.query(query, Object.values(conditions), (err, results) => {
                db.end(); // Close the connection
                if (err) {
                    console.error('Retrieve data error:', err.message);
                    reject({ success: false, message: 'Failed to retrieve data.' });
                } else {
                    resolve({ success: true, data: results });
                }
            });
        });
    });
};

module.exports = { insertData, getData };
