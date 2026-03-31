// 全局变量
let currentUser = null;

// API基础URL
const API_BASE = 'http://localhost:8080/api';

// 通用API请求函数
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        showNotification('网络错误，请稍后重试', 'error');
        return { success: false, error: error.message };
    }
}

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    checkLoginStatus();
    
    // 标签切换功能
    setupTabSwitching();
    
    // 表单提交事件
    setupFormSubmissions();
    
    // 加载相应页面
    loadPage();
});

// 检查登录状态
function checkLoginStatus() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
    }
}

// 设置标签切换
function setupTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有标签的active类
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // 添加当前标签的active类
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// 设置表单提交
function setupFormSubmissions() {
    // 登录表单
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // 注册表单
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegister();
        });
    }
    
    // 其他表单...
    setupStudentForms();
    setupAdminForms();
}

// 处理登录
async function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const userType = document.getElementById('user-type').value;
    
    // 调用登录API
    const response = await apiRequest('/login', 'POST', {
        username,
        password,
        userType
    });
    
    if (response.success) {
        currentUser = response.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 跳转到相应页面
        if (userType === 'admin') {
            window.location.href = 'index.html?page=admin';
        } else {
            window.location.href = 'index.html?page=student';
        }
    } else {
        showNotification(response.message || '账号或密码错误', 'error');
    }
}

// 处理注册
async function handleRegister() {
    const name = document.getElementById('register-name').value;
    const phone = document.getElementById('register-phone').value;
    const studyLevel = document.getElementById('study-level').value;
    const examDate = document.getElementById('exam-date').value;
    const goals = document.getElementById('goals').value;
    
    // 调用注册API
    const response = await apiRequest('/register', 'POST', {
        name,
        phone,
        studyLevel,
        examDate,
        goals
    });
    
    if (response.success) {
        showNotification(response.message || '注册成功，初始密码为888888', 'success');
        
        // 切换到登录标签
        document.querySelector('[data-tab="login"]').click();
    } else {
        showNotification(response.message || '注册失败', 'error');
    }
}

// 加载页面
async function loadPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    
    if (!currentUser) {
        // 未登录，显示登录页面
        return;
    }
    
    // 加载数据
    await window.loadData();
    
    if (page === 'admin') {
        showAdminPage();
    } else if (page === 'student') {
        showStudentPage();
    }
}

