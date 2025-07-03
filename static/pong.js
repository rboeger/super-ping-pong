import * as powerUps from "./powerUps.js";

const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
const hitSound = document.getElementById("hitSound");
const titleSound = document.getElementById("titleSound");
const skullSound = document.getElementById("skullSound");
const startGameSound = document.getElementById("startGameSound");
const skullActivateSound = document.getElementById("skullActivateSound");
const roundOverSound = document.getElementById("roundOverSound");
const speedUpSound = document.getElementById("speedUpSound");
const powerUpSound = document.getElementById("powerUpSound");
const niceShootinTexSound = document.getElementById("niceShootinTexSound");
//const gasStationSound = document.getElementById("gasStationSound")
const score = document.getElementById("score");
const title = document.getElementById('start-game-button');
let player1Score = 0, player2Score = 0;
let canAddPowerUp = true;
const powerUpRate = 12;   // number between 1 and 100. represents chance of powerup appearing every interval
const maxSpeed = 80;
const powerUpInterval = 250;   // interval in milliseconds
const fpsCap = 1000 / 60;  // set fps cap to 60 fps
export let lastHit = 0;
let playing = 0;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const RNG = (min, max) => {
    return Math.random() * (max - min) + min;
}

const RNGPositiveOrNegative = (num) => {
    return Math.random() > 0.5 ? num : -num;
}

const defaultPaddleWidth = canvas.width / 65 
const defaultPaddleHeight = canvas.height / 5;
const paddleSizeIncrease = defaultPaddleHeight * 1.50;
const paddleSizeDecrease = defaultPaddleHeight * 0.62;
//const paddleSpeed = 8;
const paddleSpeed = canvas.height / 60;
const ballSize = canvas.height / 50;

let leftPaddle = { 
    x: 30,
    y: canvas.height / 2 - defaultPaddleHeight / 2,
    dy: 0,
    height: canvas.height / 5,
    sizeDecreased: false,
    sizeIncreaseCount: 0,
    movingUp: false,
    movingDown: false,
    sticky: 0   // 0 = not sticky; 1 = primed for sticky; 2 = currently has ball stuck 
};

let rightPaddle = {
    x: canvas.width - 50,
    y: canvas.height / 2 - defaultPaddleHeight / 2,
    dy: 0,
    height: canvas.height / 5,
    sizeDecreased: false,
    sizeIncreaseCount: 0,
    movingUp: false,
    movingDown: false,
    sticky: 0   // 0 = not sticky; 1 = primed for sticky; 2 = currently has ball stuck 
};

export let ballArray = [];

export const createNewBall = (x, y) => {
    const newBall = {
        x: x,
        y: y,
        dx: RNGPositiveOrNegative(RNG(1, 20)) * canvas.width / 50,
        dy: RNGPositiveOrNegative(RNG(1, 20)) * canvas.height / 50,
        size: canvas.height / 50,
        killMode: false
    }
    ballArray.push(newBall);
}

createNewBall(canvas.width / 2, canvas.height / 2);

const powerUpList = {
    "increaseBallSpeed": {chance: 12},
    "decreaseBallSpeed": {chance: 5},
    "increasePaddleSize": {chance: 12},
    "decreasePaddleSize": {chance: 8},
    "skullOnTheField": {chance: 4},
    "gasStation": {chance: 15},
    "sidewaysGasStation": {chance: 15},
    "stickyPaddle": {chance: 8},
    "ballJump": {chance: 12},
    "middleBarrier": {chance: 8},
    "ballMultiply": {chance: 6}
}

// gets random number between 1 and length of power up list and returns related powerup
const getRandomPowerUp = () => {
    const powerUpPercentages = calculatePowerUpPercentages();
    return powerUpPercentages[parseInt(RNG(1, powerUpPercentages.length))];
}

// this loop should run x times to calculate the odds of powerups
// returns a list of all elements with the powerups
const calculatePowerUpPercentages = () => {
    let percentages = [];
    for (const key in powerUpList) {
        for (let i = 0; i < powerUpList[key].chance; i++) {
            percentages.push(key);
        }
    }
    return percentages;
}

const calculatePowerUpLocation = () => {
    return {
        x: RNG(100, canvas.width - 100),
        y: RNG(100, canvas.height - 100)
    }
}   

const drawRect = (x, y, width, height) => {
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, width, height);
}

