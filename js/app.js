/**
 * app.js - 应用主控制器
 * 负责初始化、界面切换和事件绑定
 */

(function () {
    // DOM 元素引用
    const elements = {
        // 屏幕
        loginScreen: document.getElementById('login-screen'),
        gameScreen: document.getElementById('game-screen'),

        // 登录表单
        loginForm: document.getElementById('login-form'),
        usernameInput: document.getElementById('username'),
        passwordInput: document.getElementById('password'),
        loginError: document.getElementById('login-error'),

        // 游戏界面
        gameCanvas: document.getElementById('game-canvas'),
        currentUser: document.getElementById('current-user'),
        currentScore: document.getElementById('current-score'),
        highScore: document.getElementById('high-score'),
        gamesPlayed: document.getElementById('games-played'),

        // 游戏覆盖层
        gameOverlay: document.getElementById('game-overlay'),
        overlayTitle: document.getElementById('overlay-title'),
        overlayMessage: document.getElementById('overlay-message'),

        // 按钮
        restartBtn: document.getElementById('restart-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        guestBtn: document.getElementById('guest-btn')
    };

    /**
     * 初始化应用
     */
    function init() {
        // 检查是否已登录
        if (Auth.isLoggedIn()) {
            showGameScreen();
        } else {
            showLoginScreen();
        }

        // 绑定事件
        bindEvents();
    }

    /**
     * 绑定事件监听器
     */
    function bindEvents() {
        // 登录表单提交
        elements.loginForm.addEventListener('submit', handleLogin);

        // 游客模式按钮
        elements.guestBtn.addEventListener('click', handleGuestLogin);

        // 重新开始按钮
        elements.restartBtn.addEventListener('click', handleRestart);

        // 退出登录按钮
        elements.logoutBtn.addEventListener('click', handleLogout);
    }

    /**
     * 处理登录
     * @param {Event} event - 表单提交事件
     */
    function handleLogin(event) {
        event.preventDefault();

        const username = elements.usernameInput.value;
        const password = elements.passwordInput.value;

        const result = Auth.login(username, password);

        if (result.success) {
            elements.loginError.textContent = '';
            showGameScreen();
        } else {
            elements.loginError.textContent = result.message;
        }
    }

    /**
     * 处理游客模式登录
     */
    function handleGuestLogin() {
        Auth.loginAsGuest();
        showGameScreen();
    }

    /**
     * 处理重新开始
     */
    function handleRestart() {
        SnakeGame.reset();
        SnakeGame.start();
        hideOverlay();
    }

    /**
     * 处理退出登录
     */
    function handleLogout() {
        Auth.logout();
        SnakeGame.destroy();
        showLoginScreen();
    }

    /**
     * 显示登录界面
     */
    function showLoginScreen() {
        elements.loginScreen.classList.remove('hidden');
        elements.gameScreen.classList.add('hidden');

        // 清空表单
        elements.usernameInput.value = '';
        elements.passwordInput.value = '';
        elements.loginError.textContent = '';

        // 聚焦用户名输入框
        setTimeout(() => elements.usernameInput.focus(), 100);
    }

    /**
     * 显示游戏界面
     */
    function showGameScreen() {
        elements.loginScreen.classList.add('hidden');
        elements.gameScreen.classList.remove('hidden');

        // 更新用户信息
        const username = Auth.getCurrentUsername();
        // 游客模式显示特殊名称
        elements.currentUser.textContent = Auth.isGuest() ? '游客' : username;

        // 更新统计信息
        updateStats();

        // 初始化游戏
        SnakeGame.init(elements.gameCanvas, {
            onScoreUpdate: handleScoreUpdate,
            onGameOver: handleGameOver
        });

        // 显示初始提示
        showOverlay('准备开始', '按空格键开始游戏');
    }

    /**
     * 更新统计显示
     */
    function updateStats() {
        const stats = Auth.getCurrentUserStats();
        if (stats) {
            elements.highScore.textContent = String(stats.highScore).padStart(3, '0');
            elements.gamesPlayed.textContent = stats.gamesPlayed;
        }
    }

    /**
     * 处理分数更新
     * @param {number} score - 当前分数
     */
    function handleScoreUpdate(score) {
        elements.currentScore.textContent = String(score).padStart(3, '0');
    }

    /**
     * 处理游戏结束
     * @param {number} finalScore - 最终分数
     */
    function handleGameOver(finalScore) {
        // 游客模式不保存数据
        if (!Auth.isGuest()) {
            const username = Auth.getCurrentUsername();
            Storage.updateGameStats(username, finalScore);
            // 更新统计显示
            updateStats();
        }

        // 显示游戏结束覆盖层
        const stats = Auth.getCurrentUserStats();
        const isNewHighScore = finalScore === stats.highScore && finalScore > 0;

        if (isNewHighScore) {
            showOverlay('🎉 新纪录！', `得分: ${finalScore} | 按空格键重新开始`);
        } else {
            showOverlay('游戏结束', `得分: ${finalScore} | 按空格键重新开始`);
        }
    }

    /**
     * 显示覆盖层
     * @param {string} title - 标题
     * @param {string} message - 消息
     */
    function showOverlay(title, message) {
        elements.overlayTitle.textContent = title;
        elements.overlayMessage.textContent = message;
        elements.gameOverlay.classList.remove('hidden');
    }

    /**
     * 隐藏覆盖层
     */
    function hideOverlay() {
        elements.gameOverlay.classList.add('hidden');
    }

    /**
     * 监听游戏状态变化，更新覆盖层
     */
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && elements.gameScreen.classList.contains('hidden') === false) {
            const state = SnakeGame.getState();

            if (state === SnakeGame.STATES.PLAYING) {
                hideOverlay();
            } else if (state === SnakeGame.STATES.PAUSED) {
                showOverlay('游戏暂停', '按空格键继续');
            }
        }
    });

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
