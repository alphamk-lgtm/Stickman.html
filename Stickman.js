
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const playerHealth = document.getElementById("playerHealth");
const enemyHealth = document.getElementById("enemyHealth");
const message = document.getElementById("message");

const FLOOR = 340;
const keys = {};

let player, enemy, gameOver, frame, particles;

function fighter(x, color, facing) {
  return {
    x, y: FLOOR,
    vx: 0, vy: 0,
    color, facing,
    health: 100,
    grounded: true,
    punching: 0,
    cooldown: 0,
    invincible: 0
  };
}

function resetGame() {
  player = fighter(180, "#00e5ff", 1);
  enemy = fighter(620, "#ff4057", -1);
  gameOver = false;
  frame = 0;
  particles = [];
  message.textContent = "FIGHT!";
  playerHealth.style.width = "100%";
  enemyHealth.style.width = "100%";
}

function jump(f) {
  if (!gameOver && f.grounded) {
    f.vy = -13;
    f.grounded = false;
  }
}

function punch(f, target) {
  if (gameOver || f.cooldown > 0) return;

  f.punching = 12;
  f.cooldown = 28;

  const distance = Math.abs(target.x - f.x);
  const direction = target.x >= f.x ? 1 : -1;

  f.facing = direction;

  if (distance < 100 &&
      target.invincible <= 0 &&
      target.health > 0) {
    target.health = Math.max(0, target.health - 10);
    target.invincible = 12;
    target.vx = direction * 7;

    for (let i = 0; i < 7; i++) {
      particles.push({
        x: target.x,
        y: target.y - 55,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        life: 15
      });
    }
  }
}

function drawFighter(f) {
  const x = f.x;
  const y = f.y;
  const dir = f.facing;
  const punching = f.punching > 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  ctx.strokeStyle = f.invincible > 0
    ? "#ffffff" : f.color;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Head
  ctx.beginPath();
  ctx.arc(0, -88, 15, 0, Math.PI * 2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(0, -72);
  ctx.lineTo(0, -38);
  ctx.stroke();

  // Back arm
  ctx.beginPath();
  ctx.moveTo(0, -65);
  ctx.lineTo(-18, -48);
  ctx.lineTo(-24, -35);
  ctx.stroke();

  // Punching arm
  ctx.beginPath();
  ctx.moveTo(0, -65);

  if (punching) {
    ctx.lineTo(25, -61);
    ctx.lineTo(48, -61);
  } else {
    ctx.lineTo(17, -49);
    ctx.lineTo(23, -37);
  }

  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(0, -38);
  ctx.lineTo(-15, -18);
  ctx.lineTo(-19, 0);

  ctx.moveTo(0, -38);
  ctx.lineTo(15, -18);
  ctx.lineTo(19, 0);
  ctx.stroke();

  // Fist
  if (punching) {
    ctx.fillStyle = "#ffe600";
    ctx.beginPath();
    ctx.arc(49, -61, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawArena() {
  const sky = ctx.createLinearGradient(
    0, 0, 0, canvas.height
  );

  sky.addColorStop(0, "#111b3c");
  sky.addColorStop(1, "#304d79");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 800, 400);

  // Stars
  ctx.fillStyle = "#ffffff";

  for (let i = 0; i < 35; i++) {
    const x = (i * 97) % 800;
    const y = 35 + (i * 43) % 200;
    ctx.fillRect(x, y, 2, 2);
  }

  // Floor
  ctx.fillStyle = "#182334";
  ctx.fillRect(0, FLOOR, 800, 60);

  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR);
  ctx.lineTo(800, FLOOR);
  ctx.stroke();

  // Floor markings
  ctx.strokeStyle = "#304a65";
  ctx.lineWidth = 1;

  for (let x = 0; x < 800; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, FLOOR);
    ctx.lineTo(x - 20, 400);
    ctx.stroke();
  }
}

function update() {
  if (gameOver) return;

  frame++;

  // Player controls
  player.vx = 0;

  if (keys.left) player.vx = -4;
  if (keys.right) player.vx = 4;

  if (player.vx !== 0) {
    player.facing = player.vx > 0 ? 1 : -1;
  }

  // Simple enemy AI
  const distance = enemy.x - player.x;
  enemy.facing = distance > 0 ? -1 : 1;
  enemy.vx = 0;

  if (Math.abs(distance) > 65) {
    enemy.vx = distance > 0 ? -2 : 2;
  } else if (enemy.cooldown <= 0) {
    punch(enemy, player);
  }

  for (const f of [player, enemy]) {
    f.x += f.vx;
    f.y += f.vy;
    f.vy += 0.6;

    if (f.y >= FLOOR) {
      f.y = FLOOR;
      f.vy = 0;
      f.grounded = true;
    }

    f.x = Math.max(25, Math.min(775, f.x));

    if (f.punching > 0) f.punching--;
    if (f.cooldown > 0) f.cooldown--;
    if (f.invincible > 0) f.invincible--;
  }

  // Keep the fighters from overlapping
  if (Math.abs(player.x - enemy.x) < 35) {
    const direction = player.x < enemy.x ? -1 : 1;
    player.x += direction * 1.5;
    enemy.x -= direction * 1.5;
  }

  particles = particles.filter(p => p.life > 0);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }

  playerHealth.style.width = player.health + "%";
  enemyHealth.style.width = enemy.health + "%";

  if (enemy.health <= 0) {
    gameOver = true;
    message.textContent = "YOU WIN! 🏆";
  } else if (player.health <= 0) {
    gameOver = true;
    message.textContent = "YOU LOSE!";
  }
}

function draw() {
  drawArena();

  drawFighter(player);
  drawFighter(enemy);

  // Hit sparks
  for (const p of particles) {
    ctx.fillStyle = "#ffe600";
    ctx.fillRect(p.x, p.y, 5, 5);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Keyboard controls
document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  if (["arrowleft", "arrowright", "arrowup", " "]
      .includes(key)) {
    e.preventDefault();
  }

  if (key === "arrowleft" || key === "a")
    keys.left = true;

  if (key === "arrowright" || key === "d")
    keys.right = true;

  if ((key === "arrowup" || key === "w") &&
      !e.repeat) jump(player);

  if (key === " " && !e.repeat)
    punch(player, enemy);
});

document.addEventListener("keyup", e => {
  const key = e.key.toLowerCase();

  if (key === "arrowleft" || key === "a")
    keys.left = false;

  if (key === "arrowright" || key === "d")
    keys.right = false;
});

// Mobile buttons: hold to move, tap to jump or punch
function holdButton(id, key) {
  const button = document.getElementById(id);

  button.addEventListener("pointerdown", e => {
    e.preventDefault();
    keys[key] = true;
  });

  for (const event of ["pointerup",
                       "pointercancel",
                       "lostpointercapture"]) {
    button.addEventListener(event, () => {
      keys[key] = false;
    });
  }

  button.addEventListener("pointerleave", () => {
    keys[key] = false;
  });
}

holdButton("left", "left");
holdButton("right", "right");

document.getElementById("jump").addEventListener(
  "pointerdown", e => {
    e.preventDefault();
    jump(player);
  }
);

document.getElementById("attack").addEventListener(
  "pointerdown", e => {
    e.preventDefault();
    punch(player, enemy);
  }
);

document.getElementById("restart").addEventListener(
  "click", resetGame
);

resetGame();
loop();