const drawBall = (ballIndex) => {
    ctx.beginPath();
    ctx.arc(ballArray[ballIndex].x, ballArray[ballIndex].y, ballSize, 0, Math.PI * 2);
    if (ballArray[ballIndex].killMode) {
        ctx.fillStyle = "red";
    } else {
        ctx.fillStyle = "white";
    }
    ctx.fill();
    ctx.closePath();
}

const movePaddle = (paddle) => {
    paddle.y += paddle.dy;
    if (paddle.y < 0) paddle.y = 0;
    ballArray.forEach((ball) => {
        if (ball.y < 0) ball.y = 0;
        if (ball.y > canvas.height) ball.y = canvas.height;
    })
    if (paddle.y > canvas.height - paddle.height) paddle.y = canvas.height - paddle.height;
}

const playSound = (sound) => {
    sound.currentTime = 0;
    sound.play();
}

const setBallSpeed = (ballIndex, speedNum) => {
    let biggerNum;
    biggerNum = Math.abs(ballArray[ballIndex].dx) > Math.abs(ballArray[ballIndex].dy) 
        ? Math.abs(ballArray[ballIndex].dx) 
        : Math.abs(ballArray[ballIndex].dy);
    const speedDifference = speedNum / biggerNum;  // speedDifference should always be positive
    ballArray[ballIndex].dx = ballArray[ballIndex].dx * speedDifference;
    ballArray[ballIndex].dy = ballArray[ballIndex].dy * speedDifference;
}

const increaseBallSpeed = (ballIndex, increase) => {
    if (Math.abs(ballArray[ballIndex].dx) < maxSpeed) {
        ballArray[ballIndex].dx = ballArray[ballIndex].dx * (1 + increase);
    }
    if (Math.abs(ballArray[ballIndex].dy) < maxSpeed) {
        ballArray[ballIndex].dy = ballArray[ballIndex].dy * (1 + increase);
    }
}

const getBallSpeed = (ballIndex) => {
    return Math.abs(ballArray[ballIndex].dx) > Math.abs(ballArray[ballIndex].dy) 
        ? Math.abs(ballArray[ballIndex].dx) 
        : Math.abs(ballArray[ballIndex].dy);
}

const moveBall = () => {
    ballArray.forEach((ball) => {
        ball.x += ball.dx;
        ball.y += ball.dy;
    })
    handleScreenTopAndBottomHits();
    handleLeftPaddleHit();
    handleRightPaddleHit();
    handleMiddleBarrierHit();
    handleGoal();
}

const handleMiddleBarrierHit = () => {
    if (powerUps.isBarrierActive) {
        ballArray.forEach((ball) => {
            if (powerUps.barrierPlayer === 1 && ball.x + ballSize > 
                    powerUps.barrierX + powerUps.getBarrierWidth(powerUps.barrierStrength)) {
                playSound(hitSound);
                ball.dx = -ball.dx;
                ball.x = powerUps.barrierX - ballSize - 1;
                increaseBallSpeed(0.03);
                powerUps.reduceBarrierStrength();
            } else if (powerUps.barrierPlayer === 2 && ball.x - ballSize < powerUps.barrierX) {
                playSound(hitSound);
                ball.dx = -ball.dx;
                ball.x = powerUps.barrierX + ballSize + 1;
                increaseBallSpeed(0.03);
                powerUps.reduceBarrierStrength();
            }
        })
    }
}

const handleScreenTopAndBottomHits = () => {
    ballArray.forEach((ball) => {
        if (ball.y <= ballSize || ball.y >= canvas.height - ballSize) {
            playSound(hitSound);
            ball.dy = -ball.dy;
            increaseBallSpeed(ballArray.indexOf(ball), 0.03);
        }
    })
}

const handleLeftPaddleHit = () => {
    ballArray.forEach((ball) => {
        if (ball.x <= leftPaddle.x + defaultPaddleWidth && ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + leftPaddle.height) {
            playSound(hitSound);
            setBallLocationAfterPaddleHit();
            lastHit = 1;
            const currentBallSpeed = getBallSpeed();
            if (leftPaddle.movingUp) {
                ball.dy -= 2;
                setBallSpeed(ballArray.findIndex(ball), currentBallSpeed);
            } else if (leftPaddle.movingDown) {
                ball.dy += 2;
                setBallSpeed(ballArray.findIndex(ball), currentBallSpeed);
            }
            if (ball.killMode) {
                addPoint(2);
                ball.killMode = false;
                resetRound();
            }
            if (leftPaddle.sticky === 1) {
                ball.dy = 0;
                ball.dx = 0;
                leftPaddle.sticky = 2;
            }
            ball.dx = -ball.dx;
            increaseBallSpeed(0.1);
        }
    })
}

