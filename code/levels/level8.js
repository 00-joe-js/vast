import buildPuter from "../puters";
import { showDialogWindow } from "../misc/editorUtils";

export default (player) => {

    player.spawnPoint = vec2(1950, 275);

    camScale(1, 1);

    let turnoffCamFollow = player.action(() => {
        camPos(player.pos);
    });

    const cellWidth = window.LEVEL_CELL_WIDTH;
    const cellHeight = window.LEVEL_CELL_HEIGHT;

    const levelConfig = {
        width: cellWidth,
        height: cellHeight,
        "=": () => {
            return [
                rect(cellWidth, cellHeight),
                solid(),
                area()
            ];
        },
        "*": () => {
            return [
                rect(cellWidth / 2, cellHeight * 2),
                color(255, 0, 0),
                origin("top"),
                area(),
                "goal",
            ];
        }
    };

    const levelMapString = [
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "            ==      ",
        "     =====          ",
        "===  =====     ==  ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    "
    ];

    let elevatorSpeed = 0;

    const bossPlat = add([
        rect(1800, cellHeight / 2),
        solid(),
        area(),
        pos(1100, 500),
        "bossPlat"
    ]);
    const level = addLevel(levelMapString, levelConfig);

    let preventCreateNewStars = false;
    let stars = [];
    const createStar = (delay = true) => {

        if (preventCreateNewStars) return;

        const halfW = width();
        const halfH = height() * 2;
        const initialPos = [randi(player.pos.x - halfW, player.pos.x + halfW), randi(player.pos.y - halfH, player.pos.y + halfH)];
        const star = add([
            circle(1),
            color(255, 255, 255),
            pos(...initialPos),
            area({ width: 1, height: 1 }),
            cleanup(),
            opacity(delay ? 0 : 1),
            z(-1)
        ]);
        stars.push(star);
        const cancelDestroyListener = star.on("destroy", () => {
            createStar(false);
            cancelDestroyListener();
        });
        if (delay) {
            setTimeout(() => {
                star.opacity = 1;
            }, randi(500, 5000));
        }
        return star;
    };

    bossPlat.action(() => {
        stars.forEach(star => star.pos.y = star.pos.y + (dt() * elevatorSpeed));
    });

    const createElevatorWalls = () => {
        const leftWall = add([
            rect(350, height() * 4),
            color(255, 255, 255),
            pos(750, -1000)
        ]);
        const rightWall = add([
            rect(350, height() * 4),
            color(255, 255, 255),
            pos(2900, -1000)
        ])
        return [leftWall, rightWall];
    };

    let noEscapePuter = null;

    const cleanStartPuter = buildPuter({
        getCodeBlock() {
            return [
                ["const noEscape = true;"]
            ];
        },
        onExecute() {
            let scale = 1;
            let tilt = player.pos.y;
            const destTilt = tilt - 500;
            destroy(level);
            turnoffCamFollow();
            createElevatorWalls();
            const camZoomOut = setInterval(() => {
                scale = scale - dt();
                if (scale <= 0.5) {
                    scale = 0.5;
                }
                tilt = tilt - (dt() * 1000);
                if (tilt <= destTilt) {
                    tilt = destTilt;
                }
                if (scale === 0.5 && tilt === destTilt) {
                    clearInterval(camZoomOut);
                    new Array(70).fill(null).map(() => createStar(true));
                    setTimeout(() => {
                        shake(10),
                            elevatorSpeed = 1000;
                    }, 200);
                    setTimeout(() => {
                        startBoss();
                    }, 200);
                }
                camScale(scale, scale);
                camPos(2000, tilt);
            }, 1);
        },
        onAction(puter) {
            noEscapePuter = puter;
        },
        player
    }, {
        puterPos: [2000, 475],
        errorTextScale: 10
    });

    const prop = 84 / 115;
    const abelHeight = height() * 4;
    const abel = add([
        sprite("abel", { frame: 0, width: abelHeight * prop, height: abelHeight }),
        pos(0, 0),
        opacity(0.1),
        color(0, 0, 0),
        origin("center"),
        z(-3)
    ]);
    window.abel = abel;

    let phase1Puter = { puter: null, clean: null };
    let phase2Puter = { puter: null, clean: null };
    let phase3Puter = { puter: null, clean: null };

    const startBoss = () => {

        player.bossFight = true;
        noEscapePuter.trigger("ABEL_error", new Error("NO"));
        window.BG_MUSIC.stop();
        shake(100);
        elevatorSpeed = 0;
        cleanStartPuter();
        abel.pos = vec2(2000, 475 - 500);
        abel.color = rgb(255, 0, 0);

        setTimeout(() => {
            const { destroy } = showDialogWindow(["I will not be left alone."], [550, 350]);
            setTimeout(() => {
                destroy();
                play("bossMusic", { volume: 0.2, loop: true });
                bossBattlePhase2();
                abel.color = rgb(0, 0, 0);
            }, 200);
        }, 200);

        phase1Puter.clean = buildPuter({
            getCodeBlock() {
                return [
                    "// Test.",
                    [""]
                ];
            },
            onExecute() {

            },
            onAction(p) {
                if (!phase1Puter.puter) phase1Puter.puter = p;
            },
            player
        }, {
            puterPos: [1500, 475],
            codeWindowPos: [0, 0],
            errorTextScale: 2,
            orig: "center",
            areaScaleX: 5

        });

        let puter2LastTyped = `    setBlackHolePosition(0, 0);`
        phase2Puter.clean = buildPuter({
            getCodeBlock() {
                return [
                    "// Eater of stars.",
                    "blackHole.x = 0;",
                    "blackHole.y = 0;",
                    "const setBlackHolePosition = (x, y) => {",
                    "   blackHole.moveTo(x, y)",
                    "};",
                    "perSecond(nthSecond => { // 1, 2, 3, 4, and 5",
                    [puter2LastTyped],
                    "});"
                ];
            },
            onExecute(typedCode) {
                puter2LastTyped = typedCode;
                window.ABEL_setBlackHolePosAtSecond = (n, x, y) => {
                    blackHolePositions[n].x = x;
                    blackHolePositions[n].y = y;
                    console.log(n, x, y);
                };
                eval(
                    `
                        for (let i = 1; i < 6; i++) {
                            const setBlackHolePosition = (x, y) => {
                                window.ABEL_setBlackHolePosAtSecond(i - 1, x, y);
                            };
                            const nthSecond = i;
                            ${typedCode}
                        }
                    `
                );
                console.log(blackHolePositions);
            },
            onAction(p) {
                if (!phase2Puter.puter) phase2Puter.puter = p;
            },
            player
        }, {
            puterPos: [2000, 475],
            codeWindowPos: [0, 0],
            errorTextScale: 2,
            orig: "center",
            areaScaleX: 5
        });

        phase3Puter.clean = buildPuter({
            getCodeBlock() {
                return [
                    "// Test 3.",
                    [""]
                ];
            },
            onExecute() {

            },
            onAction(p) {
                if (!phase3Puter.puter) phase3Puter.puter = p;
            },
            player
        }, {
            puterPos: [2500, 475],
            codeWindowPos: [0, 0],
            errorTextScale: 2,
            orig: "center",
            areaScaleX: 5
        });

    };

    const bossBattlePhase1 = () => {

        const transitionToNextPhase = () => {
            randomBlocks.forEach(destroy);
            bossBattlePhase2();
        };
        const randomBlocks = new Array(randi(100, 300)).fill(null).map(() => {
            const isRed = chance(0.5);
            const block = add([
                circle(3),
                color(isRed ? [255, 0, 0] : [255, 255, 255]),
                pos(randi(1100, 1100 + 1800), -800),
                area({ width: 7, height: 7 }),
                opacity(1),
                timer(rand(0.05, 4), () => {
                    block.opacity = 1;
                    block.fall = true;
                })
            ]);
            block.action(() => {
                if (block.fall === true) {
                    block.pos.y = block.pos.y + (dt() * 750);
                    if (block.isTouching(player) && isRed && !player.hitStun) {
                        player.trigger("hit");
                        block.destroy();
                    }
                    if (block.isTouching(bossPlat)) {
                        block.destroy();
                    }
                }
            });
            return block;
        });
        setTimeout(() => {
            transitionToNextPhase();
        }, 10000);
    };

    const blackHolePositions = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
    ];
    const bossBattlePhase2 = () => {

        let timeSince = 0;

        const blackHole = add([
            circle(64),
            color([30, 30, 30]),
            opacity(0.1),
            area({ width: 110, height: 110, scale: 10 }),
            origin("center"),
            outline(2, rgb(100, 100, 100)),
            pos(1300, 500),
            z(-1),
        ]);

        blackHole.action(() => {
            const t = time();
            blackHole.opacity = wave(0.7, 0.9, t * 50);
            blackHole.outline.width = wave(2, 10, t * 10);
            timeSince += dt();

            if (timeSince >= 2 && timeSince < 7) {
                const index = Math.floor(timeSince) - 2;
                const x = blackHolePositions[index].x + 1200;
                const y = (blackHolePositions[index].y * -1) + 300;
                blackHole.moveTo(x, y, 1000);
            }

        });

        const randomBlocks = new Array(randi(100, 300)).fill(null).map(() => {
            const initialPos = [randi(1200, 1200 + 1600), randi(100, -650)];
            const speed = randi(2, 7);
            let touchingBlackHole = false;
            const block = add([
                circle(3),
                color([255, 0, 0]),
                pos(...initialPos),
                area({ width: 7, height: 7 }),
                opacity(0),
                timer(rand(0.2, 1), () => {
                    block.opacity = 1;
                })
            ]);
            block.action(() => {
                if (touchingBlackHole) {
                    block.moveTo(blackHole.pos.x, blackHole.pos.y, 200);
                    return;
                }
                if (block.isTouching(blackHole)) {
                    touchingBlackHole = true;
                    setTimeout(() => {
                        block.destroy();
                    }, 500);
                }
                if (block.fall === true) {
                    block.pos.y = block.pos.y + (dt() * 500);
                    if (block.isTouching(player) && !player.hitStun) {
                        player.trigger("hit");
                        block.destroy();
                    }
                    if (block.isTouching(bossPlat)) {
                        block.destroy();
                    }
                } else {
                    block.moveTo(vec2(initialPos[0], wave(initialPos[1] - 4, initialPos[1] + 4, time() * speed)));
                }
            });
            return block;
        });

        setTimeout(() => {
            randomBlocks.forEach(block => block.fall = true);
        }, 7500);

        const transitionToNextPhase = () => {
            blackHole.destroy();
            randomBlocks.forEach(destroy);
            bossBattlePhase1();
        };

        setTimeout(() => {
            transitionToNextPhase();
        }, 12000);

    };

    const bossBattlePhase3 = () => {

        const leftX = 1100;
        const topY = -700;

        const platConfigs = new Array(12).fill(null).map((_, i) => {
            return {
                width: 300, height: 10, x: leftX + (i % 2 === 0 ? 500 : 0), y: topY + 100 + (i * 100)
            }
        });

        const allPlats = platConfigs.map(config => {
            const plat = add([
                rect(config.width, config.height),
                pos(config.x, config.y),
                color(),
                solid(),
                area()
            ]);
            let dir = 1;
            plat.action(() => {
                if (player.curPlatform() === plat) {
                    plat.color = rgb(255, 0, 0);
                }
                if (dir === 1 && plat.pos.x >= leftX + 1500) {
                    dir = -1;
                } else if (dir === -1 && plat.pos.x <= leftX) {
                    dir = 1;
                }
                plat.pos.x = plat.pos.x + (dt() * 500 * dir);
            });
            return plat;
        });

        const transitionToNextPhase = () => {
            allPlats.forEach(destroy);
            bossBattlePhase1();
        };
        setTimeout(() => {
            transitionToNextPhase();
        }, 10000);

    };

    const bossBattlePhase4 = () => {

    };

    return () => {
        destroy(level);
    };

};