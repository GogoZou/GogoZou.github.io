const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 8080;

// 配置CORS
app.use(cors());
app.use(express.json());

// 创建MySQL连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'GogoZou',
  password: 'zjh123456',
  database: 'english_studio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// 测试连接
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT 1 + 1 AS solution');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 用户相关API
app.post('/api/login', async (req, res) => {
  const { username, password, userType } = req.body;
  try {
    const [rows] = await promisePool.query(
      'SELECT * FROM users WHERE username = ? AND password = ? AND type = ?',
      [username, password, userType]
    );
    if (rows.length > 0) {
      const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      await promisePool.query('UPDATE users SET session_id = ? WHERE username = ?', [sessionId, username]);
      res.json({ success: true, user: { username, type: userType, sessionId } });
    } else {
      res.json({ success: false, message: '账号或密码错误' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, phone, studyLevel, examDate, goals } = req.body;
  const username = phone;
  const password = '888888';
  try {
    // 检查账号是否已存在
    const [existingUsers] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.json({ success: false, message: '账号已存在' });
    }

    // 开始事务
    await promisePool.query('START TRANSACTION');
    
    // 添加用户
    await promisePool.query(
      'INSERT INTO users (username, password, type) VALUES (?, ?, ?)',
      [username, password, 'student']
    );
    
    // 添加学生信息
    await promisePool.query(
      'INSERT INTO students (username, name, phone, study_level, exam_date, goals) VALUES (?, ?, ?, ?, ?, ?)',
      [username, name, phone, studyLevel, examDate, goals]
    );
    
    await promisePool.query('COMMIT');
    res.json({ success: true, message: '注册成功，初始密码为888888' });
  } catch (error) {
    await promisePool.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  }
});

// 学生相关API
app.get('/api/students', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT * FROM students');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/students/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await promisePool.query('SELECT * FROM students WHERE username = ?', [username]);
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/students/:username', async (req, res) => {
  const { username } = req.params;
  const { name, phone, studyLevel, status, examDate, goals } = req.body;
  try {
    await promisePool.query(
      'UPDATE students SET name = ?, phone = ?, study_level = ?, status = ?, exam_date = ?, goals = ? WHERE username = ?',
      [name, phone, studyLevel, status, examDate, goals, username]
    );
    res.json({ success: true, message: '学生信息更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/students/:username', async (req, res) => {
  const { username } = req.params;
  try {
    await promisePool.query('START TRANSACTION');
    await promisePool.query('DELETE FROM users WHERE username = ?', [username]);
    await promisePool.query('DELETE FROM students WHERE username = ?', [username]);
    await promisePool.query('COMMIT');
    res.json({ success: true, message: '学生删除成功' });
  } catch (error) {
    await promisePool.query('ROLLBACK');
    res.status(500).json({ success: false, error: error.message });
  }
});

// 考勤相关API
app.post('/api/attendance', async (req, res) => {
  const { username, date, time, type } = req.body;
  try {
    await promisePool.query(
      'INSERT INTO attendance (username, date, time, type) VALUES (?, ?, ?, ?)',
      [username, date, time, type]
    );
    res.json({ success: true, message: '考勤记录成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/attendance/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const [rows] = await promisePool.query(
      'SELECT a.*, s.name FROM attendance a JOIN students s ON a.username = s.username WHERE a.date = ?',
      [date]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 作业相关API
app.post('/api/homework', async (req, res) => {
  const { username, date, content, fileName, filePath } = req.body;
  try {
    await promisePool.query(
      'INSERT INTO homework (username, date, content, file_name, file_path) VALUES (?, ?, ?, ?, ?)',
      [username, date, content, fileName, filePath]
    );
    res.json({ success: true, message: '作业提交成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/homework', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT h.*, s.name FROM homework h JOIN students s ON h.username = s.username'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/homework/student/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await promisePool.query('SELECT * FROM homework WHERE username = ?', [username]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/homework/:id', async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;
  try {
    await promisePool.query(
      'UPDATE homework SET graded = true, feedback = ? WHERE id = ?',
      [feedback, id]
    );
    res.json({ success: true, message: '作业批改成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 问题相关API
app.post('/api/questions', async (req, res) => {
  const { username, date, content, fileName, filePath } = req.body;
  try {
    await promisePool.query(
      'INSERT INTO questions (username, date, content, file_name, file_path) VALUES (?, ?, ?, ?, ?)',
      [username, date, content, fileName, filePath]
    );
    res.json({ success: true, message: '问题提交成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/questions', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT q.*, s.name FROM questions q JOIN students s ON q.username = s.username'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/questions/student/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await promisePool.query('SELECT * FROM questions WHERE username = ?', [username]);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/questions/:id', async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;
  try {
    await promisePool.query(
      'UPDATE questions SET answered = true, answer = ? WHERE id = ?',
      [answer, id]
    );
    res.json({ success: true, message: '问题回答成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 教室相关API
app.get('/api/classrooms', async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT * FROM classrooms');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 预约相关API
app.post('/api/bookings', async (req, res) => {
  const { username, classroomId, date, startTime, endTime, purpose } = req.body;
  try {
    // 检查是否与现有预约冲突
    const [conflicts] = await promisePool.query(
      'SELECT * FROM bookings WHERE classroom_id = ? AND date = ? AND NOT (end_time <= ? OR start_time >= ?)',
      [classroomId, date, startTime, endTime]
    );
    
    if (conflicts.length > 0) {
      return res.json({ success: false, message: '该时间段已被占用' });
    }
    
    await promisePool.query(
      'INSERT INTO bookings (username, classroom_id, date, start_time, end_time, purpose) VALUES (?, ?, ?, ?, ?, ?)',
      [username, classroomId, date, startTime, endTime, purpose]
    );
    
    // 更新教室状态
    await promisePool.query(
      'UPDATE classrooms SET status = ? WHERE id = ?',
      ['occupied', classroomId]
    );
    
    res.json({ success: true, message: '教室预约成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT b.*, s.name, c.id as classroom_id FROM bookings b JOIN students s ON b.username = s.username JOIN classrooms c ON b.classroom_id = c.id'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});