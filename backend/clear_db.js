const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("DELETE FROM items;", (err) => {
        if (err) {
            console.error("Error clearing items:", err.message);
        } else {
            console.log("Successfully cleared all items from database.");
        }
    });
    db.close();
});