const handleRightPaddleHit = () => {
    ballArray.forEach((ball) => {
        if (ball.x >= rightPaddle.x - ballSize && ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + rightPaddle.height) {
            playSound(hitSound);
            setBallLocationAfterPaddleHit(ballArray.findIndex(ball));
            lastHit = 2;
            const currentBallSpeed = getBallSpeed(ballArray.findIndex(ball));
            if (rightPaddle.movingUp) {
                ball.dy -= 2;
                setBallSpeed(ballArray.findIndex(ball), currentBallSpeed);
            } else if (rightPaddle.movingDown) {
                ball.dy += 2;
                setBallSpeed(ballArray.findIndex(ball), currentBallSpeed);
            }
            ball.dx = -ball.dx;
            increaseBallSpeed(0.1);
            if (ball.killMode) {
                addPoint(1);
                ball.killMode = false;
                resetRound();
            }
            if (rightPaddle.sticky === 1) {
                ball.dy = 0;
                ball.dx = 0;
                rightPaddle.sticky = 2;
            }
        }
    })
}

const handleGoal = () => {
    ballArray.forEach((ball) => {
        if (ball.x <= 0 || ball.x >= canvas.width) {
            if (ball.killMode) {
                ball.killMode = false;
                playSound(startGameSound)
            } else {
                addPoint(getRoundWinner());
                removeBall(ballArray.findIndex(ball));
            }
            if (isWinner()) {
                setTimeout(() => {
                    playSound(niceShootinTexSound);
                }, 600)
                clearCanvas();
                playing = 0;
                resetRound();
                resetScore();
            } else {
                resetRound();
            }
        }
    })
}

const removeBall = (ballIndex) => {
    ballArray.splice(ballIndex, 1);
}

const resetRound = () => {
    if (ballArray.length = 1) {
        if (powerUps.isBarrierActive) {
            powerUps.reduceBarrierStrength();
            if (powerUps.barrierPlayer === 1) {
                ballArray[0].x = powerUps.barrierX - 1;
                ballArray[0].dx = (RNG(1, 20) * canvas.width / 400) * -1;
            } else if (powerUps.barrierPlayer === 2) {
                ballArray[0].x = powerUps.barrierX + powerUps.getBarrierWidth(powerUps.barrierStrength) + 1;
                ballArray[0].dx = RNG(1, 20) * canvas.width / 400;
            } else {
                ballArray[0].x = canvas.width / 2;
                ballArray[0].y = canvas.height / 2;
                ballArray[0].dx = RNGPositiveOrNegative(RNG(1, 20)) * canvas.width / 400;
                ballArray[0].dy = RNGPositiveOrNegative(RNG(1, 20)) * canvas.height / 400;
            }
        } else {
            ballArray[0].x = canvas.width / 2;
            ballArray[0].y = canvas.height / 2;
            ballArray[0].dx = RNGPositiveOrNegative(RNG(1, 20)) * canvas.width / 400;
            ballArray[0].dy = RNGPositiveOrNegative(RNG(1, 20)) * canvas.height / 400;
        }
        setBallSpeed(0, RNG(10, 18));
        resetStickyPaddles();
    }
}

const isWinner = () => {
    return player1Score === 10 || player2Score === 10;
}

const getWinner = () => {
    return player1Score === 10 ? 1 : 2;
}

const resetStickyPaddles = () => {
    leftPaddle.sticky = 0;
    rightPaddle.sticky = 0;
}

// this is to ensure there are no double hits
const setBallLocationAfterPaddleHit = (ballIndex) => {
    if (ballArray[ballIndex].x > canvas.width / 2) {
        ballArray[ballIndex].x = canvas.width - defaultPaddleWidth - 52 - ballSize;
    } else {
        ballArray[ballIndex].x = defaultPaddleWidth + 32 + ballSize;
    }
}

