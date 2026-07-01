const bcrypt = require('bcryptjs');
const db = require('./db');

async function createAdmin() {
    const username = 'admin';
    const password = 'admin123';

    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
        `
    INSERT INTO platform_admins
    (username, password_hash)
    VALUES
    ($1, $2)
    ON CONFLICT (username)
    DO UPDATE SET password_hash = EXCLUDED.password_hash
    `,
        [username, passwordHash]
    );

    console.log('Admin created successfully');
    process.exit();
}

createAdmin();