let gameStarted = false;
let countdown = 3;
let countdownInterval;
let score = 0;
let currentWave = 0;
let waitingForNextWave = false;
let playerLives = 5;
let playerSpeed = 5;
let shootCooldown = 350;
let lastShotTime = 0;


const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;

const backgroundImage = new Image();
backgroundImage.src = '../img/wave.png';
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
        this.image.src = '../img/ghast.png';
        this.loaded = false;

        this.image.onload = () => {
            const scale = 0.25;
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
        this.frameDelay = 4;
        this.frameCount = 0;
        this.x = x;
        this.y = y;
        this.done = false;

        for (let i = 1; i <= 10; i++) {
            const img = new Image();
            img.src = `../img/animations/Circle_explosion/Circle_explosion${i}.png`;
            this.frames.push(img);
        }
    }

    draw() {
        if (this.done) return;

        const frame = this.frames[this.currentFrame];
        if (frame.complete) {
            c.drawImage(frame, this.x, this.y, 200, 200);
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

function playGhastHitSound() {
    const hitSound = new Audio('../audio/boom.mp3');
    hitSound.volume = 0.3;
    hitSound.play();
}

function showGameOverPopup() {
    Swal.fire({
        title: 'Game Over',
        text: `You survived ${currentWave} wave(s)`,
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#fff',
        confirmButtonText: 'Back to Menu',
        confirmButtonColor: '#ff5555',
        allowEnterKey: false,
        allowOutsideClick: false,
        allowEscapeKey: true,
        customClass: { popup: 'textfont-swal' }
    }).then(() => {
        window.location.href = '../index.html';
    });
}

function showWavePopup(waveNumber) {
    const popup = document.createElement('div');
    popup.textContent = `Wave ${waveNumber}`;
    popup.style.position = 'absolute';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.fontSize = '48px';
    popup.style.color = 'white';
    popup.style.fontFamily = 'TitleFont', 'sans-serif';
    popup.style.zIndex = '999';
    document.body.appendChild(popup);

    setTimeout(() => {
        document.body.removeChild(popup);
    }, 2000);
}

let waveConfigs = [
    { count: 5, speed: 1.0 }
];

function startWave() {
    if (!gameStarted) return;

    currentWave++;

    const waveSpeed = 0.3 + (currentWave * 0.1);
    const waveCount = 5 + currentWave * 2;

    waveConfigs.push({ count: waveCount, speed: waveSpeed });

    showWavePopup(currentWave);

    setTimeout(() => {
        const wave = waveConfigs[currentWave - 1];
        if (!wave) return;

        let spawned = 0;
        const spawnInterval = setInterval(() => {
            if (!gameStarted) return clearInterval(spawnInterval);
            if (spawned >= wave.count) {
                clearInterval(spawnInterval);
                waitingForNextWave = true;
                return;
            }

            const ghastWidth = 100;
            const x = Math.random() * (canvas.width - ghastWidth);
            const y = -50;
            const inv = new Invader({ x, y });

            inv.velocity.y = wave.speed;

            inv.velocity.x = Math.random() * 2 - 1;

            invaders.push(inv);
            spawned++;
        }, 500);

        if (currentWave % 5 === 0) {
            playerSpeed += 2;
            console.log(`Hitrost igralca po ${currentWave}. valu: ${playerSpeed}`);
            if (shootCooldown >= 50) {
                shootCooldown -= 125;
                console.log(`Cooldown med streli po ${currentWave}. valu: ${shootCooldown}ms`);
            }
        }
    }, 3000);
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!gameStarted) return;

    drawBackground();
    player.update();

    explosions.forEach((explosion, index) => {
        explosion.draw();
        if (explosion.done) explosions.splice(index, 1);
    });

    invaders.forEach((inv, index) => {
        inv.update();
        if (inv.position.y + inv.height >= canvas.height) {
            playerLives--;
            invaders.splice(index, 1);
            if (playerLives <= 0) {
                gameStarted = false;
                showGameOverPopup();
            }
        }
    });

    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.height <= 0) {
            setTimeout(() => projectiles.splice(index, 1), 0);
        } else {
            projectile.update();
            invaders.forEach((inv, invIndex) => {
                if (projectile.position && inv.position &&
                    projectile.position.y <= inv.position.y + inv.height &&
                    projectile.position.y + projectile.height >= inv.position.y &&
                    projectile.position.x + projectile.width >= inv.position.x &&
                    projectile.position.x <= inv.position.x + inv.width) {
                    playGhastHitSound();
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

    drawScoreAndLives();

    if (waitingForNextWave && invaders.length === 0) {
        waitingForNextWave = false;
        startWave();
    }

    if (keys.a.pressed && player.position.x >= 0) {
        player.velocity.x = -playerSpeed;
        player.rotation = -0.15;
    } else if (keys.d.pressed && player.position.x + player.width <= canvas.width) {
        player.velocity.x = playerSpeed;
        player.rotation = 0.15;
    } else {
        player.velocity.x = 0;
        player.rotation = 0;
    }

    if (keys.space.pressed && (Date.now() - lastShotTime >= shootCooldown)) {
        shootProjectile();
        lastShotTime = Date.now();
    }
}

function shootProjectile() {
    const projectile = new Projectile({
        x: player.position.x + player.width / 2,
        y: player.position.y,
        velocity: {
            x: 0,
            y: -10
        }
    });

    projectiles.push(projectile);
    playShootSound();
}

function drawScoreAndLives() {
    c.fillStyle = 'white';
    c.font = '30px TextFont, sans-serif';
    c.fillText(`Wave: ${currentWave}`, 20, 40);
    c.fillText(`Lives: ${playerLives}`, canvas.width - 160, 40);
}

let lastTime = 0;
const speedFactor = 200;

function animate(timestamp) {
    requestAnimationFrame(animate);
    if (!gameStarted) return;

    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    drawBackground();
    player.update();

    explosions.forEach((explosion, index) => {
        explosion.draw();
        if (explosion.done) explosions.splice(index, 1);
    });

    invaders.forEach((inv, index) => {
        inv.update(deltaTime);
        if (inv.position.y + inv.height >= canvas.height) {
            playerLives--;
            invaders.splice(index, 1);
            if (playerLives <= 0) {
                gameStarted = false;
                showGameOverPopup();
            }
        }
    });

    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.height <= 0) {
            setTimeout(() => projectiles.splice(index, 1), 0);
        } else {
            projectile.update(deltaTime);
            invaders.forEach((inv, invIndex) => {
                if (projectile.position && inv.position &&
                    projectile.position.y <= inv.position.y + inv.height &&
                    projectile.position.y + projectile.height >= inv.position.y &&
                    projectile.position.x + projectile.width >= inv.position.x &&
                    projectile.position.x <= inv.position.x + inv.width) {
                    playGhastHitSound();
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

    drawScoreAndLives();

    if (waitingForNextWave && invaders.length === 0) {
        waitingForNextWave = false;
        startWave();
    }

    if (keys.a.pressed && player.position.x >= 0) {
        player.velocity.x = -5 * speedFactor * deltaTime;
        player.rotation = -0.15;
    } else if (keys.d.pressed && player.position.x + player.width <= canvas.width) {
        player.velocity.x = 5 * speedFactor * deltaTime;
        player.rotation = 0.15;
    } else {
        player.velocity.x = 0;
        player.rotation = 0;
    }
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
                startWave();
            }, 1000);
        }
    }, 1000);
}

animate();

addEventListener('keydown', ({ key }) => {
    switch (key) {
        case 'a': keys.a.pressed = true; break;
        case 'd': keys.d.pressed = true; break;
        case ' ':
            const now = Date.now();
            if (player.imageLoaded && gameStarted && now - lastShotTime >= shootCooldown) {
                projectiles.push(
                    new Projectile({
                        position: {
                            x: player.position.x + player.width / 2,
                            y: player.position.y
                        },
                        velocity: { x: 0, y: -5 }
                    })
                );
                lastShotTime = now;
                playShootSound();
            }
            break;
    }
});

addEventListener('keyup', ({ key }) => {
    if (key === 'a') keys.a.pressed = false;
    if (key === 'd') keys.d.pressed = false;
});

startCountdown();