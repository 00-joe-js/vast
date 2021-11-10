window.GAME_WIDTH = 1200;
window.GAME_HEIGHT = 720;
window.LEVEL_CELL_WIDTH = window.GAME_WIDTH / 20;
window.LEVEL_CELL_HEIGHT = window.GAME_HEIGHT / 20;

import loadLevel1 from "./levels/level1";
import loadLevel2 from "./levels/level2";
import loadLevel3 from "./levels/level3";
import loadLevel4 from "./levels/level4";
import loadLevel5 from "./levels/level5";
import loadLevel6 from "./levels/level6";
import loadLevel7 from "./levels/level7";
import loadLevel8 from "./levels/level8";
import winLevel from "./levels/winLevel";
const LEVEL_CONFIG = [
    loadLevel1,
    loadLevel2,
    loadLevel3,
    loadLevel4,
    loadLevel5,
    loadLevel6,
    loadLevel7,
    loadLevel8,
    winLevel
];

import kaboom from "kaboom";
import load from "./load";

import { resetCameraInterface } from "./misc/levelStartUtils";
import getBgMusicMan from "./misc/bgMusicManager";
import LevelManager from "./misc/levelManager";

const startGame = (specificLevel = null) => {

    kaboom({
        debug: true,
        background: [0, 0, 0],
        width: 1200,
        height: 720,
        crisp: true,
    });

    load();

    const bodyConfig = { weight: 1, jumpForce: 750, maxVel: 65536 };

    const spawnPlayer = () => {
        setCrouching(true);
        player.opacity = 1;
        player.moveTo(player.spawnPoint);
        wait(0.75, () => {
            setCrouching(false);
        });
    };

    const player = add([
        sprite("player"),
        pos(),
        origin("bot"),
        area({ width: 30, height: 40 }),
        body(bodyConfig),
        scale(1),
        {
            speed: 250,
            jumpHeight: 750,
            fastfalling: false,
            crouched: false,
            bodyOpts: bodyConfig,
            phasing: false,
            hitStun: false,
            bossFight: false,
            spawnPlayer,
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

    const setCrouching = (bool) => {
        player.crouching = bool;
    };

    const fade = (done) => {
        const stopFading = loop(0.1, () => {
            player.opacity = player.opacity - 0.1;
            if (player.opacity <= 0) {
                stopFading();
                done();
            }
        });
    };

    const lvlManager = new LevelManager(LEVEL_CONFIG, player, spawnPlayer);

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

        const bgMusic = getBgMusicMan();
        bgMusic.play("drone");

        focus();

        let camStartingPos = camPos().add(vec2(0, 0));
        resetCameraInterface.setDefaultPos(camStartingPos);
        window.RESET_CAM = () => {
            resetCameraInterface.reset();
        };

        if (specificLevel) {
            lvlManager.loadSpecificLevel(specificLevel);
        } else {
            lvlManager.loadNextLevel();
        }

        spawnPlayer();

        playerAnim("idle");

        let showingControls = false;
        keyPress("escape", () => {
            const controls = document.querySelector("#controls");
            if (!showingControls) {
                showingControls = true;
                controls.classList.add("show-in-game");
            } else {
                showingControls = false;
                controls.classList.remove("show-in-game");
            }
        });

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
            mustUnlockKeyD = true;
            mustUnlockKeyA = true;
            wait(0.1, () => setCrouching(false));
        });

        let mustUnlockKeyA = false;
        let mustUnlockKeyD = false;
        keyPress(["a"], () => {
            if (mustUnlockKeyA) mustUnlockKeyA = false;
        });
        keyPress(["d"], () => {
            if (mustUnlockKeyD) mustUnlockKeyD = false;
        });

        player.on("hit", () => {
            play("computeError", { volume: 0.2 });
            shake(10);
            player.color = rgb(255, 0, 0);
            player.hitStun = true;
            player.play("hit", {
                loop: false, onEnd: () => {
                    playerAnim("sit");
                }
            });
            wait(1.5, () => {
                player.hitStun = false;
                player.color = rgb(255, 255, 255);
            });
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

            const right = keyIsDown("d") && !mustUnlockKeyD;
            const left = keyIsDown("a") && !mustUnlockKeyA;

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

import setupTitleAndCreditsCards from "./misc/titleAndCredits";
setupTitleAndCreditsCards(startGame);
