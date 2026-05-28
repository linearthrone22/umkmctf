const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const seller_id = 14; // seller1

console.log(`--- DUMP FOR SELLER ${seller_id} ---`);

db.serialize(() => {
    console.log('\nITEMS:');
    db.all('SELECT * FROM items WHERE seller_id = ?', [seller_id], (err, rows) => {
        console.log(JSON.stringify(rows, null, 2));
    });

    console.log('\nORDERS:');
    db.all('SELECT * FROM orders WHERE seller_id = ?', [seller_id], (err, rows) => {
        console.log(JSON.stringify(rows, null, 2));
    });

    console.log('\nUSERS:');
    db.all('SELECT id, username, role FROM users', (err, rows) => {
        console.log(JSON.stringify(rows, null, 2));
        db.close();
    });
});
