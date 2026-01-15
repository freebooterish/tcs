/**
 * storage.js - 数据存储模块
 * 使用 LocalStorage 管理用户数据和游戏记录
 */

const Storage = (function() {
    // 存储键名
    const STORAGE_KEY = 'snake_game_data';
    
    /**
     * 获取所有数据
     * @returns {Object} 存储的数据对象
     */
    function getData() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('解析存储数据失败:', e);
                return getDefaultData();
            }
        }
        return getDefaultData();
    }
    
    /**
     * 获取默认数据结构
     * @returns {Object} 默认数据
     */
    function getDefaultData() {
        return {
            users: {},
            currentUser: null
        };
    }
    
    /**
     * 保存数据
     * @param {Object} data - 要保存的数据
     */
    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    /**
     * 简单的字符串哈希（仅用于演示，生产环境请使用更安全的方式）
     * @param {string} str - 要哈希的字符串
     * @returns {string} 哈希结果
     */
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return hash.toString(16);
    }
    
    /**
     * 获取用户信息
     * @param {string} username - 用户名
     * @returns {Object|null} 用户信息或 null
     */
    function getUser(username) {
        const data = getData();
        return data.users[username] || null;
    }
    
    /**
     * 创建新用户
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Object} 新用户信息
     */
    function createUser(username, password) {
        const data = getData();
        const now = new Date().toISOString();
        
        const user = {
            password: simpleHash(password),
            createdAt: now,
            lastLogin: now,
            highScore: 0,
            gamesPlayed: 0,
            totalScore: 0
        };
        
        data.users[username] = user;
        saveData(data);
        
        return user;
    }
    
    /**
     * 验证用户密码
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {boolean} 是否验证成功
     */
    function verifyPassword(username, password) {
        const user = getUser(username);
        if (!user) return false;
        return user.password === simpleHash(password);
    }
    
    /**
     * 更新用户登录时间
     * @param {string} username - 用户名
     */
    function updateLoginTime(username) {
        const data = getData();
        if (data.users[username]) {
            data.users[username].lastLogin = new Date().toISOString();
            saveData(data);
        }
    }
    
    /**
     * 设置当前用户
     * @param {string|null} username - 用户名或 null
     */
    function setCurrentUser(username) {
        const data = getData();
        data.currentUser = username;
        saveData(data);
    }
    
    /**
     * 获取当前用户
     * @returns {string|null} 当前用户名
     */
    function getCurrentUser() {
        const data = getData();
        return data.currentUser;
    }
    
    /**
     * 更新游戏统计
     * @param {string} username - 用户名
     * @param {number} score - 本局分数
     */
    function updateGameStats(username, score) {
        const data = getData();
        if (data.users[username]) {
            const user = data.users[username];
            user.gamesPlayed += 1;
            user.totalScore += score;
            if (score > user.highScore) {
                user.highScore = score;
            }
            saveData(data);
        }
    }
    
    /**
     * 获取用户统计
     * @param {string} username - 用户名
     * @returns {Object} 用户统计信息
     */
    function getUserStats(username) {
        const user = getUser(username);
        if (!user) {
            return { highScore: 0, gamesPlayed: 0, totalScore: 0 };
        }
        return {
            highScore: user.highScore,
            gamesPlayed: user.gamesPlayed,
            totalScore: user.totalScore,
            lastLogin: user.lastLogin
        };
    }
    
    // 公开 API
    return {
        getUser,
        createUser,
        verifyPassword,
        updateLoginTime,
        setCurrentUser,
        getCurrentUser,
        updateGameStats,
        getUserStats
    };
})();
