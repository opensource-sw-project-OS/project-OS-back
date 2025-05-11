const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'PASSWORD',
  database: process.env.DB_NAME || 'receipts_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  authPlugins: {
    mysql_native_password: () => require('mysql2/lib/auth/mysql_native_password')
  }
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('데이터베이스 연결 성공!');
    connection.release();
  } catch (err) {
    console.error('데이터베이스 연결 오류:', err);
  }
};

testConnection();

module.exports = pool;