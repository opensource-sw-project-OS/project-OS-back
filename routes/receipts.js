const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
 *         - receipt_date
 *         - category
 *         - total_amount
 *       properties:
 *         receipt_id:
 *           type: integer
 *           description: 영수증 고유 ID
 *         user_id:
 *           type: integer
 *           description: 사용자 ID
 *         receipt_date:
 *           type: string
 *           format: date
 *           description: 영수증 날짜 (YYYY-MM-DD)
 *         category:
 *           type: string
 *           description: 영수증 카테고리
 *         total_amount:
 *           type: integer
 *           description: 총 금액
 *         emotion_type:
 *           type: string
 *           enum: [happy, sad, angry, anxious, neutral, null]
 *           description: 감정 유형
 *         emotion_description:
 *           type: string
 *           description: 감정 설명
 *       example:
 *         receipt_id: 1
 *         user_id: 1
 *         receipt_date: "2023-05-12"
 *         category: "식비"
 *         total_amount: 14500
 *         emotion_type: "happy"
 *         emotion_description: "오늘은 기분이 좋았습니다."
 */

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
 *               - receipt_date
 *               - category
 *               - total_amount
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: 사용자 ID
 *               receipt_date:
 *                 type: string
 *                 format: date
 *                 description: 영수증 날짜 (YYYY-MM-DD)
 *               category:
 *                 type: string
 *                 description: 영수증 카테고리
 *               total_amount:
 *                 type: integer
 *                 description: 총 금액
 *               emotion_type:
 *                 type: string
 *                 enum: [happy, sad, angry, anxious, neutral]
 *                 description: 감정 유형 (선택사항)
 *               emotion_description:
 *                 type: string
 *                 description: 감정 설명 (선택사항)
 *     responses:
 *       201:
 *         description: 영수증이 성공적으로 추가됨
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 receipt_id:
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
router.post('/', async (req, res) => {
  try {
    const { user_id, receipt_date, category, total_amount, emotion_type, emotion_description } = req.body;
    
    // 필수 필드 확인
    if (!user_id || !receipt_date || !category || !total_amount) {
      return res.status(400).json({ 
        message: '사용자 ID, 날짜, 카테고리, 총 금액은 필수 필드입니다.'
      });
    }
    
    // 감정 유형 검증 (감정 유형이 제공된 경우)
    if (emotion_type) {
      const validEmotionTypes = ['happy', 'sad', 'angry', 'anxious', 'neutral'];
      if (!validEmotionTypes.includes(emotion_type)) {
        return res.status(400).json({
          message: '유효하지 않은 감정 유형입니다. happy, sad, angry, anxious, neutral 중 하나여야 합니다.'
        });
      }
    }
    
    // 영수증 추가 (emotion_type과 emotion_description 포함)
    const query = `
      INSERT INTO receipt 
        (user_id, receipt_date, category, total_amount, emotion_type, emotion_description) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(
      query,
      [user_id, receipt_date, category, total_amount, emotion_type || null, emotion_description || null]
    );
    
    res.status(201).json({
      receipt_id: result.insertId,
      message: '영수증이 성공적으로 추가되었습니다.'
    });
  } catch (error) {
    console.error('영수증 추가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/receipts/user/{userId}:
 *   get:
 *     summary: 특정 사용자의 모든 영수증 조회
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자의 영수증 목록을 성공적으로 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 사용자 ID 유효성 검사
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
    }
    
    // 해당 사용자의 모든 영수증 조회
    const [receipts] = await db.query(
      'SELECT * FROM receipt WHERE user_id = ? ORDER BY receipt_date DESC',
      [userId]
    );
    
    // 영수증이 없는 경우
    if (receipts.length === 0) {
      return res.status(404).json({ message: '해당 사용자의 영수증 내역이 없습니다.' });
    }
    
    res.status(200).json(receipts);
  } catch (error) {
    console.error('영수증 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/receipts/user/{userId}/date/{date}:
 *   get:
 *     summary: 특정 사용자의 특정 날짜 영수증 조회
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 사용자 ID
 *       - in: path
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: 조회할 날짜 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 사용자의 특정 날짜 영수증 목록을 성공적으로 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: 영수증을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/user/:userId/date/:date', async (req, res) => {
  try {
    const userId = req.params.userId;
    const date = req.params.date;
    
    // 사용자 ID 및 날짜 유효성 검사
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: '유효하지 않은 사용자 ID입니다.' });
    }
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: '유효하지 않은 날짜 형식입니다. YYYY-MM-DD 형식이어야 합니다.' });
    }
    
    // 해당 사용자의 특정 날짜 영수증 조회
    const [receipts] = await db.query(
      'SELECT * FROM receipt WHERE user_id = ? AND receipt_date = ?',
      [userId, date]
    );
    
    // 영수증이 없는 경우
    if (receipts.length === 0) {
      return res.status(404).json({ message: '해당 날짜의 영수증 내역이 없습니다.' });
    }
    
    res.status(200).json(receipts);
  } catch (error) {
    console.error('영수증 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 