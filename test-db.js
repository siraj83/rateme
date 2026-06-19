const db = require('./db');

async function test() {
  try {
    const result = await db.query('SELECT NOW()');

    console.log('Connected Successfully');
    console.log(result.rows[0]);

    process.exit(0);
  } catch (err) {
    console.error('Connection Error:', err);
    process.exit(1);
  }
}

test();