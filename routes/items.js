const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: 품목 관리 API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required:
 *         - receipt_id
 *         - name
 *         - price
 *         - quantity
 *       properties:
 *         id:
 *           type: integer
 *           description: 품목 고유 ID
 *         receipt_id:
 *           type: integer
 *           description: 영수증 ID (외래키)
 *         name:
 *           type: string
 *           description: 품목명
 *         price:
 *           type: number
 *           description: 가격
 *         quantity:
 *           type: integer
 *           description: 수량
 *         category:
 *           type: string
 *           description: 카테고리
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
 *         receipt_id: 1
 *         name: "물고기버거"
 *         price: 5500
 *         quantity: 1
 *         category: "기타"
 *         created_at: "2025-05-12 00:13:07"
 *         updated_at: "2025-05-12 00:13:07"
 */

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: 모든 품목 조회
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: 성공적으로 품목 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       500:
 *         description: 서버 오류
 */
// 모든 품목 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items');
    res.json(rows);
  } catch (error) {
    console.error('품목 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items/receipt/{receiptId}:
 *   get:
 *     summary: 특정 영수증의 모든 품목 조회
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: receiptId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 영수증 ID
 *     responses:
 *       200:
 *         description: 성공적으로 품목 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       500:
 *         description: 서버 오류
 */
// 특정 영수증의 모든 품목 조회
router.get('/receipt/:receiptId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items WHERE receipt_id = ?', [req.params.receiptId]);
    res.json(rows);
  } catch (error) {
    console.error('품목 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items/price/{price}:
 *   get:
 *     summary: 특정 가격 이상의 품목 조회
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: price
 *         schema:
 *           type: number
 *         required: true
 *         description: 조회할 최소 가격
 *     responses:
 *       200:
 *         description: 성공적으로 품목 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       500:
 *         description: 서버 오류
 */
// 특정 가격 이상의 품목 조회
router.get('/price/:price', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items WHERE price >= ?', [req.params.price]);
    res.json(rows);
  } catch (error) {
    console.error('품목 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items/category/{category}:
 *   get:
 *     summary: 특정 카테고리의 품목 조회
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: 조회할 카테고리
 *     responses:
 *       200:
 *         description: 성공적으로 품목 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       500:
 *         description: 서버 오류
 */
// 특정 카테고리의 품목 조회
router.get('/category/:category', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items WHERE category = ?', [req.params.category]);
    res.json(rows);
  } catch (error) {
    console.error('품목 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items/name/{name}:
 *   get:
 *     summary: 특정 이름을 가진 품목 조회 (부분 일치)
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: 조회할 품목명 (부분 일치)
 *     responses:
 *       200:
 *         description: 성공적으로 품목 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       500:
 *         description: 서버 오류
 */
// 특정 이름을 가진 품목 조회 (부분 일치)
router.get('/name/:name', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items WHERE name LIKE ?', [`%${req.params.name}%`]);
    res.json(rows);
  } catch (error) {
    console.error('품목 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items/created-after/{date}:
 *   get:
 *     summary: 특정 날짜 이후 생성된 품목 조회
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: date
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: 조회 시작 날짜 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 성공적으로 품목 목록을 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       500:
 *         description: 서버 오류
 */
// 특정 날짜 이후 생성된 품목 조회
router.get('/created-after/:date', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items WHERE created_at >= ?', [req.params.date]);
    res.json(rows);
  } catch (error) {
    console.error('품목 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items/batch:
 *   post:
 *     summary: 여러 품목 한번에 추가 (영수증 OCR 결과에서 사용)
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receipt_id
 *               - items
 *             properties:
 *               receipt_id:
 *                 type: integer
 *                 description: 영수증 ID
 *               items:
 *                 type: array
 *                 description: 추가할 품목 배열
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - price
 *                     - quantity
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: 품목명
 *                     price:
 *                       type: number
 *                       description: 가격
 *                     quantity:
 *                       type: integer
 *                       description: 수량
 *                     category:
 *                       type: string
 *                       description: 카테고리
 *     responses:
 *       201:
 *         description: 품목이 성공적으로 추가됨
 *       400:
 *         description: 유효하지 않은 요청 데이터
 *       500:
 *         description: 서버 오류
 */
// 여러 품목 한번에 추가 (영수증 OCR 결과에서 사용)
router.post('/batch', async (req, res) => {
  const { receipt_id, items } = req.body;
  
  if (!receipt_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: '유효하지 않은 데이터 형식입니다.' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const values = items.map(item => [
      receipt_id,
      item.name,
      item.price,
      item.quantity,
      item.category || null
    ]);
    
    const [result] = await connection.query(
      'INSERT INTO items (receipt_id, name, price, quantity, category) VALUES ?',
      [values]
    );
    
    await connection.commit();
    
    res.status(201).json({ 
      count: result.affectedRows,
      message: `${result.affectedRows}개의 품목이 성공적으로 추가되었습니다.` 
    });
  } catch (error) {
    await connection.rollback();
    console.error('품목 일괄 추가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  } finally {
    connection.release();
  }
});

/**
 * @swagger
 * /api/items/receipt/{receiptId}:
 *   delete:
 *     summary: 특정 영수증의 모든 품목 삭제
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: receiptId
 *         schema:
 *           type: integer
 *         required: true
 *         description: 영수증 ID
 *     responses:
 *       200:
 *         description: 품목이 성공적으로 삭제됨
 *       500:
 *         description: 서버 오류
 */
// 특정 영수증의 모든 품목 삭제
router.delete('/receipt/:receiptId', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM items WHERE receipt_id = ?', [req.params.receiptId]);
    
    res.json({ 
      count: result.affectedRows,
      message: `${result.affectedRows}개의 품목이 성공적으로 삭제되었습니다.` 
    });
  } catch (error) {
    console.error('품목 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: 새 품목 추가
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receipt_id
 *               - name
 *               - price
 *               - quantity
 *             properties:
 *               receipt_id:
 *                 type: integer
 *                 description: 영수증 ID
 *               name:
 *                 type: string
 *                 description: 품목명
 *               price:
 *                 type: number
 *                 description: 가격
 *               quantity:
 *                 type: integer
 *                 description: 수량
 *               category:
 *                 type: string
 *                 description: 카테고리
 *     responses:
 *       201:
 *         description: 품목이 성공적으로 추가됨
 *       400:
 *         description: 유효하지 않은 요청 데이터
 *       500:
 *         description: 서버 오류
 */
// 새 품목 추가
router.post('/', async (req, res) => {
  const { receipt_id, name, price, quantity, category } = req.body;
  
  if (!receipt_id || !name || !price || !quantity) {
    return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO items (receipt_id, name, price, quantity, category) VALUES (?, ?, ?, ?, ?)',
      [receipt_id, name, price, quantity, category || null]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: '품목이 성공적으로 추가되었습니다.' 
    });
  } catch (error) {
    console.error('품목 추가 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: 특정 품목 조회
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 조회할 품목 ID
 *     responses:
 *       200:
 *         description: 성공적으로 품목 정보를 반환
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: 품목을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 특정 품목 조회
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '품목을 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('품목 조회 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: 품목 수정
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 수정할 품목 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 품목명
 *               price:
 *                 type: number
 *                 description: 가격
 *               quantity:
 *                 type: integer
 *                 description: 수량
 *               category:
 *                 type: string
 *                 description: 카테고리
 *     responses:
 *       200:
 *         description: 품목이 성공적으로 수정됨
 *       400:
 *         description: 유효하지 않은 요청 데이터
 *       404:
 *         description: 품목을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 품목 수정
router.put('/:id', async (req, res) => {
  const { name, price, quantity, category } = req.body;
  
  if (!name && !price && !quantity && !category) {
    return res.status(400).json({ message: '수정할 필드가 없습니다.' });
  }
  
  try {
    // 현재 데이터 가져오기
    const [rows] = await pool.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '품목을 찾을 수 없습니다.' });
    }
    
    const currentData = rows[0];
    
    // 업데이트할 데이터 준비
    const updatedData = {
      name: name || currentData.name,
      price: price || currentData.price,
      quantity: quantity || currentData.quantity,
      category: category !== undefined ? category : currentData.category
    };
    
    await pool.query(
      'UPDATE items SET name = ?, price = ?, quantity = ?, category = ? WHERE id = ?',
      [updatedData.name, updatedData.price, updatedData.quantity, updatedData.category, req.params.id]
    );
    
    res.json({ message: '품목이 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('품목 수정 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: 품목 삭제
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: 삭제할 품목 ID
 *     responses:
 *       200:
 *         description: 품목이 성공적으로 삭제됨
 *       404:
 *         description: 품목을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 품목 삭제
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM items WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '품목을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '품목이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('품목 삭제 오류:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 