const addPoint = (player) => {
    if (player === 1) {
        player1Score++;
    } else {
        player2Score++;
    }
    playSound(roundOverSound)
    updateScore();
}

const updateScore = () => {
    score.innerText = `${player1Score} | ${player2Score}\n|\n|\n|\n|\n|\n|\n|\n|\n|`
}

const resetScore = () => {
    player1Score = 0;
    player2Score = 0;
}

const getRoundWinner = () => {
    return ball.x > canvas.width / 2 ? 1 : 2;
}

const update = () => {
    movePaddle(leftPaddle);
    movePaddle(rightPaddle);
    moveBall();
}

const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRect(leftPaddle.x, leftPaddle.y, defaultPaddleWidth, leftPaddle.height);
    drawRect(rightPaddle.x, rightPaddle.y, defaultPaddleWidth, rightPaddle.height);

    for (const i of ballArray) {
        drawBall(i);
    }

    if (powerUps.isBarrierActive) {
        drawRect(powerUps.barrierX, 0, powerUps.getBarrierWidth(powerUps.barrierStrength),
                 canvas.height);
    }
}

const tryToAddPowerUp = () => {
    if (canAddPowerUp && shouldSpawnPowerUp()) {
        const powerUp = getRandomPowerUp();
        addPowerUpToField(powerUp, calculatePowerUpLocation());
    }
    if (canAddPowerUp) {
        canAddPowerUp = false;
        setTimeout(() => {
            canAddPowerUp = true;
        }, powerUpInterval)
    }
}

const addPowerUpToField = (powerUp, location) => {
    const newPowerUp = document.createElement('img');
    newPowerUp.style.zIndex = 1;
    newPowerUp.style.width = `${canvas.width / 39}px`;
    newPowerUp.style.height = `${canvas.width / 39}px`;
    newPowerUp.style.position = "absolute";
    newPowerUp.style.top = `${location.y}px`;
    newPowerUp.style.left = `${location.x}px`;
    newPowerUp.style.border = "1px solid white";
    newPowerUp.className = "powerUp";
    switch (powerUp) {
        case "increaseBallSpeed":
            newPowerUp.src = "../static/increaseBallSpeed.jpg";
            newPowerUp.id = "increaseBallSpeed";
            break;
        case "decreaseBallSpeed":
            newPowerUp.src = "../static/decreaseBallSpeed.jpg";
            newPowerUp.id = "decreaseBallSpeed";
            break;
        case "increasePaddleSize":
            newPowerUp.src = "../static/increasePaddleSize.jpg";
            newPowerUp.id = "increasePaddleSize";
            break;
        case "decreasePaddleSize":
            newPowerUp.src = "../static/decreasePaddleSize.jpg";
            newPowerUp.id = "decreasePaddleSize";
            break;
        case "gasStation":
            newPowerUp.src = "../static/gas_station.jpg";
            newPowerUp.id = "gasStation";
            break;
        case "sidewaysGasStation":
            newPowerUp.src = "../static/gas_station.jpg";
            newPowerUp.style.rotate = "90deg";
            newPowerUp.id = "sidewaysGasStation";
            break;
        case "skullOnTheField":
            newPowerUp.src = "../static/SkullOnTheField2.jpg";
            newPowerUp.id = "skullOnTheField";
            playSound(skullSound);
            break;
        case "ballJump":
            newPowerUp.src = "../static/ballJump.jpg";
            newPowerUp.id = "ballJump";
            break;
        case "stickyPaddle":
            newPowerUp.src = "../static/stickyPaddle.jpg";
            newPowerUp.id = "stickyPaddle";
            break;
        case "middleBarrier":
            newPowerUp.src = "../static/middleBarrier.jpg";
            newPowerUp.id = "middleBarrier";
            break;
        case "ballMultiply":
            newPowerUp.src = "../static/ballMultiply.jpg";
            newPowerUp.id = "ballMultiply";
            break;
    }
    document.body.appendChild(newPowerUp);
}

const getPowerUpCollision = () => {
    const powerUpList = document.getElementsByTagName('img');
    ballArray.forEach(ball => {
        for (const powerUp of powerUpList) {
            const powerUpLeft = powerUp.x;
            const powerUpRight = powerUp.x + 60;
            const powerUpTop = powerUp.y;
            const powerUpBottom = powerUp.y + 60;
            const ballLeft = ball.x - ballSize;
            const ballRight = ball.x + ballSize;
            const ballTop = ball.y - ballSize;
            const ballBottom = ball.y + ballSize;
            if (ballTop < powerUpBottom && ballBottom > powerUpTop && ballLeft < powerUpRight && ballRight > powerUpLeft) {
                return powerUp;
            }
        }
    })
    return false;
}

