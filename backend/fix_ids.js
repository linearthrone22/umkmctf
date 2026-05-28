const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Fix items seller_id based on umkm_name if possible
    db.all("SELECT id, username FROM users WHERE role = 'seller'", [], (err, sellers) => {
        if (err) return console.error(err);
        
        sellers.forEach(seller => {
            db.run("UPDATE items SET seller_id = ? WHERE umkm_name = ?", [seller.id, seller.username]);
        });
        
        // After fixing items, fixing orders based on the item's new seller_id
        db.all("SELECT i.id as item_id, i.seller_id FROM items i", [], (err, items) => {
            if (err) return console.error(err);
            
            items.forEach(item => {
                db.run("UPDATE orders SET seller_id = ? WHERE item_id = ?", [item.seller_id, item.item_id]);
            });
            console.log("Database IDs fixed.");
            db.close();
        });
    });
});
