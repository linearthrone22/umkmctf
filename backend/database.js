const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = async () => {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            // Create Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT,
                location TEXT -- Store user location/address
            )`);

            // Create Items table
            db.run(`CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                commodity TEXT,
                price INTEGER,
                stock INTEGER,
                location TEXT,
                image_url TEXT,
                umkm_name TEXT,
                seller_id INTEGER,
                FOREIGN KEY(seller_id) REFERENCES users(id)
            )`);

            // Create Orders table (Real orders from buyers)
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                buyer_id INTEGER,
                seller_id INTEGER,
                item_id INTEGER,
                quantity INTEGER,
                total_price INTEGER,
                status TEXT DEFAULT 'pending', -- pending, shipped, delivered
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(buyer_id) REFERENCES users(id),
                FOREIGN KEY(seller_id) REFERENCES users(id),
                FOREIGN KEY(item_id) REFERENCES items(id)
            )`);

            // Create Stakeholders table (Optional extra points for AI analysis)
            db.run(`CREATE TABLE IF NOT EXISTS stakeholders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                lat REAL,
                lng REAL,
                type TEXT,
                category TEXT,
                demand_weight INTEGER
            )`);

            // Create Shipments table (History of AI Logistics)
            db.run(`CREATE TABLE IF NOT EXISTS shipments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                seller_id INTEGER,
                route_data TEXT, -- JSON string of the optimized route
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(seller_id) REFERENCES users(id)
            )`);

            // Clear existing data for fresh start
            db.run(`DELETE FROM orders`);
            db.run(`DELETE FROM items`);
            db.run(`DELETE FROM users`);

            // Seed Users with specific locations
            const users = [
                { username: 'buyer1', password: 'password123', role: 'buyer', location: '-6.2088, 106.8456' }, // Jakarta
                { username: 'buyer2', password: 'password123', role: 'buyer', location: '-6.5971, 106.7986' }, // Bogor
                { username: 'buyer3', password: 'password123', role: 'buyer', location: '-6.2383, 106.9756' }, // Bekasi
                { username: 'seller1', password: 'password123', role: 'seller', location: '-6.9175, 107.6191' }, // Bandung
                { username: 'seller2', password: 'password123', role: 'seller', location: '-6.9000, 107.6000' }
            ];

            for (const user of users) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                db.run(`INSERT INTO users (username, password, role, location) VALUES (?, ?, ?, ?)`, 
                    [user.username, hashedPassword, user.role, user.location]);
            }

            console.log('Database initialized.');
            resolve();
        });
    });
};

module.exports = { db, initDb };