const handlePowerUpCollision = () => {
    const powerUp = getPowerUpCollision();
    if (powerUp) {
        enablePowerUp(powerUp.id);
        powerUp.remove();
    }
}

const shouldSpawnPowerUp = () => {
    return (Math.floor(RNG(1, 101)) <= powerUpRate)
}

const enablePowerUp = (powerUp) => {
    switch (powerUp) {
        case "increaseBallSpeed":
            powerUps.increaseBallSpeed(ball);
            playSound(speedUpSound)
            break;
        case "decreaseBallSpeed":
            powerUps.decreaseBallSpeed(ball);
            playSound(powerUpSound);
            break;
        case "increasePaddleSize":
            if (lastHit === 1) {
                powerUps.increasePaddleSize(leftPaddle, paddleSizeIncrease);
            } else {
                powerUps.increasePaddleSize(rightPaddle, paddleSizeIncrease);
            }
            playSound(powerUpSound);
            break;
        case "decreasePaddleSize":
            if (lastHit === 1) {
                powerUps.decreasePaddleSize(leftPaddle, paddleSizeDecrease);
            } else {
                powerUps.decreasePaddleSize(rightPaddle, paddleSizeDecrease);
            }
            playSound(powerUpSound);
            break;
        case "skullOnTheField":
            powerUps.skullOnTheField(ball);
            playSound(skullActivateSound)
            break;
        case "gasStation":
            powerUps.gasStation(ball);
            playSound(hitSound);
            break;
        case "sidewaysGasStation":
            powerUps.sidewaysGasStation(ball);
            playSound(hitSound);
            break;
        case "stickyPaddle":
            if (lastHit === 1) {
                powerUps.stickyPaddle(leftPaddle);
            } else {
                powerUps.stickyPaddle(rightPaddle);
            }
            playSound(powerUpSound);
            break;
        case "ballJump":
            powerUps.ballJump(ball);
            playSound(startGameSound);
            break;
        case "middleBarrier":
            powerUps.middleBarrier();
            playSound(powerUpSound);
            break;
        case "ballMultiply":
            powerUps.ballMultiply();
            playSound(powerUpSound);
            break;
    }
}

const gameLoop = () => {
    if (playing) {
        tryToAddPowerUp();
        handlePowerUpCollision();
        update();
        draw();
        //getGamepadButtons();  // for debug purposes
        handleGamepadButtons();
        setTimeout(() => {
            requestAnimationFrame(gameLoop);
        }, fpsCap)
    }
}


document.addEventListener("keyup", (e) => {
    if (e.key === "w" || e.key === "s") {
        leftPaddle.dy = 0;
        leftPaddle.movingUp = false;
        leftPaddle.movingDown = false;
        if (leftPaddle.sticky === 2) {
            ball.dy = 0;
        }
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        rightPaddle.dy = 0;
        rightPaddle.movingUp = false;
        rightPaddle.movingDown = false;
        if (rightPaddle.sticky === 2) {
            ball.dy = 0;
        }
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "w") {
        leftPaddleUp();
    }
    if (e.key === "s") {
        leftPaddleDown();
    }
    if (e.key === "d") {
        leftPaddleActionButton();
    }
    if (e.key === "ArrowUp") {
        rightPaddleUp();
    }
    if (e.key === "ArrowDown") {
        rightPaddleDown();
    }
    if (e.key === "ArrowLeft") {
        rightPaddleActionButton();
    }
    //if (e.key === "x") {    // debug key
        //enablePowerUp("middleBarrier");
    //}
});

const leftPaddleUp = () => {
    leftPaddle.dy = -paddleSpeed;
    leftPaddle.movingUp = true;
    if (leftPaddle.sticky === 2) {
        ball.dy = leftPaddle.dy;
    }
} 

const leftPaddleDown = () => {
    leftPaddle.dy = paddleSpeed;
    leftPaddle.movingDown = true;
    if (leftPaddle.sticky === 2) {
        ball.dy = leftPaddle.dy;
    }
}

