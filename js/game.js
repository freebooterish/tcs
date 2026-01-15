/**
 * game.js - 贪吃蛇游戏核心模块
 * 处理游戏逻辑、渲染和状态管理
 */

const SnakeGame = (function () {
    // 游戏配置
    const CONFIG = {
        gridSize: 20,       // 网格大小
        cellSize: 20,       // 单元格像素大小
        initialSpeed: 150,  // 初始速度（毫秒）
        speedIncrement: 2,  // 每次吃食物减少的毫秒数
        minSpeed: 50        // 最小速度（最快）
    };

    // 方向映射
    const DIRECTIONS = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 }
    };

    // 游戏状态
    const STATES = {
        IDLE: 'idle',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over'
    };

    // 游戏实例变量
    let canvas, ctx;
    let snake = [];
    let food = null;
    let direction = DIRECTIONS.RIGHT;
    let nextDirection = DIRECTIONS.RIGHT;
    let score = 0;
    let gameState = STATES.IDLE;
    let gameLoop = null;
    let speed = CONFIG.initialSpeed;
    
    // 图片资源
    const images = {
        snakeHead: new Image(),
        apple: new Image()
    };
    let imagesLoaded = 0;
    const totalImages = 2;

    // 预加载图片
    images.snakeHead.src = 'assets/snake_head.png';
    images.apple.src = 'assets/apple.png';

    [images.snakeHead, images.apple].forEach(img => {
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages && gameState === STATES.IDLE) {
                render();
            }
        };
    });

    // 回调函数
    let onScoreUpdate = null;
    let onGameOver = null;

    /**
     * 初始化游戏
     * @param {HTMLCanvasElement} canvasElement - 画布元素
     * @param {Object} callbacks - 回调函数 { onScoreUpdate, onGameOver }
     */
    function init(canvasElement, callbacks = {}) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');

        // 设置画布大小
        canvas.width = CONFIG.gridSize * CONFIG.cellSize;
        canvas.height = CONFIG.gridSize * CONFIG.cellSize;

        // 设置回调
        onScoreUpdate = callbacks.onScoreUpdate || null;
        onGameOver = callbacks.onGameOver || null;

        // 初始化游戏状态
        reset();

        // 绑定键盘事件
        document.addEventListener('keydown', handleKeyDown);
    }

    /**
     * 重置游戏
     */
    function reset() {
        // 停止现有游戏循环
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }

        // 初始化蛇（从中间开始，长度3）
        const startX = Math.floor(CONFIG.gridSize / 2);
        const startY = Math.floor(CONFIG.gridSize / 2);
        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        // 初始化方向
        direction = DIRECTIONS.RIGHT;
        nextDirection = DIRECTIONS.RIGHT;

        // 初始化分数和速度
        score = 0;
        speed = CONFIG.initialSpeed;

        // 生成食物
        spawnFood();

        // 设置状态
        gameState = STATES.IDLE;

        // 渲染初始状态
        render();
    }

    /**
     * 开始游戏
     */
    function start() {
        if (gameState === STATES.PLAYING) return;

        if (gameState === STATES.GAME_OVER || gameState === STATES.IDLE) {
            reset();
        }

        gameState = STATES.PLAYING;
        gameLoop = setInterval(update, speed);
    }

    /**
     * 暂停/继续游戏
     */
    function togglePause() {
        if (gameState === STATES.PLAYING) {
            gameState = STATES.PAUSED;
            clearInterval(gameLoop);
            gameLoop = null;
        } else if (gameState === STATES.PAUSED) {
            gameState = STATES.PLAYING;
            gameLoop = setInterval(update, speed);
        }
    }

    /**
     * 获取当前游戏状态
     * @returns {string} 游戏状态
     */
    function getState() {
        return gameState;
    }

    /**
     * 获取当前分数
     * @returns {number} 分数
     */
    function getScore() {
        return score;
    }

    /**
     * 处理键盘输入
     * @param {KeyboardEvent} event - 键盘事件
     */
    function handleKeyDown(event) {
        // 空格键：开始/暂停
        if (event.code === 'Space') {
            event.preventDefault();
            if (gameState === STATES.IDLE || gameState === STATES.GAME_OVER) {
                start();
            } else {
                togglePause();
            }
            return;
        }

        // 方向键控制
        if (gameState !== STATES.PLAYING) return;

        let newDirection = null;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (direction !== DIRECTIONS.DOWN) {
                    newDirection = DIRECTIONS.UP;
                }
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (direction !== DIRECTIONS.UP) {
                    newDirection = DIRECTIONS.DOWN;
                }
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (direction !== DIRECTIONS.RIGHT) {
                    newDirection = DIRECTIONS.LEFT;
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (direction !== DIRECTIONS.LEFT) {
                    newDirection = DIRECTIONS.RIGHT;
                }
                break;
        }

        if (newDirection) {
            event.preventDefault();
            nextDirection = newDirection;
        }
    }

    /**
     * 游戏主更新循环
     */
    function update() {
        if (gameState !== STATES.PLAYING) return;

        // 更新方向
        direction = nextDirection;

        // 计算新头部位置
        const head = snake[0];
        const newHead = {
            x: head.x + direction.x,
            y: head.y + direction.y
        };

        // 检测碰撞
        if (checkCollision(newHead)) {
            endGame();
            return;
        }

        // 移动蛇
        snake.unshift(newHead);

        // 检测是否吃到食物
        if (newHead.x === food.x && newHead.y === food.y) {
            // 增加分数
            score += 10;
            if (onScoreUpdate) onScoreUpdate(score);

            // 加速
            if (speed > CONFIG.minSpeed) {
                speed -= CONFIG.speedIncrement;
                clearInterval(gameLoop);
                gameLoop = setInterval(update, speed);
            }

            // 生成新食物
            spawnFood();
        } else {
            // 移除尾部
            snake.pop();
        }

        // 渲染
        render();
    }

    /**
     * 检测碰撞
     * @param {Object} head - 头部位置 { x, y }
     * @returns {boolean} 是否碰撞
     */
    function checkCollision(head) {
        // 撞墙
        if (head.x < 0 || head.x >= CONFIG.gridSize ||
            head.y < 0 || head.y >= CONFIG.gridSize) {
            return true;
        }

        // 撞自己（不包括第一个元素，因为那是旧的头部位置）
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                return true;
            }
        }

        return false;
    }

    /**
     * 生成食物
     */
    function spawnFood() {
        let newFood;
        let valid = false;

        while (!valid) {
            newFood = {
                x: Math.floor(Math.random() * CONFIG.gridSize),
                y: Math.floor(Math.random() * CONFIG.gridSize)
            };

            // 确保食物不在蛇身上
            valid = true;
            for (const segment of snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    valid = false;
                    break;
                }
            }
        }

        food = newFood;
    }

    /**
     * 游戏结束
     */
    function endGame() {
        gameState = STATES.GAME_OVER;
        clearInterval(gameLoop);
        gameLoop = null;

        if (onGameOver) onGameOver(score);

        render();
    }

    /**
     * 渲染游戏画面
     */
    function render() {
        const cellSize = CONFIG.cellSize;

        // 清空画布
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制网格（可选，增加视觉效果）
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= CONFIG.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvas.width, i * cellSize);
            ctx.stroke();
        }

        // 绘制食物
        if (food) {
            const foodX = food.x * cellSize;
            const foodY = food.y * cellSize;
            
            if (imagesLoaded === totalImages) {
                ctx.drawImage(images.apple, foodX, foodY, cellSize, cellSize);
            } else {
                // 备选方案：如果图片未加载完成，使用原本的渐变发光效果
                const centerX = foodX + cellSize / 2;
                const centerY = foodY + cellSize / 2;
                const foodRadius = cellSize / 2 - 2;

                const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, foodRadius * 2);
                glow.addColorStop(0, 'rgba(217, 70, 239, 0.8)');
                glow.addColorStop(0.5, 'rgba(217, 70, 239, 0.3)');
                glow.addColorStop(1, 'rgba(217, 70, 239, 0)');
                ctx.fillStyle = glow;
                ctx.fillRect(foodX - cellSize / 2, foodY - cellSize / 2, cellSize * 2, cellSize * 2);

                ctx.fillStyle = '#d946ef';
                ctx.beginPath();
                ctx.arc(centerX, centerY, foodRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 绘制蛇
        snake.forEach((segment, index) => {
            const x = segment.x * cellSize;
            const y = segment.y * cellSize;
            const size = cellSize - 2;

            // 头部特殊处理
            if (index === 0) {
                if (imagesLoaded === totalImages) {
                    ctx.save();
                    ctx.translate(x + cellSize / 2, y + cellSize / 2);
                    
                    // 根据方向旋转 (默认图片朝上)
                    let angle = 0;
                    if (direction === DIRECTIONS.RIGHT) angle = Math.PI / 2;
                    else if (direction === DIRECTIONS.DOWN) angle = Math.PI;
                    else if (direction === DIRECTIONS.LEFT) angle = -Math.PI / 2;
                    
                    ctx.rotate(angle);
                    ctx.drawImage(images.snakeHead, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
                    ctx.restore();
                } else {
                    // 头部发光备选
                    const headGlow = ctx.createRadialGradient(
                        x + cellSize / 2, y + cellSize / 2, 0,
                        x + cellSize / 2, y + cellSize / 2, cellSize
                    );
                    headGlow.addColorStop(0, 'rgba(34, 211, 238, 0.5)');
                    headGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
                    ctx.fillStyle = headGlow;
                    ctx.fillRect(x - cellSize / 2, y - cellSize / 2, cellSize * 2, cellSize * 2);

                    ctx.fillStyle = '#22d3ee';
                    const radius = 4;
                    ctx.beginPath();
                    ctx.roundRect(x + 1, y + 1, size, size, radius);
                    ctx.fill();
                }
            } else {
                // 身体渐变（从青色到略暗）
                const alpha = 1 - (index / snake.length) * 0.5;
                ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
            }

            // 绘制圆角矩形
            const radius = 4;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, size, size, radius);
            ctx.fill();
        });
    }

    /**
     * 销毁游戏（清理事件监听）
     */
    function destroy() {
        document.removeEventListener('keydown', handleKeyDown);
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
    }

    // 公开 API
    return {
        init,
        reset,
        start,
        togglePause,
        getState,
        getScore,
        destroy,
        STATES
    };
})();
