import { ballArray, lastHit, createNewBall, setBallSpeed } from "./pong.js";

const canvas = document.getElementById("pongCanvas");
export let isBarrierActive = false;
export let barrierX = 0;
export let barrierPlayer = 0;  // 1 or 2 for player 1 or 2 (player that is blocked)
export let barrierStrength = 3;

export const increaseBallSpeed = (ballObject) => {
    ballObject.dx = ballObject.dx * 1.3;
    ballObject.dy = ballObject.dy * 1.3;
}

export const decreaseBallSpeed = (ballObject) => {
    ballObject.dx = ballObject.dx * 0.7;
    ballObject.dy = ballObject.dy * 0.7;
}

export const increasePaddleSize = (paddleObject, increaseAmount) => {
    paddleObject.height += increaseAmount;
    paddleObject.sizeIncreaseCount += 1;
    setTimeout(() => {
        paddleObject.height -= increaseAmount;
        paddleObject.sizeIncreaseCount -= 1;
        checkPaddleHeight(paddleObject);
    }, 8000)
}

export const decreasePaddleSize = (paddleObject, decreaseAmount) => {
    if (!paddleObject.sizeDecreased) {
        paddleObject.height -= decreaseAmount;
        paddleObject.sizeDecreased = true;
        setTimeout(() => {
            paddleObject.height += decreaseAmount;
            paddleObject.sizeDecreased = false;
            checkPaddleHeight(paddleObject);
        }, 8000)
    }
}

const checkPaddleHeight = (paddleObject) => {
    const defaultPaddleHeight = canvas.height / 5;

    if (!paddleObject.sizeDecreased && paddleObject.sizeIncreaseCount === 0) {
        paddleObject.height = defaultPaddleHeight;
        console.log("This happened");
    }
    if (paddleObject.height < 1) {
        paddleObject.height = 1;
    }
}

export const skullOnTheField = (ballObject) => {
    ballObject.killMode = true;
}

export const gasStation = (ball) => {
    ball.dx = ball.dx * -1;
}

export const sidewaysGasStation = (ball) => {
    ball.dy = ball.dy * -1;
}

export const stickyPaddle = (paddle) => {
    paddle.sticky = 1;
}

export const ballJump = (ball) => {
    const canvas = document.getElementById("pongCanvas");
    ball.x = RNG(canvas.width * 0.2, canvas.width * 0.8);
    ball.y = RNG(canvas.height * 0.2, canvas.height * 0.8);
}

export const middleBarrier = (ballObject) => {
    isBarrierActive = true;
    barrierStrength = 3;
    barrierX = ballObject.x;
    barrierX = lastHit === 1 ?
        ballObject.x - ballObject.size - 20 - 10 :
        ballObject.x + ballObject.size + 10;

    barrierPlayer = lastHit === 1 ? 2 : 1;
}

export const setBarrierStatus = (status) => {
    isBarrierActive = status;
}

export const reduceBarrierStrength = () => {
    barrierStrength -= 1;
    if (barrierStrength === 0) {
        isBarrierActive = false;
        barrierPlayer = 0;
    }
}

export const getBarrierWidth = (barrierStrength) => {
    switch (barrierStrength) {
        case 3:
            return 20;
        case 2:
            return 12;
        case 1:
            return 5;
    }
}

export const ballMultiply = (ballObject) => {
    while (ballArray.length < 5) {
        createNewBall(ballObject.x, ballObject.y);
        setBallSpeed(ballArray.length - 1, RNG(10, 18));
    }
}

const RNG = (min, max) => {
    return Math.random() * (max - min) + min;
}
