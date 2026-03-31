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

// 保存数据到本地存储
window.saveData = function() {
    localStorage.setItem('englishStudioData', JSON.stringify(window.data));
};

// 从本地存储加载数据
window.loadData = function() {
    const savedData = localStorage.getItem('englishStudioData');
    if (savedData) {
        Object.assign(window.data, JSON.parse(savedData));
    }
};

// 初始化数据
window.loadData();

// 导出数据和方法
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { data: window.data, saveData: window.saveData, loadData: window.loadData };
}