// 数据存储
window.data = {
    // 用户数据
    users: {
        // 管理员账号
        admin: {
            password: 'admin123',
            type: 'admin'
        }
    },
    
    // 学生信息
    students: {},
    
    // 教室预约
    bookings: [],
    
    // 考勤记录
    attendance: [],
    
    // 作业提交
    homework: [],
    
    // 问题提交
    questions: [],
    
    // 教室状态
    classrooms: Array.from({length: 8}, (_, i) => ({
        id: i + 1,
        status: 'available',
        bookings: []
    }))
};

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
        // 失败时使用本地数据作为备份
        return { success: false, error: error.message };
    }
}

// 保存数据到后端
window.saveData = async function() {
    // 数据现在通过API实时保存，此函数保留以保持兼容性
    console.log('数据已通过API保存');
};

// 从后端加载数据
window.loadData = async function() {
    try {
        // 加载学生数据
        const studentsResponse = await apiRequest('/students');
        if (studentsResponse.success) {
            window.data.students = {};
            studentsResponse.data.forEach(student => {
                window.data.students[student.username] = {
                    name: student.name,
                    phone: student.phone,
                    studyLevel: student.study_level,
                    status: student.status,
                    examDate: student.exam_date,
                    goals: student.goals,
                    createdAt: student.created_at
                };
            });
        }
        
        // 加载教室数据
        const classroomsResponse = await apiRequest('/classrooms');
        if (classroomsResponse.success) {
            window.data.classrooms = classroomsResponse.data.map(classroom => ({
                id: classroom.id,
                status: classroom.status,
                bookings: []
            }));
        }
        
        // 加载预约数据
        const bookingsResponse = await apiRequest('/bookings');
        if (bookingsResponse.success) {
            window.data.bookings = bookingsResponse.data;
        }
        
        // 加载考勤数据
        const today = new Date().toISOString().split('T')[0];
        const attendanceResponse = await apiRequest(`/attendance/${today}`);
        if (attendanceResponse.success) {
            window.data.attendance = attendanceResponse.data;
        }
        
        // 加载作业数据
        const homeworkResponse = await apiRequest('/homework');
        if (homeworkResponse.success) {
            window.data.homework = homeworkResponse.data;
        }
        
        // 加载问题数据
        const questionsResponse = await apiRequest('/questions');
        if (questionsResponse.success) {
            window.data.questions = questionsResponse.data;
        }
        
        console.log('数据加载成功');
    } catch (error) {
        console.error('数据加载失败:', error);
    }
};

// 初始化数据
window.loadData();

// 导出数据和方法
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { data: window.data, saveData: window.saveData, loadData: window.loadData };
}