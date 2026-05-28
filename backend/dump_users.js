const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
db.all('SELECT id, username, role FROM users', (err, rows) => {
    if (err) console.error(err);
    console.log('USERS_START');
    console.log(JSON.stringify(rows, null, 2));
    console.log('USERS_END');
    db.close();
});
