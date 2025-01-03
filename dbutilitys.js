// require('dotenv').config(); // Load environment variables from .env
const mysql = require('mysql2');

// Function to create a new MySQL connection
const createConnection = () => {
    return mysql.createConnection({
        host: 'MYSQL5048.site4now.net',
        user: 'a50d85_payroll',
        password: 'p3r3nnial',
        database: 'db_a50d85_payroll',
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

            const query = `INSERT INTO RollcallSwipeAttendance (superid, machineid, cardid, dateoftransaction, createdby, updatedby, Username)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;

            const values = [
                data.superid,
                data.machineid,
                data.eId, // Using the single cardid (eId in this case)
                data.dateoftransaction,
                data.createdby || 'admin', // Default to 'admin' if not provided
                data.updatedby || 'admin',  // Default to 'admin' if not provided
                data.N // Username field
            ];

            // Perform the insert operation
            db.query(query, values, (err, results) => {
                if (err) {
                    // Enhanced error logging
                    console.error('Insert failed:', err.message);
                    reject({ success: false, message: 'Failed to insert data', error: err.message });
                } else {
                    resolve({ success: true, message: 'Data inserted successfully', id: results.insertId });
                }
            });

            db.end(); // Close the connection after insert operation
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

            let query = `SELECT id,superid, machineid, cardid as eId,Username AS N, dateoftransaction FROM  RollcallSwipeAttendance  where dateoftransaction 
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
