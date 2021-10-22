window.l = console.log.bind(console);
window.GAME_WIDTH = 1200;
window.GAME_HEIGHT = 720;
window.LEVEL_CELL_WIDTH = window.GAME_WIDTH / 20;
window.LEVEL_CELL_HEIGHT = window.GAME_HEIGHT / 20;

const PLAY_MUSIC = true;

import loadLevel1 from "./levels/level1";
import loadLevel2 from "./levels/level2";
import loadLevel3 from "./levels/level3";
const LEVEL_CONFIG = [
    loadLevel1, 
    loadLevel2, 
    loadLevel3
];

import kaboom from "kaboom";
// initialize context
kaboom({
    debug: true,
    background: [20, 20, 20],
    width: 1200,
    height: 720
});

import load from "./load";
load();

const player = add([
    sprite("player"),
    pos(),
    origin("bot"),
    area({ width: 30, height: 40 }),
    body({ weight: 1, jumpForce: 750 }),
    {
        speed: 250,
        jumpHeight: 750,
        fastfalling: false,
        crouched: false
    },
    color(),
    z(1000),
    opacity(1),
    "player"
]);

const playerAnim = (anim) => {
    if (!player.grounded()) return;
    if (player.curAnim() !== anim) {
        player.play(anim, { loop: true });
    }
};

const spawnPlayer = () => {
    setCrouching(true);
    player.opacity = 1;
    player.moveTo(player.spawnPoint);
    setTimeout(() => {
        setCrouching(false);
    }, 750);
};

const setCrouching = (bool) => {
    player.crouching = bool;
};

const fade = (done) => {
    const i = setInterval(() => {
        player.opacity = player.opacity - 0.1;
        if (player.opacity <= 0) {
            clearInterval(i);
            done();
        }
    }, 100);
};

class LevelManager {
    constructor(loadLevelFns, player) {
        this.loadFns = loadLevelFns;
        this.player = player;
        this.unloadCurrentLevel = null;
    }
    loadNextLevel() {
        if (this.unloadCurrentLevel) {
            this.unloadCurrentLevel();
        }
        this.unloadCurrentLevel = this.loadFns.shift()(this.player);
        spawnPlayer();
    }
}

const lvlManager = new LevelManager(LEVEL_CONFIG, player);

ready(() => {

    if (PLAY_MUSIC) {
        setTimeout(() => {
            play("dangerouspath", { volume: 0.2, loop: true });
        }, 2000);
    }

    lvlManager.loadNextLevel();
    spawnPlayer();

    playerAnim("idle");

    keyPress("space", () => {
        if (player.grounded()) {
            player.jump();
            player.play("jump");
        }
    });

    keyPress(["w", "e"], () => {
        const door = get("goal")[0];
        if (player.isTouching(door)) {
            setCrouching(true);
            fade(() => {
                lvlManager.loadNextLevel();
            });
        }
    });

    keyPress(["e", "enter"], () => {
        const computers = get("computer");
        if (computers.length === 0) return;
        computers.forEach((computer) => {
            if (player.isTouching(computer)) {
                player.trigger("computing", computer);
            }
        });
    });

    player.on("computing", () => {
        setCrouching(true);
    });
    player.on("doneComputing", () => {
        focus();
        setTimeout(() => setCrouching(false), 100);
    });

    let timeRunning = 0;

    const getMoveSpeed = (isGrounded) => {
        const additionalSpeed = Math.min(timeRunning, 1) * 100;
        const speed = player.speed + additionalSpeed;
        if (!isGrounded) return speed * 0.75;
        return speed;
    };

    player.action(() => {

        if (player.pos.y > 2000 || player.pos.y < 0) {
            spawnPlayer();
        }

        const right = keyIsDown("d");
        const left = keyIsDown("a");

        const isGrounded = player.grounded();
        const isCrouching = player.crouching;

        const isRunning = (() => {
            if (!isGrounded) return false;
            if (isCrouching) return false;
            if (left && right) return false;
            if (left || right) return true;
        })();

        if (isRunning) {
            timeRunning = timeRunning + dt();
        } else {
            timeRunning = 0;
        }

        if (isCrouching) {
            playerAnim("crouch");
            return;
        }

        if (isGrounded) {
            if (isRunning) {
                playerAnim("run");
            } else {
                playerAnim("idle");
            }
        }

        const moveSpeed = getMoveSpeed(isGrounded);
        if (left && !right) {
            player.flipX(true);
            player.move(-moveSpeed, 0);
        } else if (right && !left) {
            player.flipX(false);
            player.move(moveSpeed, 0);
        }

    });

});