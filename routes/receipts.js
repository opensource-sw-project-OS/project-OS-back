const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Receipts
 *   description: 영수증 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Receipt:
 *       type: object
 *       required:
 *         - user_id
 *         - date
 *         - total_amount
 *       properties:
 *         id:
 *           type: integer
 *           description: 영수증 고유 ID
 *         user_id:
 *           type: integer
 *           description: 사용자 ID
 *         date:
 *           type: string
 *           format: date
 *           description: 영수증 날짜 (YYYY-MM-DD)
 *         total_amount:
 *           type: number
 *           description: 총 금액
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 생성 시간
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 수정 시간
 *       example:
 *         id: 1
 *         user_id: 1
 *         date: "2025-05-12"
 *         total_amount: 14500
 *         created_at: "2025-05-12 00:12:57"
 *         updated_at: "2025-05-12 00:12:57"
 */

/**
 * @swagger
 * /api/receipts:
 *   get:
 *     summary: 모든 영수증 조회
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: 성공적으로 영수증 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Receipt'
 *       500:
 *         description: 서버 오류
 */
// 모든 영수증 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM receipts');
    res.json(rows);
  } catch (error) {
    console.error('영수증 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/receipts/date/{date}:
 *   get:
 *     summary: 특정 날짜 이후의 영수증 조회
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 조회 시작 날짜 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 성공적으로 영수증 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Receipt'
 *       500:
 *         description: 서버 오류
 */
// 특정 날짜 이후의 영수증 조회
router.get('/date/:date', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM receipts WHERE date >= ?', [req.params.date]);
    res.json(rows);
  } catch (error) {
    console.error('영수증 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/receipts/amount/{amount}:
 *   get:
 *     summary: 특정 금액 이상의 영수증 조회
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: amount
 *         schema:
 *           type: number
 *         required: true
 *         description: 조회할 최소 금액
 *     responses:
 *       200:
 *         description: 성공적으로 영수증 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Receipt'
 *       500:
 *         description: 서버 오류
 */
// 특정 금액 이상의 영수증 조회
router.get('/amount/:amount', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM receipts WHERE total_amount >= ?', [req.params.amount]);
    res.json(rows);
  } catch (error) {
    console.error('영수증 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/receipts:
 *   post:
 *     summary: 새 영수증 추가
 *     tags: [Receipts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - date
 *               - total_amount
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: 사용자 ID
 *               date:
 *                 type: string
 *                 format: date
 *                 description: 영수증 날짜 (YYYY-MM-DD)
 *               total_amount:
 *                 type: number
 *                 description: 총 금액
 *     responses:
 *       201:
 *         description: 영수증이 성공적으로 추가됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: 생성된 영수증의 ID
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       400:
 *         description: 유효하지 않은 요청 데이터
 *       500:
 *         description: 서버 오류
 */
// 새 영수증 추가
router.post('/', async (req, res) => {
  const { user_id, date, total_amount } = req.body;
  
  if (!user_id || !date || !total_amount) {
    return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO receipts (user_id, date, total_amount) VALUES (?, ?, ?)',
      [user_id, date, total_amount]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: '영수증이 성공적으로 추가되었습니다.' 
    });
  } catch (error) {
    console.error('영수증 추가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/receipts/{id}:
 *   get:
 *     summary: 특정 영수증 조회
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 영수증 ID
 *     responses:
 *       200:
 *         description: 성공적으로 영수증 정보를 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 특정 영수증 조회
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM receipts WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '영수증을 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('영수증 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/receipts/{id}:
 *   put:
 *     summary: 영수증 수정
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 수정할 영수증 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: 사용자 ID
 *               date:
 *                 type: string
 *                 format: date
 *                 description: 영수증 날짜 (YYYY-MM-DD)
 *               total_amount:
 *                 type: number
 *                 description: 총 금액
 *     responses:
 *       200:
 *         description: 영수증이 성공적으로 수정됨
 *       400:
 *         description: 유효하지 않은 요청 데이터
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 영수증 수정
router.put('/:id', async (req, res) => {
  const { user_id, date, total_amount } = req.body;
  
  if (!user_id && !date && !total_amount) {
    return res.status(400).json({ message: '수정할 필드가 없습니다.' });
  }
  
  try {
    // 현재 데이터 가져오기
    const [rows] = await pool.query('SELECT * FROM receipts WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '영수증을 찾을 수 없습니다.' });
    }
    
    const currentData = rows[0];
    
    // 업데이트할 데이터 준비
    const updatedData = {
      user_id: user_id || currentData.user_id,
      date: date || currentData.date,
      total_amount: total_amount || currentData.total_amount
    };
    
    await pool.query(
      'UPDATE receipts SET user_id = ?, date = ?, total_amount = ? WHERE id = ?',
      [updatedData.user_id, updatedData.date, updatedData.total_amount, req.params.id]
    );
    
    res.json({ message: '영수증이 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('영수증 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/receipts/{id}:
 *   delete:
 *     summary: 영수증 삭제
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 삭제할 영수증 ID
 *     responses:
 *       200:
 *         description: 영수증이 성공적으로 삭제됨
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 영수증 삭제
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM receipts WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '영수증을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '영수증이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('영수증 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 