import CONFIG from '../config.js';
import { createWallet } from '../logic/economy.js';
import { applyDamage, upgradeCost, sauce } from '../logic/combat.js';
import { makeTextures, PALETTE, PIXEL_FONT } from '../art/textures.js';
import { makeMazeGround, makeVignette } from '../art/environment.js';
import { spawnEnemy, stepEnemy, removeEnemy, enemyReward, enemyLeak, enemyCells } from '../entities/Enemy.js';
import { placeBlock as placeBlockEntity, refreshBlock, stepTower, upgradeTowerStats } from '../entities/Tower.js';
import { spawnVan, stepVan } from '../entities/PizzaVan.js';
import { crossedThresholds } from '../logic/boss.js';
import { createSword } from '../logic/sword.js';
import { rollFlip, flipModifiers } from '../logic/flip.js';
import { waveSchedule, clearBonus } from '../logic/waves.js';
import { createGrid, setObstacles, placeBlock as placeOnGrid, distanceField, canPlace, routeFrom } from '../logic/grid.js';
import { SHAPES, createBag, cellsAt, rotate } from '../logic/tetromino.js';
import * as sfx from '../audio/sfx.js';

const OFFICE = { x: 1094, y: 300, w: 170, h: 226 };
const MEDIA = { x: 1094, y: 70, w: 170, h: 186 };
export const HUD_H = 56;
const M = CONFIG.maze;
const KIDS = ['slingshot', 'walkie', 'psychic', 'lights'];
const MIN_KID_COST = Math.min(...KIDS.map(k => CONFIG.towers[k].cost));

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    makeTextures(this);
    this.wallet = createWallet(CONFIG.startTokens);
    this.health = CONFIG.baseHealth;
    this.enemies = [];
    this.towers = [];          // placed blocks (each run by one kid)
    this.grid = createGrid(M.cols, M.rows);
    const obstacles = [];
    M.houses.forEach(([c, r]) => obstacles.push([c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]));
    M.trees.forEach(t => obstacles.push(t));
    setObstacles(this.grid, obstacles);
    this.dist = distanceField(this.grid, M.goal);
    this.bag = createBag();
    this.shape = this.bag.next();
    this.rot = 0;
    this.nextId = 1;
    this.picking = null;       // cells of a dropped block waiting for its kid
    this.over = false;
    this.now = 0;
    this.bossDefeated = false;
    this.sword = createSword();
    this.upside = false;
    this.upsideUntil = 0;
    this.flipPending = false;
    this.pizzaReadyAt = 0;
    this.vans = [];
    this.boss = null;
    this.sfx = sfx;
    this.wave = 0;
    this.waveActive = false;
    this.pendingSpawns = 0;
    this.leaksThisWave = 0;

    this.drawMap();
    this.routeGfx = this.add.graphics().setDepth(0.6);
    this.ghost = [0, 1, 2, 3].map(() => this.add.rectangle(0, 0, M.cell - 2, M.cell - 2, 0xffffff, 0.35).setStrokeStyle(2, 0xffffff, 0.8).setDepth(20).setVisible(false));
    this.rangeGfx = this.add.graphics().setDepth(3.95);
    this.drawRoute();

    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', p => this.updateGhost(p));
    this.input.on('pointerdown', p => { sfx.unlock(); if (p.rightButtonDown()) this.rightClick(p); else this.tryPlace(p); });
    this.input.on('wheel', () => this.rotatePiece());
    this.input.keyboard.on('keydown', () => sfx.unlock());
    this.input.keyboard.on('keydown-R', () => this.rotatePiece());
    this.input.keyboard.on('keydown-U', () => this.upgradeSelected());
    this.input.keyboard.on('keydown-ESC', () => this.cancelPick());
    KIDS.forEach((k, i) => this.input.keyboard.on('keydown-' + ['ONE', 'TWO', 'THREE', 'FOUR'][i], () => this.chooseKid(k)));

    this.scene.launch('UI');
    this.input.keyboard.on('keydown-SPACE', () => this.startWave());
    this.input.keyboard.on('keydown-S', () => this.useSword());
    this.input.keyboard.on('keydown-P', () => this.callPizza());
    if (new URLSearchParams(location.search).has('debug')) {
      // Debug: B jumps straight to the boss wave.
      this.input.keyboard.on('keydown-B', () => { if (!this.waveActive) { this.wave = CONFIG.waves.count - 1; this.wallet.earn(2000); this.emitAll(); this.startWave(); } });
    }
    this.emitAll();
    this.emitShapes();
    sfx.upsideDrone(false);
    sfx.musicStart();

    // Upside Down: overlays sit above the town but below kids and monsters, so those stay readable.
    // The camera mirrors the board on a vertical squash (negative zoomY); culling must be off for that.
    this.cameras.main.disableCull = true;
    this.vines = this.drawVines();
    this.coldLayer = this.add.rectangle(640, 360, 1280, 720, 0x5a6fa8).setDepth(3.5).setBlendMode(Phaser.BlendModes.MULTIPLY).setAlpha(0);
    this.redLayer = this.add.rectangle(640, 360, 1280, 720, 0xff2a3a).setDepth(3.6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.ash = this.add.particles(0, 0, 'ash', {
      x: { min: 0, max: 1280 }, y: { min: 60, max: 720 }, lifespan: 4000, speedY: { min: 10, max: 40 }, speedX: { min: -15, max: 15 },
      alpha: { start: 0.8, end: 0 }, quantity: 3, frequency: 80, emitting: false,
    }).setDepth(9);
    this.time.addEvent({ delay: CONFIG.flip.rollEveryMs, loop: true, callback: () => {
      if (this.waveActive && !this.upside && !this.flipPending && !this.over && rollFlip(this.wave)) this.triggerFlip();
    } });
  }

  // A one-second flicker warns that the Upside Down is coming.
  triggerFlip() {
    if (this.over) return;
    if (this.upside) { this.upsideUntil = this.now + CONFIG.flip.durationMs; return; }
    if (this.flipPending) return;
    this.flipPending = true;
    this.game.events.emit('upsideWarn');
    const flick = this.add.rectangle(640, 360, 1280, 720, 0x000000).setDepth(3.7).setAlpha(0);
    this.tweens.add({ targets: flick, alpha: 0.6, duration: CONFIG.flip.warnMs / 8, yoyo: true, repeat: 3, onComplete: () => { flick.destroy(); this.enterUpside(); } });
  }

  enterUpside() {
    this.flipPending = false;
    if (this.over) return;
    this.upside = true;
    this.upsideUntil = this.now + CONFIG.flip.durationMs;
    sfx.flip();
    sfx.upsideDrone(true);
    sfx.musicDuck(true);
    this.cameras.main.shake(400, 0.008);
    this.cardFlip(-1, () => {
      // Edge-on: the backside comes into view.
      this.coldLayer.setAlpha(1); this.redLayer.setAlpha(0.18); this.vines.setAlpha(1);
      this.ash.start();
    });
    this.lightning = this.time.addEvent({ delay: 2600, loop: true, callback: () => {
      if (!this.upside || Math.random() < 0.4) return;
      this.cameras.main.flash(140, 255, 40, 50);
      sfx.thunder();
    } });
    this.game.events.emit('upside', true);
  }

  // Flip the board over its horizontal axis like a card (bottom to top), swapping sides edge-on.
  cardFlip(to, atEdge) {
    const cam = this.cameras.main;
    this.tweens.killTweensOf(cam);
    this.tweens.add({ targets: cam, zoomY: 0, duration: 450, ease: 'Sine.easeIn', onComplete: () => {
      atEdge();
      this.tweens.add({ targets: cam, zoomY: to, duration: 450, ease: 'Sine.easeOut' });
    } });
  }

  // Dark Upside Down vines creeping over the town; only seen on the backside.
  drawVines() {
    const g = this.add.graphics().setDepth(3.55).setAlpha(0);
    const rnd = new Phaser.Math.RandomDataGenerator(['vines']);
    for (let i = 0; i < 26; i++) {
      let x = rnd.between(0, 1280), y = rnd.between(60, 720), a = rnd.frac() * Math.PI * 2;
      for (let s = 0; s < 14; s++) {
        const nx = x + Math.cos(a) * 22, ny = y + Math.sin(a) * 22;
        g.lineStyle(Math.max(1, 6 - s * 0.4), 0x2a0a10, 0.9).lineBetween(x, y, nx, ny);
        if (s % 4 === 2) { g.lineStyle(2, 0x3d0f18, 0.8).lineBetween(nx, ny, nx + Math.cos(a + 1.2) * 14, ny + Math.sin(a + 1.2) * 14); }
        x = nx; y = ny; a += rnd.realInRange(-0.6, 0.6);
      }
    }
    return g;
  }

  exitUpside() {
    this.upside = false;
    sfx.upsideDrone(false);
    sfx.musicDuck(false);
    this.lightning?.remove();
    this.cardFlip(1, () => {
      this.coldLayer.setAlpha(0); this.redLayer.setAlpha(0); this.vines.setAlpha(0);
      this.ash.stop();
    });
    this.game.events.emit('upside', false);
  }

  // Modifiers for newly spawned enemies (the Upside Down changes these).
  spawnMods() { return flipModifiers(this.upside); }

  startWave() {
    if (this.over || this.waveActive || this.wave >= CONFIG.waves.count) return;
    this.wave++;
    this.waveActive = true;
    this.leaksThisWave = 0;
    const schedule = waveSchedule(this.wave);
    this.pendingSpawns = schedule.length;
    for (const s of schedule) {
      // Scene time pauses while the tab is hidden, so no burst on return.
      this.time.delayedCall(s.atMs, () => {
        if (this.over || this.bossDefeated) { this.pendingSpawns--; return; }
        const e = spawnEnemy(this, s.type, s.hpScale, this.spawnMods());
        if (e.type === 'boss') this.bossEntrance(e);
        this.enemies.push(e);
        this.pendingSpawns--;
        this.events.emit('spawned', e);
      });
    }
    this.game.events.emit('wave', this.wave);
    if (this.wave === 1) this.tip('Drop blocks to build a maze (R rotates), then pick a kid for each block.');
    if (this.wave === 3) this.tip('Only edge squares fire — squares walled in by other blocks go quiet.');
    if (this.wave === CONFIG.waves.count) this.tip('Something big is coming through the Rift…');
    this.game.events.emit('waveState', true);
  }

  waveCleared() {
    if (this.over) return;   // the last leak ended the game: no bell, no banner
    this.waveActive = false;
    const info = { wave: this.wave, leaks: this.leaksThisWave };
    this.events.emit('waveCleared', info);
    this.game.events.emit('waveCleared', info);
    sfx.bell();
    const bonus = clearBonus(this.wave);
    this.wallet.earn(bonus);
    this.game.events.emit('tokens', this.wallet.tokens);
    this.banner('WAVE CLEARED', '#ffc94a', `+${bonus} tokens`);
    if (this.sword.onWaveCleared(this.leaksThisWave)) {
      this.game.events.emit('sword', this.sword.charges);
      this.time.delayedCall(2300, () => {
        if (this.over) return;
        this.banner('PERFECT WAVE', '#dfe6ee', 'THE NEXIOS SWORD IS YOURS — press S', false);
        this.ui.swordSprite(640, 470, 1.4).setAlpha(0).setDepth(31);
      });
    }
    if (this.wave >= CONFIG.waves.count) { this.endGame(true); return; }
    this.game.events.emit('waveState', false);
  }

  useSword() {
    if (this.over || !this.enemies.some(e => e.alive) || !this.sword.use()) return;   // never wasted on an empty board
    this.game.events.emit('sword', this.sword.charges);
    sfx.sword();
    const c = this.add.container(-400, 380, [this.add.image(0, 0, 'sword')]).setScale(3).setDepth(40).setAngle(-12);
    const logo = this.add.image(40, 0, 'logo').setTint(0x1c2433);
    logo.setScale(Math.min(110 / logo.width, 9 / logo.height));
    c.add(logo);
    this.tweens.add({ targets: c, x: 1700, angle: 12, duration: 600, ease: 'Cubic.easeIn', onComplete: () => c.destroy() });
    const slash = this.add.rectangle(640, 380, 1280, 10, 0xffffff, 0.9).setDepth(39).setScale(0, 1);
    this.tweens.add({ targets: slash, scaleX: 1, duration: 450, ease: 'Cubic.easeIn' });
    this.tweens.add({ targets: slash, alpha: 0, scaleY: 8, delay: 450, duration: 400, onComplete: () => slash.destroy() });
    this.time.delayedCall(420, () => {
      this.cameras.main.flash(250, 255, 255, 255);
      this.cameras.main.shake(300, 0.01);
      for (const e of [...this.enemies]) {
        if (!e.alive) continue;
        if (e.type === 'boss') this.hit(e, CONFIG.sword.bossDamagePct * e.maxHp);
        else this.hit(e, e.hp * 10 + 1);   // slices through like butter
      }
    });
  }

  callPizza() {
    if (this.over || this.now < this.pizzaReadyAt || !this.enemies.some(e => e.alive)) return;
    if (!this.wallet.spend(CONFIG.pizza.cost)) return;
    this.pizzaReadyAt = this.now + CONFIG.pizza.cooldownMs;
    this.vans.push(spawnVan(this, routeFrom(this.grid, this.dist, M.spawn).map(c => this.cellCenter(c))));
    this.game.events.emit('tokens', this.wallet.tokens);
    this.game.events.emit('pizza', CONFIG.pizza.cooldownMs);
    this.ui.toast('The kids ordered Pizza Hut. Extra sauce.');
  }

  bossEntrance(e) {
    this.boss = e;
    sfx.boss();
    this.cameras.main.shake(900, 0.012);
    this.cameras.main.flash(400, 120, 0, 0);
    this.tweens.add({ targets: e.sprite, scaleX: 1.08, scaleY: 0.94, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.game.events.emit('bossHp', e.hp, e.maxHp);
  }

  bossPhase() {
    this.events.emit('bossPhase');
    this.triggerFlip();   // each boss phase drags the town into the Upside Down
    sfx.boss();
    this.cameras.main.shake(500, 0.01);
    this.cameras.main.flash(300, 160, 0, 30);
  }

  bossDefeat(e) {
    this.bossDefeated = true;
    this.boss = null;
    this.game.events.emit('bossHp', 0, e.maxHp);
    this.cameras.main.shake(1200, 0.02);
    this.cameras.main.flash(800, 255, 255, 255);
    for (let i = 0; i < 6; i++) this.time.delayedCall(i * 120, () => this.puff(e.x + Phaser.Math.Between(-30, 30), e.y + Phaser.Math.Between(-40, 40), 0xff3030));
    // The rest of the horde flees back through the Rift.
    for (const o of this.enemies) if (o.alive && o !== e) { this.puff(o.x, o.y, 0x8a3a3a); removeEnemy(o); }
  }

  // Messages render in the UI scene, whose camera never rotates, so they stay readable in the Upside Down.
  get ui() { return this.scene.get('UI'); }
  banner(...a) { this.ui.banner(...a); }
  tip(text) { this.ui.tip(text); }

  emitAll() {
    this.game.events.emit('tokens', this.wallet.tokens);
    this.game.events.emit('health', this.health);
  }

  emitShapes() { this.game.events.emit('shapes', { current: this.shape, next: this.bag.peek(), rot: this.rot }); }

  // --- Grid helpers ---------------------------------------------------------
  cellCenter([c, r]) { return { x: M.x0 + c * M.cell + M.cell / 2, y: M.y0 + r * M.cell + M.cell / 2 }; }
  cellAt(p) { return [Math.floor((p.x - M.x0) / M.cell), Math.floor((p.y - M.y0) / M.cell)]; }
  blockAt([c, r]) { return this.towers.find(b => b.cells.some(([bc, br]) => bc === c && br === r)); }

  drawMap() {
    makeMazeGround(this, M, { office: OFFICE, media: MEDIA });
    makeVignette(this);
    this.add.image(0, 0, 'maze-ground').setOrigin(0).setScale(2).setDepth(0);
    this.add.image(0, 0, 'vignette').setOrigin(0).setScale(2).setDepth(19);
    // The Rift at the spawn square: a pulsing red gash with a dark core.
    const s = this.cellCenter(M.spawn);
    const rift = this.add.ellipse(s.x, s.y, 30, 80, PALETTE.rift).setDepth(2);
    this.add.ellipse(s.x, s.y, 12, 62, 0x2a0008).setDepth(2);
    this.tweens.add({ targets: rift, scaleX: 1.25, alpha: 0.7, yoyo: true, repeat: -1, duration: 700 });
    this.drawBuildings();
  }

  drawBuildings() {
    this.add.text(MEDIA.x + MEDIA.w / 2, MEDIA.y + 14, 'DPG MEDIA', { fontFamily: PIXEL_FONT, fontSize: '11px', color: '#e8e8f0' }).setOrigin(0.5).setDepth(3);
    const logo = this.add.image(OFFICE.x + OFFICE.w / 2, OFFICE.y - 14, 'logo').setDepth(3);
    logo.setScale(Math.min(150 / logo.width, 26 / logo.height));
    this.officeFlash = this.add.rectangle(OFFICE.x + OFFICE.w / 2, OFFICE.y + OFFICE.h / 2, OFFICE.w, OFFICE.h, 0xff0000, 0).setDepth(3);
  }

  // The monsters' current route, worn into the grass as a dirt trail.
  drawRoute() {
    const pts = routeFrom(this.grid, this.dist, M.spawn).map(c => this.cellCenter(c));
    const g = this.routeGfx.clear();
    g.lineStyle(14, 0x3a2b20, 0.55);
    for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    g.fillStyle(0x3a2b20, 0.55);
    pts.forEach(p => g.fillCircle(p.x, p.y, 7));
  }

  // Pointer in world space (the camera is mirrored in the Upside Down).
  worldPoint(p) { return { x: p.worldX, y: p.worldY }; }
  // While the board is nearly edge-on, clicks can't be mapped sensibly.
  midFlip() { return Math.abs(this.cameras.main.zoomY) < 0.5; }

  // Cells the current piece would cover with the pointer near its middle.
  pieceCells(p) {
    const shape = rotate(SHAPES[this.shape], this.rot);
    const w = Math.max(...shape.map(c => c[0])) + 1, h = Math.max(...shape.map(c => c[1])) + 1;
    const [pc, pr] = this.cellAt(this.worldPoint(p));
    return cellsAt(SHAPES[this.shape], this.rot, pc - Math.floor((w - 1) / 2), pr - Math.floor((h - 1) / 2));
  }

  occupied() { return this.enemies.flatMap(enemyCells); }

  placementCheck(cells) {
    const res = canPlace(this.grid, cells, { spawn: M.spawn, goal: M.goal, occupied: this.occupied() });
    if (res.ok && this.wallet.tokens < MIN_KID_COST) return { ok: false, reason: 'tokens' };
    return res;
  }

  showGhost(cells, color) {
    this.ghost.forEach((g, i) => {
      const p = this.cellCenter(cells[i]);
      g.setPosition(p.x, p.y).setFillStyle(color, 0.35).setStrokeStyle(2, color, 0.9).setVisible(true);
    });
  }

  updateGhost(p) {
    if (this.picking) return;
    if (p.y < HUD_H || this.over) { this.ghost.forEach(g => g.setVisible(false)); return; }
    const cells = this.pieceCells(p);
    const onBlock = cells.length && this.blockAt(this.cellAt(this.worldPoint(p)));
    const res = this.placementCheck(cells);
    this.showGhost(cells, res.ok ? 0x6bff6b : 0xff3030);
    this.ghost.forEach(g => g.setAlpha(onBlock ? 0.25 : 1));
    this.lastPointer = p;
  }

  rotatePiece() {
    if (this.picking || this.over) return;
    this.rot = (this.rot + 1) % 4;
    this.emitShapes();
    if (this.lastPointer) this.updateGhost(this.lastPointer);
  }

  rightClick(p) { if (this.picking) this.cancelPick(); else this.rotatePiece(); }

  tryPlace(p) {
    if (this.over || p.y < HUD_H || this.midFlip()) return;
    if (this.picking) return;                                    // choose a kid (or Esc) first
    const clicked = this.blockAt(this.cellAt(this.worldPoint(p)));
    if (clicked) { this.selectTower(clicked); return; }
    this.selectTower(null);
    const cells = this.pieceCells(p);
    const res = this.placementCheck(cells);
    if (!res.ok) {
      const why = { 'blocks-path': 'That would block the path — the monsters must always get through.', enemy: 'A monster is in the way.', tokens: `You need at least ${MIN_KID_COST} tokens to man a block.` }[res.reason];
      if (why) this.ui.toast(why);
      return;
    }
    // Dropped: hold it in place until the player picks the kid who runs it.
    this.picking = { cells };
    this.showGhost(cells, 0xffd84a);
    this.game.events.emit('picking', true);
  }

  cancelPick() {
    if (!this.picking) return;
    this.picking = null;
    this.ghost.forEach(g => g.setVisible(false));
    this.game.events.emit('picking', false);
    if (this.lastPointer) this.updateGhost(this.lastPointer);
  }

  chooseKid(type) {
    if (!this.picking || this.over) return;
    const cost = CONFIG.towers[type].cost;
    if (this.wallet.tokens < cost) { this.ui.toast(`Not enough tokens for that kid (${cost}).`); return; }
    const { cells } = this.picking;
    const res = canPlace(this.grid, cells, { spawn: M.spawn, goal: M.goal, occupied: this.occupied() });
    if (!res.ok) {
      this.ui.toast(res.reason === 'enemy' ? 'A monster walked into the spot — try again.' : 'That would block the path — the monsters must always get through.');
      this.cancelPick(); return;
    }
    this.wallet.spend(cost);
    const id = this.nextId++;
    placeOnGrid(this.grid, cells, id);
    this.towers.push(placeBlockEntity(this, type, cells, id));
    this.recomputeMaze();
    this.shape = this.bag.next();
    this.rot = 0;
    this.picking = null;
    this.game.events.emit('picking', false);
    this.game.events.emit('tokens', this.wallet.tokens);
    this.emitShapes();
    sfx.pulse();
    if (this.lastPointer) this.updateGhost(this.lastPointer);
  }

  recomputeMaze() {
    this.dist = distanceField(this.grid, M.goal);
    this.towers.forEach(b => refreshBlock(this, b));
    this.drawRoute();
  }

  selectTower(t) {
    this.selected = t;
    const g = this.rangeGfx.clear();
    if (!t) { this.game.events.emit('towerSelected', null); return; }
    g.fillStyle(PALETTE.neonCyan, 0.05).lineStyle(1, PALETTE.neonCyan, 0.5);
    t.edges.forEach(p => { g.fillCircle(p.x, p.y, t.range); g.strokeCircle(p.x, p.y, t.range); });
    this.game.events.emit('towerSelected', t);
  }

  upgradeSelected() {
    const t = this.selected;
    if (!t || this.over) return;
    const cost = upgradeCost(t.type, t.level);
    if (cost === null || !this.wallet.spend(cost)) return;
    upgradeTowerStats(t);
    this.game.events.emit('tokens', this.wallet.tokens);
    this.selectTower(t);
    this.puff(t.x, t.y, 0xffc94a);
  }

  hit(target, damage) {
    const prevHp = target.hp;
    const { killed } = applyDamage(target, damage, this.now);
    this.afterDamage(target, prevHp, killed);
  }

  // Shared bookkeeping after any damage: boss phases, rewards, removal.
  afterDamage(target, prevHp, killed) {
    if (target.type === 'boss') {
      crossedThresholds(prevHp, target.hp, target.maxHp).forEach(() => this.bossPhase());
      this.game.events.emit('bossHp', Math.max(0, target.hp), target.maxHp);
      if (killed) { this.bossDefeat(target); removeEnemy(target); return; }
    }
    if (!killed) return;
    this.wallet.earn(enemyReward(target));
    this.game.events.emit('tokens', this.wallet.tokens);
    this.puff(target.x, target.y, 0xd94a6a);
    removeEnemy(target);
  }

  puff(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const d = this.add.image(x, y, 'dot').setTint(color).setDepth(9);
      this.tweens.add({ targets: d, x: x + Phaser.Math.Between(-24, 24), y: y + Phaser.Math.Between(-24, 24), alpha: 0, duration: 350, onComplete: () => d.destroy() });
    }
  }

  leak(e) {
    this.health = Math.max(0, this.health - enemyLeak(e));
    this.leaksThisWave++;
    removeEnemy(e);
    this.game.events.emit('health', this.health);
    this.cameras.main.shake(150, 0.006);
    this.officeFlash.setAlpha(0.35);
    this.tweens.add({ targets: this.officeFlash, alpha: 0, duration: 300 });
    if (this.health <= 0) this.endGame(false);
  }

  endGame(won) {
    if (this.over) return;
    this.over = true;
    sfx.upsideDrone(false);
    sfx.musicStop();
    this.time.delayedCall(600, () => { this.scene.stop('UI'); this.scene.start('End', { won, wave: this.wave }); });
  }

  update(time, delta) {
    if (this.over) return;
    const dt = Math.min(delta, 50);
    this.now += dt;   // game clock: only advances with frames, never jumps
    const now = this.now;
    if (this.upside && now >= this.upsideUntil) this.exitUpside();
    for (const van of this.vans) {
      for (const e of stepVan(this, van, dt, this.enemies)) {
        const prevHp = e.hp;
        const { killed } = sauce(e, now);
        sfx.splat();
        this.afterDamage(e, prevHp, killed);
      }
    }
    this.vans = this.vans.filter(v => !v.done);
    for (const e of this.enemies) {
      if (e.alive && stepEnemy(this, e, dt, now)) this.leak(e);
    }
    this.enemies = this.enemies.filter(e => e.alive);
    const hit = (t, d) => this.hit(t, d);
    for (const t of this.towers) stepTower(this, t, this.enemies, now, hit);
    if (!this.over && this.waveActive && this.pendingSpawns === 0 && this.enemies.length === 0) this.waveCleared();
  }
}
