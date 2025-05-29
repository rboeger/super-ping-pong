export const increaseBallSpeed = (ballObject) => {
    ballObject.dx = ballObject.dx * 1.3;
    ballObject.dy = ballObject.dy * 1.3;
}

export const decreaseBallSpeed = (ballObject) => {
    ballObject.dx = ballObject.dx * 0.7;
    ballObject.dy = ballObject.dy * 0.7;
}

export const increasePaddleSize = (paddleObject) => {
    const paddleSizeIncrease = paddleObject.height * 1.25
    paddleObject.height += paddleSizeIncrease;
    paddleObject.sizeIncreaseCount += 1;
    setTimeout(() => {
        paddleObject.height -= paddleSizeIncrease;
        paddleObject.sizeIncreaseCount -= 1;
        checkPaddleHeight(paddleObject);
    }, 8000)
}

export const decreasePaddleSize = (paddleObject) => {
    if (!paddleObject.sizeDecreased) {
        const paddleSizeDecrease = paddleObject.height * 0.75;
        paddleObject.height -= paddleSizeDecrease;
        paddleObject.sizeDecreased = true;
        setTimeout(() => {
            paddleObject.height += paddleSizeDecrease;
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

const RNG = (min, max) => {
    return Math.random() * (max - min) + min;
}
