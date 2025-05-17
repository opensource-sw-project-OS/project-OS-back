const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 사용자 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         user_id:
 *           type: integer
 *           description: 사용자 고유 ID
 *         username:
 *           type: string
 *           description: 사용자 이름
 *         password:
 *           type: string
 *           description: 사용자 비밀번호 (해시화됨)
 *       example:
 *         user_id: 1
 *         username: "user123"
 *         password: "hashedpassword123"
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 새 사용자 등록
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: 사용자가 성공적으로 등록됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: 유효하지 않은 요청 데이터
 *       500:
 *         description: 서버 오류
 */
router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 필수 필드 확인
    if (!username || !password) {
      return res.status(400).json({ message: '사용자 이름과 비밀번호는 필수입니다.' });
    }
    
    // 사용자 생성
    const [result] = await db.query(
      'INSERT INTO user (username, password) VALUES (?, ?)',
      [username, password]
    );
    
    res.status(201).json({
      user_id: result.insertId,
      message: '사용자가 성공적으로 등록되었습니다.'
    });
  } catch (error) {
    console.error('사용자 등록 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 사용자 로그인
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: 유효하지 않은 요청 데이터
 *       401:
 *         description: 로그인 실패
 *       500:
 *         description: 서버 오류
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 필수 필드 확인
    if (!username || !password) {
      return res.status(400).json({ message: '사용자 이름과 비밀번호는 필수입니다.' });
    }
    
    // 사용자 조회
    const [users] = await db.query(
      'SELECT user_id, username, password FROM user WHERE username = ?',
      [username]
    );
    
    // 사용자가 없는 경우
    if (users.length === 0) {
      return res.status(401).json({ message: '해당 사용자 이름이 존재하지 않습니다.' });
    }
    
    const user = users[0];
    
    // 비밀번호 검증
    if (user.password !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }
    
    // 로그인 성공
    res.status(200).json({
      user_id: user.user_id,
      message: '로그인에 성공했습니다.'
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 