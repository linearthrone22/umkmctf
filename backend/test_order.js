const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const buyer_id = 10; // buyer1
const item_id = 2; // Cabai Merah

db.get(`SELECT seller_id, price FROM items WHERE id = ?`, [item_id], (err, product) => {
    if (err) return console.error(err);
    console.log("Found product:", product);
    if (product) {
        db.run(`INSERT INTO orders (buyer_id, seller_id, item_id, quantity, total_price) VALUES (?, ?, ?, ?, ?)`,
            [buyer_id, product.seller_id, item_id, 1, product.price],
            function(err) {
                if (err) return console.error(err);
                console.log("Inserted order ID:", this.lastID);
                db.get("SELECT * FROM orders WHERE id = ?", [this.lastID], (err, order) => {
                    console.log("Verified order:", order);
                    db.close();
                });
            }
        );
    } else {
        console.log("Product not found");
        db.close();
    }
});
