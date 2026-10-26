
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const playerBar = document.getElementById("playerHealth");
const enemyBar = document.getElementById("enemyHealth");
const comboText = document.getElementById("combo");
const message = document.getElementById("message");
const result = document.getElementById("result");

const keys = {};
let player, enemy, particles, combo, lastHit, gameOver;
let lastTime = 0;
let gameTime = 0;

function fighter(x, color, facing) {
  return {
    x, y: 310, vy: 0,
    color, facing,
    hp: 100,
    attack: 0,
    cooldown: 0,
    special: 0,
    onGround: true
  };
}

function resetGame() {
  player = fighter(180, "#00e5ff", 1);
  enemy = fighter(620, "#ff4058", -1);
  particles = [];
  combo = 0;
  lastHit = 0;
  gameOver = false;
  gameTime = 0;
  message.classList.add("hidden");
  updateHUD();
}

function updateHUD() {
  playerBar.style.width = player.hp + "%";
  enemyBar.style.width = enemy.hp + "%";
  comboText.textContent = combo;
}

function burst(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 25,
      color
    });
  }
}

function attack(f, target, special = false) {
  if (gameOver || f.cooldown > 0) return;

  f.attack = special ? 24 : 12;
  f.cooldown = special ? 70 : 28;

  if (special) f.special = Math.max(0, f.special - 40);

  const distance = Math.abs(f.x - target.x);
  const facingTarget = (target.x - f.x) * f.facing > 0;

  if (distance < (special ? 115 : 85) && facingTarget) {
    const damage = special ? 22 : 10;
    target.hp = Math.max(0, target.hp - damage);
    target.x += f.facing * (special ? 35 : 18);
    target.x = Math.max(35, Math.min(765, target.x));

    burst(target.x, 255, special ? "#ffdb4d" : "#ffffff");

    if (f === player) {
      if (performance.now() - lastHit < 1200) {
        combo++;
      } else {
        combo = 1;
      }
      lastHit = performance.now();
      f.special = Math.min(100, f.special + 20);
    }

    if (target.hp <= 0) endGame(f === player);
    updateHUD();
  }
}

function endGame(won) {
  gameOver = true;
  result.textContent = won ? "YOU WIN!" : "YOU LOSE!";
  message.classList.remove("hidden");
}

function drawFighter(f) {
  const x = f.x;
  const y = f.y;
  const dir = f.facing;
  const attacking = f.attack > 0;

  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.strokeStyle = f.color;
  ctx.fillStyle = f.color;

  // Head
  ctx.beginPath();
  ctx.arc(x, y - 75, 15, 0, Math.PI * 2);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(x, y - 60);
  ctx.lineTo(x, y - 20);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(x, y - 52);
  ctx.lineTo(x - dir * 20, y - 35);

  if (attacking) {
    ctx.lineTo(x + dir * 55, y - 48);
  } else {
    ctx.lineTo(x + dir * 20, y - 32);
  }
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x - 17, y);
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x + 17, y);
  ctx.stroke();

  // Special attack indicator
  if (f === player) {
    ctx.fillStyle = "#ffdb4d";
    ctx.font = "12px Arial";
    ctx.fillText("SPECIAL " + f.special + "%", x - 35, y + 25);
  }
}

function update(dt) {
  if (gameOver) return;

  gameTime += dt;
  const step = dt / 16.67;

  player.cooldown = Math.max(0, player.cooldown - step);
  enemy.cooldown = Math.max(0, enemy.cooldown - step);
  player.attack = Math.max(0, player.attack - step);
  enemy.attack = Math.max(0, enemy.attack - step);

  if (keys.a) player.x -= 4 * step;
  if (keys.d) player.x += 4 * step;

  player.x = Math.max(30, Math.min(770, player.x));

  if (keys.w && player.onGround) {
    player.vy = -12;
    player.onGround = false;
  }

  // Gravity
  for (const f of [player, enemy]) {
    f.y += f.vy * step;
    f.vy += 0.6 * step;

    if (f.y >= 310) {
      f.y = 310;
      f.vy = 0;
      f.onGround = true;
    }
  }

  // Face the opponent
  player.facing = enemy.x >= player.x ? 1 : -1;
  enemy.facing = player.x >= enemy.x ? 1 : -1;

  // Simple enemy AI
  const distance = Math.abs(player.x - enemy.x);

  if (distance > 65) {
    enemy.x += Math.sign(player.x - enemy.x) * 1.3 * step;
  } else if (enemy.cooldown <= 0) {
    attack(enemy, player, Math.random() < 0.2);
  }

  enemy.x = Math.max(30, Math.min(770, enemy.x));

  for (const p of particles) {
    p.x += p.vx * step;
    p.y += p.vy * step;
    p.life -= step;
  }

  particles = particles.filter(p => p.life > 0);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Arena background
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "#20294b");
  gradient.addColorStop(1, "#11172d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 400);

  // Stars
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 35; i++) {
    const x = (i * 97) % 800;
    const y = (i * 53) % 220;
    ctx.fillRect(x, y, 2, 2);
  }

  // Floor
  ctx.fillStyle = "#384768";
  ctx.fillRect(0, 315, 800, 85);
  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 315);
  ctx.lineTo(800, 315);
  ctx.stroke();

  drawFighter(player);
  drawFighter(enemy);

  // Hit effects
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 25);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 7, 7);
  }
  ctx.globalAlpha = 1;
}

function loop(time) {
  const dt = Math.min(time - (lastTime || time), 40);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  if (["a", "d", "w", "j", "k", " "].includes(key)) {
    e.preventDefault();
  }
  keys[key] = true;

  if (e.repeat) return;

  if (key === "j") attack(player, enemy);
  if (key === "k" && player.special >= 100) {
    attack(player, enemy, true);
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

document.querySelectorAll("[data-key]").forEach(button => {
  const key = button.dataset.key;

  const press = e => {
    e.preventDefault();
    keys[key] = true;

    if (key === "j") attack(player, enemy);
    if (key === "k" && player.special >= 100) {
      attack(player, enemy, true);
    }
  };

  const release = e => {
    e.preventDefault();
    keys[key] = false;
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

document.getElementById("restart").addEventListener("click", resetGame);

resetGame();
requestAnimationFrame(loop);
