let score = 0;

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const backgroundImage = new Image();
backgroundImage.src = './img/nether.png';

function drawBackground() {
    c.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

class Player {
    constructor() {
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0;

        const image = new Image();
        image.src = './img/bow.png';
        image.onload = () => {
            const scale = 0.25;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;

            this.position = {
                x: canvas.width / 2 - this.width / 2,
                y: canvas.height - this.height - 20
            };
            this.imageLoaded = true; // Track if image is loaded
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
        image.src = './img/arrow.png';
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
        this.velocity = { x: Math.random() < 0.5 ? 1 : -1, y: 0.3 };

        this.image = new Image();
        this.image.src = './img/ghast.png';
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

const player = new Player();
const projectiles = [];
const invaders = [];
const keys = {
    a: { pressed: false },
    d: { pressed: false },
    space: { pressed: false }
};

function spawnInvader() {
    const x = Math.random() * (canvas.width - 50);
    const y = -50;
    invaders.push(new Invader({ x, y }));
}

function startSpawningInvaders() {
    const randomDelay = Math.random() * (3000 - 1000) + 1000;
    setTimeout(() => {
        spawnInvader();
        startSpawningInvaders();
    }, randomDelay);
}

startSpawningInvaders();

function drawScore() {
    c.fillStyle = 'white';
    c.font = '30px Arial';
    c.fillText(`Score: ${score.toString().padStart(3, '0')}`, 20, 40);
}

function animate() {
    requestAnimationFrame(animate);

    drawBackground();

    invaders.forEach((invader, index) => {
        if (invader.position.y - invader.height >= canvas.height) {
            setTimeout(() => {
                invaders.splice(index, 1);
            }, 0);
        } else {
            invader.update();
        }
    });

    player.update();

    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.height <= 0) {
            setTimeout(() => {
                projectiles.splice(index, 1);
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
                    score += 1;
                    setTimeout(() => {
                        invaders.splice(invIndex, 1);
                        projectiles.splice(index, 1);
                    }, 0);
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
            if (player.imageLoaded) {
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