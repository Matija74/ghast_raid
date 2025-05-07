let gameStarted = false;
let countdown = 3;
let countdownInterval;
let gameTime = 60;
let gameTimer;
let invaderSpawnDelay = 3000;
let lastShotTime = 0;

const shotCooldown = 350;
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const backgroundImage = new Image();
backgroundImage.src = '../img/standard.jpg';

function drawBackground() {
    c.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

class Player {
    constructor() {
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0;

        const image = new Image();
        image.src = '../img/bow.png';
        image.onload = () => {
            const scale = 0.25;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;

            this.position = {
                x: canvas.width / 2 - this.width / 2,
                y: canvas.height - this.height - 20
            };
            this.imageLoaded = true;
        };
        this.imageLoaded = false;
    }

    draw() {
        if (this.imageLoaded) {
            c.save();
            c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
            c.rotate(this.rotation);
            c.translate(-this.position.x - this.width / 2, -this.position.y - this.height / 2);
            c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
            c.restore();
        }
    }

    update() {
        if (this.imageLoaded) {
            this.draw();
            this.position.x += this.velocity.x;
        }
    }
}

class Projectile {
    constructor({ position, velocity }) {
        this.position = position;
        this.velocity = velocity;
        const image = new Image();
        image.src = '../img/arrow.png';
        image.onload = () => {
            const scale = 0.1;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;
        };

        this.radius = 3;
    }

    draw() {
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Invader {
    constructor({ x, y }) {
        const speedX = (Math.random() * 1.5 + 0.5) * (Math.random() < 0.5 ? 1 : -1);
        const speedY = Math.random() * 0.7 + 0.3;
        this.velocity = { x: speedX, y: speedY };

        this.image = new Image();
        this.image.src = '../img/phantom.webp';
        this.loaded = false;

        this.image.onload = () => {
            const scale = 0.1;
            this.width = this.image.width * scale;
            this.height = this.image.height * scale;
            this.position = { x, y };
            this.loaded = true;
        };
    }

    draw() {
        if (this.loaded) {
            c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        }
    }

    update() {
        if (this.loaded) {
            this.draw();
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;

            if (this.position.x <= 0 || this.position.x + this.width >= canvas.width) {
                this.velocity.x *= -1;
            }
        }
    }
}

class Explosion {
    constructor(x, y) {
        this.frames = [];
        this.currentFrame = 0;
        this.frameDelay = 6;
        this.frameCount = 0;
        this.x = x;
        this.y = y;
        this.done = false;

        for (let i = 1; i <= 10; i++) {
            const img = new Image();
            img.src = `../img/animations/Explosion_gas_circle/Explosion_gas_circle${i}.png`;
            this.frames.push(img);
        }
    }

    draw() {
        if (this.done) return;

        const frame = this.frames[this.currentFrame];
        if (frame.complete) {
            c.drawImage(frame, this.x, this.y, 200, 200); // prilagodi velikost po potrebi
        }

        this.frameCount++;
        if (this.frameCount >= this.frameDelay) {
            this.frameCount = 0;
            this.currentFrame++;
            if (this.currentFrame >= this.frames.length) {
                this.done = true;
            }
        }
    }
}

const player = new Player();
const projectiles = [];
const invaders = [];
const explosions = [];
const keys = {
    a: { pressed: false },
    d: { pressed: false },
    space: { pressed: false }
};

// sound effects
function startBackgroundMusic() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    backgroundMusic.play();
    backgroundMusic.volume = 0.05;
}

function playShootSound() {
    const shootSound = document.getElementById('shootSound');
    shootSound.play();
    shootSound.volume = 0.3;
}

function playEnemyHitSound() {
    const hitSound = new Audio('../audio/ding.mp3');
    hitSound.volume = 0.3;
    hitSound.play();
}

function startCountdown() {
    startBackgroundMusic();
    const countdownElement = document.createElement('div');
    countdownElement.style.position = 'absolute';
    countdownElement.style.top = '50%';
    countdownElement.style.left = '50%';
    countdownElement.style.transform = 'translate(-50%, -50%)';
    countdownElement.style.fontSize = '48px';
    countdownElement.style.color = 'white';
    countdownElement.style.fontFamily = 'TitleFont', 'sans-serif';
    document.body.appendChild(countdownElement);

    countdownInterval = setInterval(() => {
        if (countdown > 0) {
            countdownElement.textContent = countdown;
            countdown--;
        } else {
            clearInterval(countdownInterval);
            gameStarted = true;
            countdownElement.textContent = 'Go!';
            setTimeout(() => {
                document.body.removeChild(countdownElement);
                startGameTimer();
                startSpawningInvaders();
            }, 1000);
        }
    }, 1000);
}

function startGameTimer() {
    gameTimer = setInterval(() => {
        if (gameTime > 0) {
            gameTime--;
        } else {
            clearInterval(gameTimer);
            gameStarted = false;
            showGameOverPopup();
        }
    }, 1000);
}

function showGameOverPopup() {
    Swal.fire({
        title: 'Game Over',
        text: `Score: ${score.toString().padStart(3, '0')}`,
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#fff',
        confirmButtonText: 'Back to Menu',
        confirmButtonColor: '#ff5555',
        allowEnterKey: false,
        allowOutsideClick: false,
        allowEscapeKey: true,
        customClass: {
            popup: 'textfont-swal'
        }
    }).then(() => {
        window.location.href = '../index.html';
    });
}

function spawnInvader() {
    if (gameStarted) {
        const ghastWidth = 100;
        const x = Math.random() * (canvas.width - ghastWidth);
        const y = -50;
        invaders.push(new Invader({ x, y }));
    }
}

function startSpawningInvaders() {
    function spawnLoop() {
        if (!gameStarted) return;

        const elapsed = 60 - gameTime;

        let delay;
        if (elapsed < 20) {
            delay = 1500;
        } else if (elapsed < 40 && elapsed >= 20) {
            delay = 1000;
        } else {
            delay = 750;
        }

        spawnInvader();
        setTimeout(spawnLoop, delay);
    }

    spawnLoop();
}

function drawScore() {
    c.fillStyle = 'black';
    c.background = 'white';
    c.font = '30px TextFont, sans-serif';

    c.fillText(`Score: ${score.toString().padStart(3, '0')}`, 20, 40);

    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    c.fillText(`Time: ${timeFormatted}`, canvas.width - 160, 40);
}

let score = 0;

function animate() {
    requestAnimationFrame(animate);

    if (!gameStarted) return;

    drawBackground();

    invaders.forEach((inv, index) => {
        inv.update();
        if (inv.position.y + inv.height >= canvas.height) {
            score -= 10;
            invaders.splice(index, 1);
        }
    });
    

    player.update();

    explosions.forEach((explosion, index) => {
        explosion.draw();
        if (explosion.done) {
            explosions.splice(index, 1);
        }
    });       

    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.height <= 0) {
            setTimeout(() => {
                projectiles.splice(index, 1);
                score -= 5;
            }, 0);
        } else {
            projectile.update();

            invaders.forEach((inv, invIndex) => {
                if (
                    projectile.position &&
                    inv.position &&
                    projectile.position.y <= inv.position.y + inv.height &&
                    projectile.position.y + projectile.height >= inv.position.y &&
                    projectile.position.x + projectile.width >= inv.position.x &&
                    projectile.position.x <= inv.position.x + inv.width
                ) {
                    playEnemyHitSound();
                    score += 10;
                    invaders.splice(invIndex, 1);
                    explosions.push(new Explosion(
                        inv.position.x + inv.width / 2 - 100,
                        inv.position.y + inv.height / 2 - 100
                    ));
                    projectiles.splice(index, 1);
                }
            });
        }
    });

    drawScore();

    if (keys.a.pressed && player.position.x >= 0) {
        player.velocity.x = -5;
        player.rotation = -0.15;
    } else if (keys.d.pressed && player.position.x + player.width <= canvas.width) {
        player.velocity.x = 5;
        player.rotation = 0.15;
    } else {
        player.velocity.x = 0;
        player.rotation = 0;
    }
}

animate();

addEventListener('keydown', ({ key }) => {
    switch (key) {
        case 'a':
            keys.a.pressed = true;
            break;
        case 'd':
            keys.d.pressed = true;
            break;
        case ' ':
            const now = Date.now();
            if (player.imageLoaded && gameStarted && now - lastShotTime >= shotCooldown) {
                projectiles.push(
                    new Projectile({
                        position: {
                            x: player.position.x + player.width / 2,
                            y: player.position.y
                        },
                        velocity: {
                            x: 0,
                            y: -5
                        }
                    })
                );
                lastShotTime = now;
                playShootSound();
            }
            break;
    }
});

addEventListener('keyup', ({ key }) => {
    switch (key) {
        case 'a':
            keys.a.pressed = false;
            break;
        case 'd':
            keys.d.pressed = false;
            break;
    }
});

startCountdown();