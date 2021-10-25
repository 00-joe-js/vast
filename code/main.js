window.l = console.log.bind(console);
window.GAME_WIDTH = 1200;
window.GAME_HEIGHT = 720;
window.LEVEL_CELL_WIDTH = window.GAME_WIDTH / 20;
window.LEVEL_CELL_HEIGHT = window.GAME_HEIGHT / 20;

const PLAY_MUSIC = true;

import loadLevel1 from "./levels/level1";
import loadLevel2 from "./levels/level2";
import loadLevel3 from "./levels/level3";
import loadLevel4 from "./levels/level4";
import loadLevel5 from "./levels/level5";
import loadLevel6 from "./levels/level6";
import loadLevel7 from "./levels/level7";
import loadLevel8 from "./levels/level8";
const LEVEL_CONFIG = [
    // loadLevel1,
    // loadLevel2,
    // loadLevel3,
    // loadLevel4,
    // loadLevel5,
    // loadLevel6,
    // loadLevel7,
    loadLevel8,
];

import kaboom from "kaboom";
import load from "./load";


const startGame = () => {
    document.querySelector("#title-card").remove();
    // initialize context
    kaboom({
        debug: true,
        background: [20, 20, 20],
        width: 1200,
        height: 720
    });

    load();

    const bodyConfig = { weight: 1, jumpForce: 750, maxVel: 65536 };

    const player = add([
        sprite("player"),
        pos(),
        origin("bot"),
        area({ width: 30, height: 40 }),
        body(bodyConfig),
        {
            speed: 250,
            jumpHeight: 750,
            fastfalling: false,
            crouched: false,
            bodyOpts: bodyConfig,
            phasing: false,
            hitStun: false,
            bossFight: false,
        },
        color(),
        z(1000),
        opacity(1),
        "player"
    ]);

    const playerAnim = (anim, loop = true) => {
        if (player.curAnim() !== anim) {
            player.play(anim, { loop });
        }
    };

    player.setAnim = playerAnim;

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
            this._blockCalls = false;
        }
        loadNextLevel() {
            if (this._blockCalls) return;
            this._blockCalls = true;
            setTimeout(() => { this._blockCalls = false }, 5000);
            if (this.unloadCurrentLevel) {
                this.unloadCurrentLevel();
            }
            this.unloadCurrentLevel = this.loadFns.shift()(this.player);
            spawnPlayer();
        }
    }

    const lvlManager = new LevelManager(LEVEL_CONFIG, player);

    let blockCalls = false;
    const goToNextLevel = () => {
        if (blockCalls) return;
        blockCalls = true;
        setTimeout(() => blockCalls = false, 5000);
        setCrouching(true);
        fade(() => {
            lvlManager.loadNextLevel();
        });
    };

    ready(() => {

        if (PLAY_MUSIC) {
            window.BG_MUSIC = play("dangerouspath", { volume: 0.3, loop: true });
        }

        lvlManager.loadNextLevel();
        spawnPlayer();

        playerAnim("idle");

        keyPress("space", () => {
            if (player.grounded() && !player.crouching && !player.hitStun) {
                player.jump();
                player.play("jump");
                play("jumpSound", { volume: 0.15 })
            }
        });

        keyPress(["w", "e"], () => {
            const door = get("goal")[0];
            if (!door) return;
            if (player.isTouching(door)) {
                goToNextLevel();
            }
        });

        keyPress(["e", "enter"], () => {
            if (player.hitStun) return;
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
        player.on("hit", () => {
            play("computeError", { volume: 0.2 });
            player.color = rgb(255, 0, 0);
            shake(10);
            player.hitStun = true;
            player.play("hit", {loop: false, onEnd: () => {
                playerAnim("sit");
            }});
            setTimeout(() => {
                player.hitStun = false;
                player.color = rgb(255, 255, 255);
            }, 1500);
        });

        let timeRunning = 0;

        const getMoveSpeed = (isGrounded) => {
            const additionalSpeed = Math.min(timeRunning, 1) * 100;
            const speed = player.speed + additionalSpeed;
            if (!isGrounded) return speed * 0.75;
            return speed;
        };

        player.action(() => {

            if (player.phasing) return;

            if (player.hitStun) return;

            if (!player.bossFight && (player.pos.y > 2000 || player.pos.y < -5)) {
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
};

document.querySelector("#play-button").addEventListener("click", startGame);