// 显示管理员页面
function showAdminPage() {
    if (currentUser.type !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    document.body.innerHTML = `
        <div class="container">
            <nav class="navbar">
                <ul>
                    <li><a href="index.html?page=admin">首页</a></li>
                    <li><a href="index.html?page=admin&section=students">学生管理</a></li>
                    <li><a href="index.html?page=admin&section=classrooms">教室管理</a></li>
                    <li><a href="index.html?page=admin&section=attendance">考勤管理</a></li>
                    <li><a href="index.html?page=admin&section=homework">作业管理</a></li>
                    <li><a href="index.html?page=admin&section=questions">问题管理</a></li>
                    <li class="settings-menu">
                        <a href="#">设置</a>
                        <div class="settings-dropdown">
                            <a href="#" onclick="changePassword()">修改密码</a>
                            <a href="#" onclick="logout()">退出登录</a>
                        </div>
                    </li>
                </ul>
            </nav>
            
            <div class="dashboard">
                <h2>管理员仪表板</h2>
                ${getAdminSection()}
            </div>
        </div>
    `;
    
    // 设置学生管理页面的编辑功能
    if (window.location.search.includes('section=students')) {
        setTimeout(setupStudentEdit, 100);
    }
}

// 获取管理员页面内容
function getAdminSection() {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    switch (section) {
        case 'students':
            return renderStudentManagement();
        case 'classrooms':
            return renderClassroomManagement();
        case 'attendance':
            return renderAttendanceManagement();
        case 'homework':
            return renderHomeworkManagement();
        case 'questions':
            return renderQuestionManagement();
        default:
            return renderAdminDashboard();
    }
}

// 显示学生页面
function showStudentPage() {
    if (currentUser.type !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    document.body.innerHTML = `
        <div class="container">
            <nav class="navbar">
                <ul>
                    <li><a href="index.html?page=student">首页</a></li>
                    <li><a href="index.html?page=student&section=attendance">考勤打卡</a></li>
                    <li><a href="index.html?page=student&section=homework">作业提交</a></li>
                    <li><a href="index.html?page=student&section=questions">问题提交</a></li>
                    <li><a href="index.html?page=student&section=booking">教室预约</a></li>
                    <li><a href="index.html?page=student&section=submitted-homework">已提交作业</a></li>
                    <li><a href="index.html?page=student&section=submitted-questions">已提交问题</a></li>
                    <li class="settings-menu">
                        <a href="#">设置</a>
                        <div class="settings-dropdown">
                            <a href="#" onclick="changePhone()">修改手机号</a>
                            <a href="#" onclick="changePassword()">修改密码</a>
                            <a href="#" onclick="logout()">退出登录</a>
                        </div>
                    </li>
                </ul>
            </nav>
            
            <div class="dashboard">
                <h2>学生仪表板</h2>
                ${getStudentSection()}
            </div>
        </div>
    `;
}

// 获取学生页面内容
function getStudentSection() {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    switch (section) {
        case 'attendance':
            return renderAttendanceSection();
        case 'homework':
            return renderHomeworkSection();
        case 'questions':
            return renderQuestionSection();
        case 'booking':
            return renderBookingSection();
        case 'submitted-homework':
            return renderSubmittedHomeworkSection();
        case 'submitted-questions':
            return renderSubmittedQuestionsSection();
        default:
            return renderStudentDashboard();
    }
}

// 渲染管理员仪表板
function renderAdminDashboard() {
    const studentCount = Object.keys(window.data.students).length;
    
    // 计算当前工作室学生人数（已到校未离校）
    const today = new Date().toISOString().split('T')[0];
    const checkedInStudents = new Set();
    const checkedOutStudents = new Set();
    
    window.data.attendance.forEach(record => {
        if (record.date === today) {
            if (record.type === 'in') {
                checkedInStudents.add(record.username);
            } else if (record.type === 'out') {
                checkedOutStudents.add(record.username);
            }
        }
    });
    
    // 计算当前在工作室的学生数（已到校但未离校）
    const currentStudents = Array.from(checkedInStudents).filter(username => !checkedOutStudents.has(username)).length;
    
    const pendingQuestions = window.data.questions.filter(q => !q.answered).length;
    
    return `
        <div class="card">
            <h3>工作室状态</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                    <h4>学生总数</h4>
                    <p style="font-size: 24px; font-weight: bold;">${studentCount}</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                    <h4>工作室学生人数</h4>
                    <p style="font-size: 24px; font-weight: bold;">${currentStudents}</p>
                </div>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; cursor: pointer;" onclick="window.location.href='index.html?page=admin&section=questions'">
                    <h4>未回答问题</h4>
                    <p style="font-size: 24px; font-weight: bold;">${pendingQuestions}</p>
                    <p style="font-size: 12px; color: #3498db;">点击查看</p>
                </div>
            </div>
        </div>
    `;
}

// 渲染学生管理页面
function renderStudentManagement() {
    let studentList = '';
    for (const [username, info] of Object.entries(window.data.students)) {
        studentList += `
            <tr data-username="${username}">
                <td class="editable" data-field="name">${info.name}</td>
                <td>${username}</td>
                <td class="editable" data-field="phone">${info.phone}</td>
                <td class="editable" data-field="studyLevel">${getStudyLevelText(info.studyLevel)}</td>
                <td class="editable" data-field="status">${info.status || '学习中'}</td>
                <td class="editable" data-field="examDate">${info.examDate || '无'}</td>
                <td class="editable" data-field="goals">${info.goals || '无'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="resetPassword('${username}')">重置密码</button>
                    <button class="btn btn-danger" onclick="deleteStudent('${username}')">删除</button>
                </td>
            </tr>
        `;
    }
    
    return `
        <div class="card">
            <h3>学生管理</h3>
            <p>点击表格中的信息可以直接编辑</p>
            <table id="student-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>账号</th>
                        <th>电话</th>
                        <th>学习阶段</th>
                        <th>学习状态</th>
                        <th>考试时间</th>
                        <th>目标要求</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentList}
                </tbody>
            </table>
        </div>
    `;
}

// 设置学生管理页面的编辑功能
function setupStudentEdit() {
    document.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('click', function() {
            const row = this.closest('tr');
            const username = row.getAttribute('data-username');
            const field = this.getAttribute('data-field');
            const currentValue = this.textContent;
            
            let input;
            if (field === 'studyLevel') {
                input = document.createElement('select');
                input.innerHTML = `
                    <option value="junior" ${currentValue === '初中' ? 'selected' : ''}>初中</option>
                    <option value="high" ${currentValue === '高中' ? 'selected' : ''}>高中</option>
                    <option value="cet4" ${currentValue === '大学四级' ? 'selected' : ''}>大学四级</option>
                    <option value="cet6" ${currentValue === '大学六级' ? 'selected' : ''}>大学六级</option>
                    <option value="ielts" ${currentValue === '雅思' ? 'selected' : ''}>雅思</option>
                    <option value="toefl" ${currentValue === '托福' ? 'selected' : ''}>托福</option>
                `;
            } else if (field === 'status') {
                input = document.createElement('select');
                input.innerHTML = `
                    <option value="学习中" ${currentValue === '学习中' ? 'selected' : ''}>学习中</option>
                    <option value="已达目标" ${currentValue === '已达目标' ? 'selected' : ''}>已达目标</option>
                `;
            } else if (field === 'examDate') {
                input = document.createElement('input');
                input.type = 'date';
                input.value = currentValue === '无' ? '' : currentValue;
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue === '无' ? '' : currentValue;
            }
            
            input.style.width = '100%';
            input.style.padding = '5px';
            input.style.border = '1px solid #3498db';
            input.style.borderRadius = '4px';
            
            this.innerHTML = '';
            this.appendChild(input);
            input.focus();
            
            input.addEventListener('blur', async function() {
                const newValue = input.value || '无';
                await window.updateStudentField(username, field, newValue);
                cell.textContent = newValue;
            });
            
            input.addEventListener('keypress', async function(e) {
                if (e.key === 'Enter') {
                    const newValue = input.value || '无';
                    await window.updateStudentField(username, field, newValue);
                    cell.textContent = newValue;
                }
            });
        });
    });
}

