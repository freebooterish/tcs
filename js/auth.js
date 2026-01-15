/**
 * auth.js - 用户认证模块
 * 处理登录、注册和会话管理
 */

const Auth = (function () {
    /**
     * 尝试登录或注册
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Object} { success: boolean, message: string, isNewUser: boolean }
     */
    function login(username, password) {
        // 验证输入
        if (!username || username.trim().length === 0) {
            return { success: false, message: '请输入用户名' };
        }
        if (!password || password.length < 3) {
            return { success: false, message: '密码至少需要3个字符' };
        }

        const trimmedUsername = username.trim();
        const existingUser = Storage.getUser(trimmedUsername);

        if (existingUser) {
            // 已有用户，验证密码
            if (Storage.verifyPassword(trimmedUsername, password)) {
                Storage.updateLoginTime(trimmedUsername);
                Storage.setCurrentUser(trimmedUsername);
                return { success: true, message: '登录成功', isNewUser: false };
            } else {
                return { success: false, message: '密码错误' };
            }
        } else {
            // 新用户，自动注册
            Storage.createUser(trimmedUsername, password);
            Storage.setCurrentUser(trimmedUsername);
            return { success: true, message: '注册成功，欢迎新玩家！', isNewUser: true };
        }
    }

    /**
     * 退出登录
     */
    function logout() {
        Storage.setCurrentUser(null);
    }

    /**
     * 检查是否已登录
     * @returns {boolean} 是否已登录
     */
    function isLoggedIn() {
        return Storage.getCurrentUser() !== null;
    }

    /**
     * 获取当前用户名
     * @returns {string|null} 当前用户名
     */
    function getCurrentUsername() {
        return Storage.getCurrentUser();
    }

    /**
     * 获取当前用户统计信息
     * @returns {Object} 用户统计
     */
    function getCurrentUserStats() {
        const username = Storage.getCurrentUser();
        if (!username) return null;
        // 游客模式返回空统计
        if (username === '__guest__') {
            return { highScore: 0, gamesPlayed: 0, totalScore: 0 };
        }
        return Storage.getUserStats(username);
    }

    /**
     * 游客模式登录
     * @returns {Object} { success: boolean, message: string }
     */
    function loginAsGuest() {
        Storage.setCurrentUser('__guest__');
        return { success: true, message: '游客模式启动', isGuest: true };
    }

    /**
     * 检查当前是否为游客模式
     * @returns {boolean} 是否为游客
     */
    function isGuest() {
        return Storage.getCurrentUser() === '__guest__';
    }

    // 公开 API
    return {
        login,
        logout,
        isLoggedIn,
        getCurrentUsername,
        getCurrentUserStats,
        loginAsGuest,
        isGuest
    };
})();
