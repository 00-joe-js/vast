import buildPuter from "../puters";
import { showDialogWindow } from "../misc/editorUtils";

import loadWinLevel from "./winLevel";

export default (player) => {

    window.BG_MUSIC.play();
    player.spawnPoint = vec2(100, 275);

    camScale(1, 1);

    let turnoffCamFollow = player.action(() => {
        camPos(player.pos);
    });

    const cellWidth = window.LEVEL_CELL_WIDTH;
    const cellHeight = window.LEVEL_CELL_HEIGHT;

    let bossMusic = null;
    let currentPhaseUnload = null;
    let unloads = [];

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
    const level = addLevel(levelMapString, levelConfig);

    const bossPlat = add([
        rect(1800, cellHeight / 2),
        solid(),
        area(),
        pos(1100, 500),
        "bossPlat"
    ]);

    let elevatorSpeed = 0;

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
            rect(350, height() * 8),
            color(255, 255, 255),
            pos(750, -1000),
            area(),
            solid()
        ]);
        const rightWall = add([
            rect(350, height() * 8),
            color(255, 255, 255),
            pos(2900, -1000),
            area(),
            solid()
        ])
        return [leftWall, rightWall];
    };
    let walls;

    let noEscapePuter = null;
    const cleanStartPuter = buildPuter({
        getCodeBlock() {
            return [
                ["const noEscape = true;"]
            ];
        },
        onExecute(typedCode) {
            let answer = true;
            window.ABEL_noEscape = (theirAnswer) => {
                answer = theirAnswer;
            };
            eval(`
                ${typedCode}
                window.ABEL_noEscape(noEscape);
            `);
            if (answer !== false) return;
            let scale = 1;
            let tilt = player.pos.y;
            const destTilt = tilt - 500;
            destroy(level);
            turnoffCamFollow();
            const timers = [];
            walls = createElevatorWalls();
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
                    timers.push(setTimeout(() => {
                        shake(10);
                        elevatorSpeed = 1000;
                        play("elevator", { volume: 0.1 });
                    }, 2000));
                    timers.push(setTimeout(() => {
                        startBoss();
                    }, 7000));
                }
                camScale(scale, scale);
                camPos(2000, tilt);
            }, 5);
            unloads.push(() => {
                timers.forEach(clearTimeout);
                destroy(walls);
                clearInterval(camZoomOut);
            });
        },
        onAction(p) {
            // To be used to display error message when Abel arrives.
            if (!noEscapePuter) noEscapePuter = p;
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

    let phase1Puter = { puter: null, clean: null };
    let phase2Puter = { puter: null, clean: null };
    let phase3Puter = { puter: null, clean: null };

    let phase1Output = add([
        text("0", { font: "sink", size: 72 }),
        pos(1500, 600),
        color(255, 0, 0),
        origin('center'),
        opacity(0),
    ]);
    let phase2Output = add([
        text("0", { font: "sink", size: 72 }),
        pos(2000, 600),
        color(255, 0, 0),
        origin('center'),
        opacity(0),
    ]);
    let phase3Output = add([
        text("0", { font: "sink", size: 72 }),
        pos(2510, 600),
        color(255, 0, 0),
        origin('center'),
        opacity(0),
    ]);
    let phaseTrueAnswers = [null, null, null];

    const startBoss = () => {

        player.spawnPoint = vec2(1950, 275);
        player.bossFight = true;
        noEscapePuter.trigger("ABEL_error", new Error("NO"));
        window.BG_MUSIC.stop();
        shake(100);
        elevatorSpeed = 0;
        abel.pos = vec2(2000, 475 - 500);
        abel.color = rgb(255, 0, 0);

        cleanStartPuter();

        const timers = [];

        timers.push(setTimeout(() => {
            play("scream", { volume: 0.05 });
        }, 2000));

        timers.push(setTimeout(() => {
            const { destroy } = showDialogWindow(["I will not be left alone."], [550, 350]);
            timers.push(setTimeout(() => {
                destroy();
                bossMusic = play("bossMusic", { volume: 0.1, loop: true });
                phase1Output.opacity = 1;
                phase2Output.opacity = 1;
                phase3Output.opacity = 1;
                bossBattlePhase4();
                abel.color = rgb(0, 0, 0);
            }, 4000));
        }, 3000));

        let puter1LastTyped = `bar.color = "white";`;
        phase1Puter.clean = buildPuter({
            getCodeBlock() {
                return [
                    "// A mesh in the universe.",
                    [puter1LastTyped],
                    "if (bar.touches(star) && bar.color === star.color) {",
                    `   destroy(star);`,
                    "}"
                ];
            },
            onExecute(typedCode) {
                puter1LastTyped = typedCode;
                window.ABEL_receiveBarColor = (color) => {
                    if (!color) barColor = "white";
                    barColor = color;
                };
                eval(
                    `
                        const bar = {};
                        bar.color = "white";
                        ${typedCode}
                        window.ABEL_receiveBarColor(bar.color);
                    `
                );
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

        let puter3LastTyped = `const x = 0;`
        phase3Puter.clean = buildPuter({
            getCodeBlock() {
                return [
                    "// The universe is staggering.",
                    "for (let i = 0; i < 7; i++) {",
                    [puter3LastTyped],
                    "const y = i * 100;",
                    `   spawnPlatform(`,
                    `      x`,
                    `      y`,
                    `   );`,
                    "}",
                ];
            },
            onExecute(typedCode) {
                puter3LastTyped = typedCode;
                window.ABEL_setStaggeredPlatforms = (i, startX) => {
                    platStartPositions[i] = startX;
                };
                eval(`
                    for (let i = 0; i < 7; i++) {
                        ${typedCode}
                        window.ABEL_setStaggeredPlatforms(i, x);
                    }
                `);
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

    let barColor = "white";
    const bossBattlePhase1 = () => {

        const bar = add([
            rect(1800, 2),
            pos(1100, 0),
            opacity(0.7),
            color(255, 255, 255),
            area({ height: 20 }),
            z(5),
        ]);

        // This is a fallback win condition.
        let barAlwaysRed = true;

        bar.action(() => {
            const t = time();
            bar.opacity = wave(0.2, 0.9, t * 100);
            if (barColor === "red") {
                bar.color = rgb(255, 0, 0);
            } else {
                bar.color = rgb(255, 255, 255);
            }
            if (barAlwaysRed === true && barColor !== "red") {
                barAlwaysRed = false;
            }
        });

        phaseTrueAnswers[0] = 0;
        const randomBlocks = new Array(randi(150, 250)).fill(null).map(() => {
            const isRed = chance(0.5);
            if (isRed) phaseTrueAnswers[0] = phaseTrueAnswers[0] + 1;

            const block = add([
                circle(3),
                color(isRed ? [255, 0, 0] : [255, 255, 255]),
                pos(randi(1100, 1100 + 1800), -800),
                area({ width: 7, height: 7 }),
                opacity(1),
                timer(rand(0.05, 7), () => {
                    block.opacity = 1;
                    block.fall = true;
                })
            ]);
            block.action(() => {

                if (block.fall === true) {
                    block.pos.y = block.pos.y + (dt() * 750);

                    if (block.isTouching(bar)) {
                        if (barColor === "red" && isRed) {
                            block.destroy();
                            phase1Output.text = parseInt(phase1Output.text) + 1;
                        } else if (barColor === "white" && !isRed) {
                            block.destroy();
                        }
                    }

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

        const plannedTransition = setTimeout(() => {
            transitionToNextPhase();
        }, 10000);

        const unload = () => {
            clearTimeout(plannedTransition);
            bar.destroy();
            randomBlocks.forEach(destroy);
        };

        const transitionToNextPhase = () => {
            // This is to avoid some weird focus issues.
            // If the bar is red the whole phase, they auto win 
            // by changing the phase's true answer (amount of redstars)
            // to be whatever the computer picked up
            if (barAlwaysRed) {
                phaseTrueAnswers[0] = parseInt(phase1Output.text);
            }
            unload();
            bossBattlePhase2();
        };

        currentPhaseUnload = unload;

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

        const howMany = randi(100, 300);
        phaseTrueAnswers[1] = howMany;
        const randomBlocks = new Array(howMany).fill(null).map(() => {
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
                    block.moveTo(blackHole.pos.x, blackHole.pos.y, 700);
                    return;
                }
                if (block.isTouching(blackHole)) {
                    touchingBlackHole = true;
                    setTimeout(() => {
                        phase2Output.text = parseInt(phase2Output.text) + 1;
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

        const plannedTransition = setTimeout(() => {
            transitionToNextPhase();
        }, 11000);

        const unload = () => {
            clearTimeout(plannedTransition);
            blackHole.destroy();
            randomBlocks.forEach(destroy);
        };

        const transitionToNextPhase = () => {
            unload();
            bossBattlePhase3();
        };

        currentPhaseUnload = unload;

    };

    let platStartPositions = [
        0, 0, 0, 0, 0, 0, 0
    ];
    const bossBattlePhase3 = () => {


        phaseTrueAnswers[2] = 7;
        const leftX = 1100;
        const topY = -700;

        const platConfigs = new Array(7).fill(null).map((_, i) => {
            return {
                width: 300, height: 10, x: leftX + platStartPositions[i], y: topY + 500 + (i * 100)
            }
        });

        const landedPlats = {};

        const allPlats = platConfigs.map((config, i) => {
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
                    if (!landedPlats[i]) {
                        landedPlats[i] = true;
                        phase3Output.text = parseInt(phase3Output.text) + 1;
                    }
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
            bossBattlePhase4();
        };
        setTimeout(() => {
            transitionToNextPhase();
        }, 15000);

    };

    const bossBattlePhase4 = () => {

        const phaseAnswersFound = [
            parseInt(phase1Output.text),
            parseInt(phase2Output.text),
            parseInt(phase3Output.text),
        ];

        abel.opacity = 0.1;
        abel.color = rgb(255, 255, 255);

        let successCount = 0;
        const setSuceed = (theText) => {
            theText.color = rgb(0, 255, 0);
            play("computeExecute", { volume: 0.1 });
            successCount = successCount + 1;
        };
        const setFail = (theText) => {
            theText.color = rgb(10, 10, 10);
            play("computeError", { volume: 0.1 });
        };
        const reset = (theText) => {
            theText.color = rgb(255, 0, 0);
            theText.text = 0;
        };

        const checkAnswer = (whichPhase) => {
            return true;
            return phaseAnswersFound[whichPhase] === phaseTrueAnswers[whichPhase];
        };

        const timers = [];

        timers.push(setTimeout(() => {
            if (checkAnswer(0)) {
                setSuceed(phase1Output);
            } else {
                setFail(phase1Output);
            }
        }, 2000));

        timers.push(setTimeout(() => {
            if (checkAnswer(1)) {
                setSuceed(phase2Output);
            } else {
                setFail(phase2Output);
            }
        }, 3500));

        timers.push(setTimeout(() => {
            if (checkAnswer(2)) {
                setSuceed(phase3Output);
            } else {
                setFail(phase3Output);
            }
        }, 5000));

        timers.push(setTimeout(() => {
            if (successCount === 3) {
                win();
            } else {
                reset(phase1Output);
                reset(phase2Output);
                reset(phase3Output);
                abel.opacity = 0.05;
                abel.color = rgb(10, 10, 10);
                bossBattlePhase1();
            }
        }, 6500));

        currentPhaseUnload = () => {
            timers.forEach(clearTimeout);
        };

    };

    const cleanupBossLevel = () => {
        destroy(level);
        destroy(bossPlat);
        destroy(abel);
        cleanStartPuter();
        walls.forEach(destroy);
        stars.forEach(destroy);
        destroy(phase1Output);
        destroy(phase2Output);
        destroy(phase3Output);
        if (typeof currentPhaseUnload === "function") {
            currentPhaseUnload();
        }
        turnoffCamFollow();
        if (phase1Puter.clean) phase1Puter.clean();
        if (phase2Puter.clean) phase2Puter.clean();
        if (phase3Puter.clean) phase3Puter.clean();
    };

    const win = () => {
        bossMusic.stop();
        setTimeout(() => {
            window.BG_MUSIC.play();
            elevatorSpeed = 1000;
            shake(10);
            play("elevator", { volume: 0.1 });
            const fadingAbel = setInterval(() => {
                abel.opacity = abel.opacity - 0.025;
                if (abel.opacity <= 0) {
                    clearInterval(fadingAbel);
                }
            }, 300);
            setTimeout(() => {
                const camDest = camPos().y + 1500;
                const moveCam = setInterval(() => {
                    camPos(camPos().x, camPos().y + (dt() * 500));
                    if (camPos().y >= camDest) {
                        clearInterval(moveCam);
                    }
                }, 20);
                setTimeout(() => {
                    cleanupBossLevel();
                    loadWinLevel(player);
                }, 5000);
            }, 5000);
        }, 1000);
    };

    return cleanupBossLevel;

};