// 渲染教室管理页面
function renderClassroomManagement() {
    let classroomList = '';
    window.data.classrooms.forEach(classroom => {
        classroomList += `
            <tr>
                <td>${classroom.id}</td>
                <td>${classroom.status === 'available' ? '可用' : '占用'}</td>
                <td>${window.data.bookings.filter(b => b.classroom_id === classroom.id).length}</td>
            </tr>
        `;
    });
    
    return `
        <div class="card">
            <h3>教室管理</h3>
            <table>
                <thead>
                    <tr>
                        <th>教室编号</th>
                        <th>状态</th>
                        <th>预约数</th>
                    </tr>
                </thead>
                <tbody>
                    ${classroomList}
                </tbody>
            </table>
        </div>
    `;
}

// 渲染考勤管理页面
function renderAttendanceManagement() {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = window.data.attendance;
    
    let attendanceList = '';
    todayAttendance.forEach(record => {
        attendanceList += `
            <tr>
                <td>${record.name || record.username}</td>
                <td>${record.time}</td>
                <td>${record.type === 'in' ? '到校' : '离校'}</td>
            </tr>
        `;
    });
    
    return `
        <div class="card">
            <h3>今日考勤 (${today})</h3>
            <table>
                <thead>
                    <tr>
                        <th>学生</th>
                        <th>时间</th>
                        <th>类型</th>
                    </tr>
                </thead>
                <tbody>
                    ${attendanceList || '<tr><td colspan="3">暂无记录</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

// 渲染作业管理页面
function renderHomeworkManagement() {
    let homeworkList = '';
    window.data.homework.forEach(hw => {
        homeworkList += `
            <tr>
                <td>${hw.name || hw.username}</td>
                <td>${hw.date}</td>
                <td>${hw.file_name}</td>
                <td>${hw.graded ? '已批改' : '未批改'}</td>
                <td>
                    <button class="btn btn-primary" onclick="previewFile('${hw.file_path}', '${hw.file_name}')">预览</button>
                    <button class="btn btn-secondary" onclick="downloadFile('${hw.file_path}')">下载</button>
                    <button class="btn btn-success" onclick="gradeHomework(${hw.id})">批改</button>
                </td>
            </tr>
        `;
    });
    
    return `
        <div class="card">
            <h3>作业管理</h3>
            <table>
                <thead>
                    <tr>
                        <th>学生</th>
                        <th>提交日期</th>
                        <th>文件名</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${homeworkList || '<tr><td colspan="5">暂无作业</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

// 渲染问题管理页面
function renderQuestionManagement() {
    let questionList = '';
    window.data.questions.forEach(q => {
        questionList += `
            <tr>
                <td>${q.name || q.username}</td>
                <td>${q.date}</td>
                <td onclick="viewQuestion(${q.id})" style="cursor: pointer; ${!q.answered ? 'font-weight: bold;' : ''}">${q.content}</td>
                <td>${q.answered ? '已回答' : '未回答'}</td>
                <td>
                    ${q.file_name ? `<button class="btn btn-primary" onclick="previewFile('${q.file_path}', '${q.file_name}')">预览附件</button>` : ''}
                    <button class="btn btn-secondary" onclick="answerQuestion(${q.id})">回答</button>
                </td>
            </tr>
        `;
    });
    
    return `
        <div class="card">
            <h3>问题管理</h3>
            <table>
                <thead>
                    <tr>
                        <th>学生</th>
                        <th>提交日期</th>
                        <th>问题内容</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${questionList || '<tr><td colspan="5">暂无问题</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

// 渲染学生个人信息
function renderStudentDashboard() {
    const studentInfo = window.data.students[currentUser.username];
    
    return `
        <div class="card">
            <h3>个人信息</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <p><strong>姓名:</strong> ${studentInfo.name}</p>
                    <p><strong>账号:</strong> ${currentUser.username}</p>
                    <p><strong>电话:</strong> ${studentInfo.phone}</p>
                </div>
                <div>
                    <p><strong>学习阶段:</strong> ${getStudyLevelText(studentInfo.studyLevel)}</p>
                    <p><strong>学习状态:</strong> ${studentInfo.status || '学习中'}</p>
                    <p><strong>考试时间:</strong> ${studentInfo.examDate || '无'}</p>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <p><strong>目标要求:</strong> ${studentInfo.goals || '无'}</p>
            </div>
        </div>
        <div class="card">
            <h3>快捷功能</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <a href="index.html?page=student&section=attendance" class="btn btn-primary" style="text-align: center; padding: 20px;">考勤打卡</a>
                <a href="index.html?page=student&section=homework" class="btn btn-primary" style="text-align: center; padding: 20px;">作业提交</a>
                <a href="index.html?page=student&section=questions" class="btn btn-primary" style="text-align: center; padding: 20px;">问题提交</a>
                <a href="index.html?page=student&section=booking" class="btn btn-primary" style="text-align: center; padding: 20px;">教室预约</a>
                <a href="index.html?page=student&section=submitted-homework" class="btn btn-secondary" style="text-align: center; padding: 20px;">已提交作业</a>
                <a href="index.html?page=student&section=submitted-questions" class="btn btn-secondary" style="text-align: center; padding: 20px;">已提交问题</a>
            </div>
        </div>
    `;
}

// 渲染考勤打卡页面
function renderAttendanceSection() {
    return `
        <div class="card">
            <h3>考勤打卡</h3>
            <div style="text-align: center; padding: 40px;">
                <button class="btn btn-primary" style="padding: 15px 30px; font-size: 18px;" onclick="checkIn()">到校打卡</button>
                <button class="btn btn-secondary" style="padding: 15px 30px; font-size: 18px; margin-left: 20px;" onclick="checkOut()">离校打卡</button>
            </div>
        </div>
    `;
}

// 渲染作业提交页面
function renderHomeworkSection() {
    return `
        <div class="card">
            <h3>作业提交</h3>
            <form onsubmit="handleHomeworkSubmit(event)">
                <div class="form-group">
                    <label for="homework-content">作业描述（可选）</label>
                    <textarea id="homework-content" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="homework-file">上传文件</label>
                    <div class="upload-area" onclick="document.getElementById('homework-file').click()" ondragover="handleDragOver(event)" ondrop="handleDrop(event, 'homework-file')">
                        <input type="file" id="homework-file" style="display: none;" required onchange="handleFileSelect('homework-file')">
                        <p>点击或拖拽文件到此处上传</p>
                        <p style="color: #666; font-size: 14px;">支持 PDF、Word、图片等格式</p>
                        <div id="homework-file-name" style="margin-top: 10px; font-size: 14px; color: #3498db;"></div>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">提交作业</button>
            </form>
        </div>
    `;
}

// 渲染问题提交页面
function renderQuestionSection() {
    return `
        <div class="card">
            <h3>问题提交</h3>
            <form onsubmit="handleQuestionSubmit(event)">
                <div class="form-group">
                    <label for="question-content">问题内容</label>
                    <textarea id="question-content" rows="5" required></textarea>
                </div>
                <div class="form-group">
                    <label for="question-file">上传附件（可选）</label>
                    <div class="upload-area" onclick="document.getElementById('question-file').click()" ondragover="handleDragOver(event)" ondrop="handleDrop(event, 'question-file')">
                        <input type="file" id="question-file" style="display: none;" onchange="handleFileSelect('question-file')">
                        <p>点击或拖拽文件到此处上传</p>
                        <p style="color: #666; font-size: 14px;">支持 PDF、Word、图片等格式</p>
                        <div id="question-file-name" style="margin-top: 10px; font-size: 14px; color: #3498db;"></div>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">提交问题</button>
            </form>
        </div>
    `;
}

// 渲染已提交作业页面
function renderSubmittedHomeworkSection() {
    const studentHomework = window.data.homework.filter(hw => hw.username === currentUser.username);
    let homeworkList = '';
    
    studentHomework.forEach(hw => {
        homeworkList += `
            <tr>
                <td>${hw.date}</td>
                <td>${hw.content || '无描述'}</td>
                <td>${hw.file_name ? '有附件' : '无附件'}</td>
                <td>${hw.graded ? '已批改' : '未批改'}</td>
                <td>
                    ${hw.file_name ? `<button class="btn btn-primary" onclick="previewFile('${hw.file_path}', '${hw.file_name}')">预览附件</button>` : ''}
                    ${hw.graded && hw.feedback ? `<button class="btn btn-secondary" onclick="viewHomeworkFeedback(${hw.id})">查看反馈</button>` : ''}
                </td>
            </tr>
        `;
    });
    
    return `
        <div class="card">
            <h3>已提交作业</h3>
            <table>
                <thead>
                    <tr>
                        <th>提交日期</th>
                        <th>作业描述</th>
                        <th>附件</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${homeworkList || '<tr><td colspan="5">暂无已提交的作业</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

// 渲染已提交问题页面
function renderSubmittedQuestionsSection() {
    const studentQuestions = window.data.questions.filter(q => q.username === currentUser.username);
    let questionList = '';
    
    studentQuestions.forEach(q => {
        questionList += `
            <tr>
                <td>${q.date}</td>
                <td>${q.content}</td>
                <td>${q.file_name ? '有附件' : '无附件'}</td>
                <td>${q.answered ? '已回答' : '未回答'}</td>
                <td>
                    ${q.file_name ? `<button class="btn btn-primary" onclick="previewFile('${q.file_path}', '${q.file_name}')">预览附件</button>` : ''}
                    ${q.answered ? `<button class="btn btn-secondary" onclick="viewQuestionAnswer(${q.id})">查看回答</button>` : ''}
                </td>
            </tr>
        `;
    });
    
    return `
        <div class="card">
            <h3>已提交问题</h3>
            <table>
                <thead>
                    <tr>
                        <th>提交日期</th>
                        <th>问题内容</th>
                        <th>附件</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${questionList || '<tr><td colspan="5">暂无已提交的问题</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

// 渲染教室预约页面
function renderBookingSection() {
    // 生成时间段选项
    const timeOptions = [];
    for (let hour = 9; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            // 跳过中午12:30-14:00的时间段
            if (!(hour === 12 && minute === 30) && !(hour === 13 && minute === 0)) {
                timeOptions.push(`<option value="${time}">${time}</option>`);
            }
        }
    }
    
    return `
        <div class="card">
            <h3>教室预约</h3>
            <form class="booking-form" onsubmit="handleBookingSubmit(event)">
                <div class="form-group">
                    <label for="classroom-id">教室编号</label>
                    <select id="classroom-id" required>
                        ${Array.from({length: 8}, (_, i) => `<option value="${i + 1}">${i + 1}号教室</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="booking-date">日期</label>
                    <input type="date" id="booking-date" required>
                </div>
                <div class="form-group">
                    <label for="start-time">开始时间</label>
                    <select id="start-time" required>
                        ${timeOptions.join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="end-time">结束时间</label>
                    <select id="end-time" required>
                        ${timeOptions.join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="booking-purpose">用途</label>
                    <select id="booking-purpose" required>
                        <option value="exam">模考</option>
                        <option value="speaking">口语练习</option>
                        <option value="self-study">自习</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                    <button type="submit" class="btn btn-primary">提交预约</button>
                </div>
            </form>
        </div>
    `;
}

// 辅助函数：获取学习阶段文本
function getStudyLevelText(level) {
    const levels = {
        junior: '初中',
        high: '高中',
        cet4: '大学四级',
        cet6: '大学六级',
        ielts: '雅思',
        toefl: '托福'
    };
    return levels[level] || level;
}

// 辅助函数：显示通知
window.showNotification = function(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 退出登录
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// 到校打卡
async function checkIn() {
    const today = new Date().toISOString().split('T')[0];
    // 检查今天是否已经到校
    const hasCheckedIn = window.data.attendance.some(record => 
        record.username === currentUser.username && 
        record.date === today && 
        record.type === 'in'
    );
    
    if (hasCheckedIn) {
        showNotification('今天已经到校打卡，不能重复打卡', 'error');
        return;
    }
    
    const now = new Date();
    const record = {
        username: currentUser.username,
        date: today,
        time: now.toTimeString().substring(0, 8),
        type: 'in'
    };
    
    // 调用API保存考勤记录
    const response = await apiRequest('/attendance', 'POST', record);
    if (response.success) {
        // 更新本地数据
        window.data.attendance.push(record);
        showNotification('到校打卡成功', 'success');
    } else {
        showNotification('打卡失败，请稍后重试', 'error');
    }
}

// 离校打卡
async function checkOut() {
    const today = new Date().toISOString().split('T')[0];
    // 检查今天是否已经离校
    const hasCheckedOut = window.data.attendance.some(record => 
        record.username === currentUser.username && 
        record.date === today && 
        record.type === 'out'
    );
    
    // 检查今天是否已经到校
    const hasCheckedIn = window.data.attendance.some(record => 
        record.username === currentUser.username && 
        record.date === today && 
        record.type === 'in'
    );
    
    if (hasCheckedOut) {
        showNotification('今天已经离校打卡，不能重复打卡', 'error');
        return;
    }
    
    if (!hasCheckedIn) {
        showNotification('请先到校打卡，再进行离校打卡', 'error');
        return;
    }
    
    const now = new Date();
    const record = {
        username: currentUser.username,
        date: today,
        time: now.toTimeString().substring(0, 8),
        type: 'out'
    };
    
    // 调用API保存考勤记录
    const response = await apiRequest('/attendance', 'POST', record);
    if (response.success) {
        // 更新本地数据
        window.data.attendance.push(record);
        showNotification('离校打卡成功', 'success');
    } else {
        showNotification('打卡失败，请稍后重试', 'error');
    }
}

// 处理拖拽文件
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.style.backgroundColor = '#f0f8ff';
}

// 处理文件放置
function handleDrop(event, inputId) {
    event.preventDefault();
    event.currentTarget.style.backgroundColor = '';
    
    const fileInput = document.getElementById(inputId);
    const fileNameDisplay = document.getElementById(inputId.replace('-file', '-file-name'));
    
    if (event.dataTransfer.files.length > 0) {
        const file = event.dataTransfer.files[0];
        // 创建一个DataTransfer对象来模拟文件输入
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // 显示文件名
        if (fileNameDisplay) {
            fileNameDisplay.textContent = `已选择: ${file.name}`;
        }
    }
}

// 处理文件选择
function handleFileSelect(inputId) {
    const fileInput = document.getElementById(inputId);
    const fileNameDisplay = document.getElementById(inputId.replace('-file', '-file-name'));
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (fileNameDisplay) {
            fileNameDisplay.textContent = `已选择: ${file.name}`;
        }
    } else {
        if (fileNameDisplay) {
            fileNameDisplay.textContent = '';
        }
    }
}

// 处理作业提交
async function handleHomeworkSubmit(event) {
    event.preventDefault();
    const content = document.getElementById('homework-content').value;
    const fileInput = document.getElementById('homework-file');
    const file = fileInput.files[0];
    
    if (file) {
        // 这里简化处理，实际应该上传文件到服务器
        // 这里使用URL.createObjectURL作为临时解决方案
        const filePath = URL.createObjectURL(file);
        
        const record = {
            username: currentUser.username,
            date: new Date().toISOString().split('T')[0],
            content: content,
            fileName: file.name,
            filePath: filePath
        };
        
        // 调用API保存作业
        const response = await apiRequest('/homework', 'POST', record);
        if (response.success) {
            // 更新本地数据
            window.data.homework.push(record);
            showNotification('作业上传成功', 'success');
            event.target.reset();
            document.getElementById('homework-file-name').textContent = '';
        } else {
            showNotification('作业上传失败，请稍后重试', 'error');
        }
    } else {
        showNotification('请选择文件', 'error');
    }
}

// 处理问题提交
async function handleQuestionSubmit(event) {
    event.preventDefault();
    const content = document.getElementById('question-content').value;
    const fileInput = document.getElementById('question-file');
    const file = fileInput.files[0];
    
    const question = {
        username: currentUser.username,
        date: new Date().toISOString().split('T')[0],
        content: content
    };
    
    if (file) {
        // 这里简化处理，实际应该上传文件到服务器
        question.fileName = file.name;
        question.filePath = URL.createObjectURL(file);
    }
    
    // 调用API保存问题
    const response = await apiRequest('/questions', 'POST', question);
    if (response.success) {
        // 更新本地数据
        window.data.questions.push(question);
        showNotification('问题提交成功', 'success');
        event.target.reset();
        document.getElementById('question-file-name').textContent = '';
    } else {
        showNotification('问题提交失败，请稍后重试', 'error');
    }
}

// 处理教室预约
async function handleBookingSubmit(event) {
    event.preventDefault();
    const classroomId = document.getElementById('classroom-id').value;
    const date = document.getElementById('booking-date').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const purpose = document.getElementById('booking-purpose').value;
    
    // 检查是否与现有预约冲突
    const conflict = window.data.bookings.some(booking => 
        booking.classroom_id === parseInt(classroomId) && 
        booking.date === date && 
        !(booking.end_time <= startTime || booking.start_time >= endTime)
    );
    
    if (conflict) {
        showNotification('该时间段已被占用', 'error');
        return;
    }
    
    // 检查是否是中午12:30-14:00的时间段
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1]);
    
    if ((startHour === 12 && startMinute >= 30) || (startHour === 13 && startMinute < 60) ||
        (endHour === 12 && endMinute > 30) || (endHour === 13 && endMinute <= 0)) {
        showNotification('中午12:30-14:00时间段不能预约', 'error');
        return;
    }
    
    const booking = {
        username: currentUser.username,
        classroomId: parseInt(classroomId),
        date: date,
        startTime: startTime,
        endTime: endTime,
        purpose: purpose
    };
    
    // 调用API保存预约
    const response = await apiRequest('/bookings', 'POST', booking);
    if (response.success) {
        // 更新本地数据
        window.data.bookings.push(booking);
        // 更新教室状态
        const classroom = window.data.classrooms.find(c => c.id === parseInt(classroomId));
        if (classroom) {
            classroom.status = 'occupied';
        }
        showNotification('教室预约成功', 'success');
        event.target.reset();
        window.location.reload();
    } else {
        showNotification('预约失败，请稍后重试', 'error');
    }
}

// 回答问题
async function answerQuestion(questionId) {
    const question = window.data.questions.find(q => q.id === questionId);
    if (question) {
        const answer = prompt('请输入回答:');
        if (answer) {
            // 调用API更新问题
            const response = await apiRequest(`/questions/${questionId}`, 'PUT', { answer });
            if (response.success) {
                // 更新本地数据
                question.answered = true;
                question.answer = answer;
                showNotification('回答成功', 'success');
                // 刷新页面
                window.location.reload();
            } else {
                showNotification('回答失败，请稍后重试', 'error');
            }
        }
    }
}

// 查看问题（标记为已读）
function viewQuestion(questionId) {
    const question = window.data.questions.find(q => q.id === questionId);
    if (question) {
        let content = `
            <h3>问题详情</h3>
            <p><strong>学生:</strong> ${question.name || question.username}</p>
            <p><strong>提交日期:</strong> ${question.date}</p>
            <p><strong>问题内容:</strong> ${question.content}</p>
        `;
        
        if (question.file_name) {
            content += `<p><strong>附件:</strong> <a href="${question.file_path}" target="_blank">${question.file_name}</a></p>`;
        }
        
        if (question.answered && question.answer) {
            content += `<p><strong>回答:</strong> ${question.answer}</p>`;
        }
        
        alert(content);
    }
}

// 查看作业反馈
function viewHomeworkFeedback(homeworkId) {
    const homework = window.data.homework.find(hw => hw.id === homeworkId);
    if (homework) {
        let content = `
            <h3>作业反馈</h3>
            <p><strong>提交日期:</strong> ${homework.date}</p>
            <p><strong>作业描述:</strong> ${homework.content || '无描述'}</p>
        `;
        
        if (homework.feedback) {
            content += `<p><strong>反馈:</strong> ${homework.feedback}</p>`;
        }
        
        alert(content);
    }
}

// 查看问题回答
function viewQuestionAnswer(questionId) {
    const question = window.data.questions.find(q => q.id === questionId);
    if (question) {
        let content = `
            <h3>问题回答</h3>
            <p><strong>提交日期:</strong> ${question.date}</p>
            <p><strong>问题内容:</strong> ${question.content}</p>
        `;
        
        if (question.answer) {
            content += `<p><strong>回答:</strong> ${question.answer}</p>`;
        }
        
        alert(content);
    }
}

// 批改作业
async function gradeHomework(homeworkId) {
    const homework = window.data.homework.find(hw => hw.id === homeworkId);
    if (homework) {
        const feedback = prompt('请输入作业反馈:');
        if (feedback) {
            // 调用API更新作业
            const response = await apiRequest(`/homework/${homeworkId}`, 'PUT', { feedback });
            if (response.success) {
                // 更新本地数据
                homework.graded = true;
                homework.feedback = feedback;
                showNotification('作业批改成功', 'success');
                window.location.reload();
            } else {
                showNotification('批改失败，请稍后重试', 'error');
            }
        }
    }
}

// 下载文件
function downloadFile(filePath) {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = 'homework';
    link.click();
}

// 预览文件
function previewFile(filePath, fileName) {
    // 创建预览模态框
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    modal.onclick = function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
    
    const previewContainer = document.createElement('div');
    previewContainer.style.backgroundColor = 'white';
    previewContainer.style.padding = '20px';
    previewContainer.style.borderRadius = '8px';
    previewContainer.style.maxWidth = '90%';
    previewContainer.style.maxHeight = '90%';
    previewContainer.style.overflow = 'auto';
    previewContainer.style.position = 'relative';
    
    const closeButton = document.createElement('button');
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.textContent = '×';
    closeButton.onclick = function() {
        document.body.removeChild(modal);
    };
    
    const title = document.createElement('h2');
    title.textContent = `预览: ${fileName}`;
    title.style.marginTop = '0';
    title.style.marginBottom = '20px';
    
    const iframe = document.createElement('iframe');
    iframe.src = filePath;
    iframe.style.width = '100%';
    iframe.style.height = '500px';
    iframe.style.border = '1px solid #ddd';
    iframe.style.borderRadius = '4px';
    
    const controls = document.createElement('div');
    controls.style.marginTop = '20px';
    controls.style.display = 'flex';
    controls.style.justifyContent = 'flex-end';
    
    const printButton = document.createElement('button');
    printButton.className = 'btn btn-primary';
    printButton.textContent = '打印';
    printButton.onclick = function() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<iframe src="${filePath}" style="width: 100%; height: 100%; border: none;"></iframe>`);
        printWindow.document.close();
        printWindow.print();
    };
    
    controls.appendChild(printButton);
    
    previewContainer.appendChild(closeButton);
    previewContainer.appendChild(title);
    previewContainer.appendChild(iframe);
    previewContainer.appendChild(controls);
    modal.appendChild(previewContainer);
    
    document.body.appendChild(modal);
}

// 修改手机号
function changePhone() {
    if (currentUser.type !== 'student') return;
    
    const oldPhone = currentUser.username;
    const newPhone = prompt('请输入新的手机号:');
    
    if (newPhone && newPhone !== oldPhone) {
        // 检查新手机号是否已被使用
        if (window.data.users[newPhone]) {
            showNotification('该手机号已被使用', 'error');
            return;
        }
        
        // 确认修改
        if (confirm('确定要修改手机号吗？修改后需要使用新手机号登录。')) {
            // 这里应该调用API修改手机号
            // 简化处理，直接更新本地数据
            showNotification('手机号修改功能暂未实现', 'error');
        }
    }
}

// 修改密码
function changePassword() {
    const oldPassword = prompt('请输入旧密码:');
    if (!oldPassword) return;
    
    // 验证旧密码
    if (window.data.users[currentUser.username].password !== oldPassword) {
        showNotification('旧密码错误', 'error');
        return;
    }
    
    const newPassword = prompt('请输入新密码:');
    if (!newPassword) return;
    
    const confirmPassword = prompt('请再次输入新密码:');
    if (newPassword !== confirmPassword) {
        showNotification('两次输入的密码不一致', 'error');
        return;
    }
    
    // 这里应该调用API修改密码
    // 简化处理，直接更新本地数据
    window.data.users[currentUser.username].password = newPassword;
    showNotification('密码修改成功', 'success');
}

// 编辑学生信息
function editStudent(username) {
    const student = window.data.students[username];
    if (!student) return;
    
    const name = prompt('请输入学生姓名:', student.name);
    const phone = prompt('请输入学生电话号码:', student.phone);
    const studyLevel = prompt('请输入学习阶段 (junior/high/cet4/cet6/ielts/toefl):', student.studyLevel);
    const status = prompt('请输入学习状态 (学习中/已达目标):', student.status || '学习中');
    const examDate = prompt('请输入考试时间:', student.examDate || '');
    const goals = prompt('请输入目标要求:', student.goals || '');
    
    if (name && phone) {
        // 这里应该调用API更新学生信息
        // 简化处理，直接更新本地数据
        student.name = name;
        student.phone = phone;
        student.studyLevel = studyLevel;
        student.status = status;
        student.examDate = examDate;
        student.goals = goals;
        
        showNotification('学生信息更新成功', 'success');
        window.location.reload();
    }
}

// 更新学生字段
window.updateStudentField = async function(username, field, value) {
    const student = window.data.students[username];
    if (!student) return;
    
    // 特殊处理学习阶段
    if (field === 'studyLevel') {
        const levelMap = {
            '初中': 'junior',
            '高中': 'high',
            '大学四级': 'cet4',
            '大学六级': 'cet6',
            '雅思': 'ielts',
            '托福': 'toefl'
        };
        value = levelMap[value] || value;
    }
    
    // 构建更新数据
    const updateData = {};
    updateData[field] = value;
    
    // 调用API更新学生信息
    const response = await apiRequest(`/students/${username}`, 'PUT', updateData);
    if (response.success) {
        // 更新本地数据
        student[field] = value;
        showNotification('学生信息更新成功', 'success');
    } else {
        showNotification('更新失败，请稍后重试', 'error');
    }
};

// 删除学生
async function deleteStudent(username) {
    if (confirm('确定要删除该学生吗？')) {
        // 调用API删除学生
        const response = await apiRequest(`/students/${username}`, 'DELETE');
        if (response.success) {
            // 更新本地数据
            delete window.data.students[username];
            delete window.data.users[username];
            showNotification('学生删除成功', 'success');
            window.location.reload();
        } else {
            showNotification('删除失败，请稍后重试', 'error');
        }
    }
}

// 重置学生密码
function resetPassword(username) {
    if (confirm('确定要重置该学生的密码吗？重置后密码为888888')) {
        // 这里应该调用API重置密码
        // 简化处理，直接更新本地数据
        window.data.users[username].password = '888888';
        showNotification('密码重置成功，新密码为888888', 'success');
    }
}