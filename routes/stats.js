const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: 통계 관련 API
 */

/**
 * @swagger
 * /api/stats/category:
 *   get:
 *     summary: 카테고리별 지출 통계
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 카테고리별 지출 통계를 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                     description: 카테고리명
 *                   total_amount:
 *                     type: number
 *                     description: 총 지출액
 *       500:
 *         description: 서버 오류
 */
// 카테고리별 지출 통계
router.get('/category', async (req, res) => {
  const { startDate, endDate, userId } = req.query;
  
  let query = `
    SELECT i.category, SUM(i.price * i.quantity) as total_amount
    FROM items i
    JOIN receipts r ON i.receipt_id = r.id
    WHERE i.category IS NOT NULL
  `;
  
  const params = [];
  
  if (userId) {
    query += ` AND r.user_id = ?`;
    params.push(userId);
  }
  
  if (startDate) {
    query += ` AND r.date >= ?`;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND r.date <= ?`;
    params.push(endDate);
  }
  
  query += ` GROUP BY i.category ORDER BY total_amount DESC`;
  
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('카테고리별 통계 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/stats/time:
 *   get:
 *     summary: 시간별 지출 통계 (일별, 월별, 연도별)
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, month, year]
 *         description: 그룹화 기준 (day, month, year)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 시간별 지출 통계를 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   time_period:
 *                     type: string
 *                     description: 기간 (일별, 월별, 또는 연도별)
 *                   total_amount:
 *                     type: number
 *                     description: 총 지출액
 *       500:
 *         description: 서버 오류
 */
// 시간별 지출 통계 (일별, 월별, 연도별)
router.get('/time', async (req, res) => {
  const { groupBy, startDate, endDate, userId } = req.query;
  
  let timeFormat;
  
  switch(groupBy) {
    case 'day':
      timeFormat = '%Y-%m-%d';
      break;
    case 'month':
      timeFormat = '%Y-%m';
      break;
    case 'year':
      timeFormat = '%Y';
      break;
    default:
      timeFormat = '%Y-%m-%d';
  }
  
  let query = `
    SELECT DATE_FORMAT(r.date, ?) as time_period, SUM(r.total_amount) as total_amount
    FROM receipts r
    WHERE 1=1
  `;
  
  const params = [timeFormat];
  
  if (userId) {
    query += ` AND r.user_id = ?`;
    params.push(userId);
  }
  
  if (startDate) {
    query += ` AND r.date >= ?`;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND r.date <= ?`;
    params.push(endDate);
  }
  
  query += ` GROUP BY time_period ORDER BY time_period`;
  
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('시간별 통계 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/stats/top-items:
 *   get:
 *     summary: 가장 많이 구매한 품목 통계
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 반환할 결과 개수
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 가장 많이 구매한 품목 통계를 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: 품목명
 *                   total_quantity:
 *                     type: integer
 *                     description: 총 구매량
 *                   total_amount:
 *                     type: number
 *                     description: 총 지출액
 *                   purchase_count:
 *                     type: integer
 *                     description: 구매 횟수
 *       500:
 *         description: 서버 오류
 */
// 가장 많이 구매한 품목 통계
router.get('/top-items', async (req, res) => {
  const { limit = 10, startDate, endDate, userId } = req.query;
  
  let query = `
    SELECT i.name, SUM(i.quantity) as total_quantity, SUM(i.price * i.quantity) as total_amount,
    COUNT(DISTINCT r.id) as purchase_count
    FROM items i
    JOIN receipts r ON i.receipt_id = r.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (userId) {
    query += ` AND r.user_id = ?`;
    params.push(userId);
  }
  
  if (startDate) {
    query += ` AND r.date >= ?`;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND r.date <= ?`;
    params.push(endDate);
  }
  
  query += ` GROUP BY i.name ORDER BY total_amount DESC LIMIT ?`;
  params.push(Number(limit));
  
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('최다 구매 품목 통계 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/stats/average:
 *   get:
 *     summary: 평균 지출 통계
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, month, category]
 *         description: 그룹화 기준 (day, month, category)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜 (YYYY-MM-DD)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 평균 지출 통계를 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   time_period:
 *                     type: string
 *                     description: 기간 (일별 또는 월별)
 *                   category:
 *                     type: string
 *                     description: 카테고리명 (groupBy가 category일 경우)
 *                   average_amount:
 *                     type: number
 *                     description: 평균 지출액
 *       500:
 *         description: 서버 오류
 */
// 평균 지출 통계
router.get('/average', async (req, res) => {
  const { groupBy, startDate, endDate, userId } = req.query;
  
  let timeFormat, groupByClause;
  
  switch(groupBy) {
    case 'day':
      timeFormat = '%Y-%m-%d';
      groupByClause = 'DATE_FORMAT(r.date, ?)';
      break;
    case 'month':
      timeFormat = '%Y-%m';
      groupByClause = 'DATE_FORMAT(r.date, ?)';
      break;
    case 'category':
      groupByClause = 'i.category';
      break;
    default:
      timeFormat = '%Y-%m';
      groupByClause = 'DATE_FORMAT(r.date, ?)';
  }
  
  let query;
  const params = [];
  
  if (groupBy === 'category') {
    query = `
      SELECT i.category, AVG(i.price * i.quantity) as average_amount
      FROM items i
      JOIN receipts r ON i.receipt_id = r.id
      WHERE i.category IS NOT NULL
    `;
  } else {
    query = `
      SELECT ${groupByClause} as time_period, AVG(r.total_amount) as average_amount
      FROM receipts r
      WHERE 1=1
    `;
    params.push(timeFormat);
  }
  
  if (userId) {
    query += ` AND r.user_id = ?`;
    params.push(userId);
  }
  
  if (startDate) {
    query += ` AND r.date >= ?`;
    params.push(startDate);
  }
  
  if (endDate) {
    query += ` AND r.date <= ?`;
    params.push(endDate);
  }
  
  if (groupBy === 'category') {
    query += ` GROUP BY i.category ORDER BY average_amount DESC`;
  } else {
    query += ` GROUP BY ${groupByClause} ORDER BY time_period`;
  }
  
  try {
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('평균 지출 통계 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 