const leftPaddleActionButton = () => {
    if (leftPaddle.sticky === 2) {
        leftPaddle.sticky = 0;
        ball.dx = 60;
        ball.dy = RNGPositiveOrNegative(1); 
    }
}

const rightPaddleUp = () => {
    rightPaddle.dy = -paddleSpeed;
    rightPaddle.movingUp = true;
    if (rightPaddle.sticky === 2) {
        ball.dy = rightPaddle.dy;
    }
}

const rightPaddleDown = () => {
    rightPaddle.dy = paddleSpeed;
    rightPaddle.movingDown = true;
    if (rightPaddle.sticky === 2) {
        ball.dy = rightPaddle.dy;
    }
}

const rightPaddleActionButton = () => {
    if (rightPaddle.sticky === 2) {
        rightPaddle.sticky = 0;
        ball.dx = -60;
        ball.dy = RNGPositiveOrNegative(1); 
    }
}

const removeElementsByClassName = (className) => {
    const elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}

const clearCanvas = () => {
    removeElementsByClassName("powerUp");
    title.style.display = "block";
    title.innerHTML = `Player ${getWinner()} wins!\nClick to start game`;
    //canvas.style.display = "none";
    const score = document.getElementById('score');
    score.style.display = "none";
}

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    rightPaddle.x = canvas.width - 50;
    leftPaddle.y = canvas.height / 2 - leftPaddle.height / 2;
    rightPaddle.y = canvas.height / 2 - leftPaddle.height / 2;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ballSize = canvas.height / 50;
    leftPaddle.size = canvas.height / 5;
    rightPaddle.size = canvas.height / 5;
});

title.addEventListener('click', () => {
    const score = document.getElementById('score');
    title.style.display = "none";
    score.style.display = "block";
    playSound(titleSound);
    setBallSpeed(0, 7);
    updateScore();
    playing = 1;
    gameLoop();
});

window.addEventListener('gamepadconnected', (event) => {
    const gamepad = event.gamepad;
    console.log(`Gamepad connected: ${gamepad.id}`);
});

// for debug purposes
//const getGamepadButtons = () => {
    //const gamepads = navigator.getGamepads();
    //if (!gamepads) {
        //return;
    //}
    //for (const gamepad of gamepads) {
        //if (gamepad) {
            //gamepad.buttons.forEach((button, index) => {
                //if (button.pressed) {
                    //console.log(`Gamepad ${gamepad.index} Button ${index} pressed`);
                //}
            //})
        //}
    //}
//}

const handleGamepadButtons = () => {
    const gamepads = navigator.getGamepads();
    let gamepadCount = 0;
    for (const gamepad of gamepads) {
        if (gamepad) {
            gamepadCount++;
        }
    }
    if (!gamepadCount) {
        return;
    }

    const gamepad1 = gamepads[0];
    if (gamepad1.buttons[12].pressed) {   // ps5 controller directional up
        leftPaddleUp();
    }
    // stop all movement
    if (!gamepad1.buttons[12].pressed && !gamepad1.buttons[13].pressed) {
        if (leftPaddle.dy !== 0) {
            leftPaddle.dy = 0;
            leftPaddle.movingUp = false;
            leftPaddle.movingDown = false;
            if (leftPaddle.sticky === 2) {
                ball.dy = 0;
            }
        }
    }
    if (gamepad1.buttons[13].pressed) {   // ps5 controller directional down 
        leftPaddleDown();
    }
    if (gamepad1.buttons[0].pressed) {   // ps5 controller x button 
        leftPaddleActionButton();
    }

    if (gamepadCount > 1) {
        const gamepad2 = gamepads[1];
        if (gamepad2.buttons[12].pressed) {   // ps5 controller directional up
            rightPaddleUp();
        }
        if (!gamepad2.buttons[12].pressed && !gamepad2.buttons[13].pressed) {
            if (rightPaddle.dy !== 0) {
                rightPaddle.dy = 0;
                rightPaddle.movingUp = false;
                rightPaddle.movingDown = false;
                if (rightPaddle.sticky === 2) {
                    ball.dy = 0;
                }
            }
        }
        if (gamepad2.buttons[13].pressed) {   // ps5 controller directional down 
            rightPaddleDown();
        }
        if (gamepad2.buttons[0].pressed) {   // ps5 controller x button 
            rightPaddleActionButton();
        }
    }
}
