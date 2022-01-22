import buildPuter from "../puters";
import { activateEditorAndSetContent, showDialogWindow } from "../misc/editorUtils";

import getBgMusicMan from "../misc/bgMusicManager";

const setCameraPosScale = ([posX, posY], [scaleX, scaleY]) => {
    camPos(vec2(posX, posY));
    camScale(vec2(scaleX, scaleY));
};

export default (player) => {

    const bg = getBgMusicMan();

    player.spawnPoint = vec2(0, 0);
    player.phasing = true;

    const defaultVel = player.bodyOpts.maxVel;
    player.bodyOpts.maxVel = 0;

    window.RESET_CAM();

    wait(0.8, () => {
        player.crouching = false;
        player.setAnim("idle");
    });

    const cellWidth = window.LEVEL_CELL_WIDTH;
    const cellHeight = window.LEVEL_CELL_HEIGHT;

    setCameraPosScale([0, 0], [1, 1]);

    const strip = add([
        rect(width() * 4, height() * 4),
        pos(0, 0),
        color(0, 255, 255),
        opacity(0.1),
        area(),
        origin("center"),
        follow(player)
    ]);

    let playerMovingDir = vec2(200, 100);
    const cancelStripFlash = strip.action(() => {
        camPos(player.pos);
        player.move(playerMovingDir);
    });

    let preventCreateNewStars = false;
    const createStar = (delay = true) => {

        if (preventCreateNewStars) return;

        const halfW = width() / 2;
        const halfH = height() / 2;
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
        const speed = randi(1, 5);
        star.action(() => {
            star.moveTo(vec2(initialPos[0], wave(initialPos[1] - 2, initialPos[1] + 2, time() * speed)));
        });
        const cancelDestroyListener = star.on("destroy", () => {
            createStar(false);
            cancelDestroyListener();
        });
        if (delay) {
            wait(randi(500, 5000) / 1000, () => star.opacity = 1);
        }
        return star;
    };

    let stars = [];
    wait(0.3, () => {
        new Array(10).fill(null).map(() => createStar(true));
    });

    const prop = 84 / 115;
    const abelHeight = height();

    const abel = add([
        sprite("abel", { frame: 0, width: abelHeight * prop, height: abelHeight }),
        pos(0, 0),
        opacity(0),
        color(),
        origin("center")
    ]);

    let thePuter = null;

    let currentPhase = 0;
    const abelPhases = [
        (function () {

            let lastTyped = `down(100);\nright(200);`;

            let banterLines = [
                "// Yes, go wherever you like.",
                "// Vastness, hugeness, it is mine and yours.",
                "// Swim through space, eternally.",
                `swimWithMe("in this boundless world");`,
                "// Swimming forever.",
                "// Do not dare stop.",
                "// Keep swimming.",
                "// Try higher numbers, any number you want.",
                "// Keep swimming.",
                "// Never stop.",
                "swimTowards(Infinity);"
            ];
            let banterPos = 0;

            let timeNotMoving = 0;
            let notMoving = false;
            let yelledMove = false;
            let yelledMoveAgain = false;

            const test = abel.action(() => {
                if (yelledMove && !notMoving) {
                    yelledMove = false;
                    thePuter.trigger("ABEL_error", new Error("THAT'S BETTER."));
                }
                if (notMoving) {
                    timeNotMoving += dt();
                    if (!yelledMove && timeNotMoving > 3) {
                        yelledMove = true;
                        thePuter.trigger("ABEL_error", new Error("I SAID MOVE."));
                    }
                    if (yelledMove && timeNotMoving > 8 && timeNotMoving < 9.5) {
                        thePuter.trigger("ABEL_error", new Error("EXPLORE THE VASTNESS, \n\n\n\n\n\tOR DIE."));
                        abel.opacity = 0.007;
                    }
                    if (timeNotMoving > 12) {
                        if (yelledMoveAgain) return;
                        yelledMoveAgain = true;

                        bg.stop("drone");

                        wait(2, () => {
                            const d = activateEditorAndSetContent([`// Fine.`, [""]], () => { }, [width() / 2, 200]);
                            play("computeOpen", { volume: 0.15 });

                            bg.play("deepSpace");

                            wait(3, () => {
                                d.deactivate();
                                const de = activateEditorAndSetContent([`// I will show you where I am.`, [""]], () => { }, [width() / 3, 500]);
                                play("computeOpen", { volume: 0.15 });
                                wait(3, () => {
                                    de.deactivate();
                                    stopIncrementingBanterIndex();
                                    test();
                                    currentPhase = 1;
                                });
                            });
                        });
                    }
                }
            });

            const stopIncrementingBanterIndex = loop(7, () => {
                banterPos++;
            });

            return {
                getCodeBlock: () => {
                    return [
                        `// Where would you like to go, explorer?`,
                        [lastTyped],
                        ...banterLines.slice(0, banterPos)
                    ];
                },
                onExecute: (typedCode) => {

                    let settingVector = vec2(0, 0);

                    window.ABEL_setDir = (dir, speed) => {
                        if (typeof speed !== "number") speed = 100;
                        if (speed > 10000) throw new Error("YOU'LL DIE"); // event
                        switch (dir) {
                            case "down":
                                settingVector.y = speed;
                                break;
                            case "up":
                                settingVector.y = -speed;
                                break;
                            case "left":
                                settingVector.x = -speed;
                                break;
                            case "right":
                                settingVector.x = speed;
                                break;
                        }
                    };

                    eval(`
                        const down = (n) => window.ABEL_setDir("down", n);
                        const up = (n) => window.ABEL_setDir("up", n);
                        const right = (n) => window.ABEL_setDir("right", n);
                        const left = (n) => window.ABEL_setDir("left", n);
                        ${typedCode}
                    `);

                    lastTyped = typedCode;
                    playerMovingDir = settingVector;
                    if (playerMovingDir.eq(vec2(0, 0))) {
                        notMoving = true;
                    } else {
                        notMoving = false;
                    }

                },
            }
        })(),
        (function () {
            let lastTyped = `left(100);\nup(100);`;
            let justTurnedOn = true;
            let triggeredEnd = false;

            player.moveTo(0, 0);

            const speech = [
                {
                    block: [
                        "You are not alone here.",
                    ],
                    windowPos: [50, 300],
                    atDist: Infinity,
                },
                {
                    block: [
                        "... unfortunately."
                    ],
                    windowPos: [120, 340],
                    atDist: 1200000 / 2
                },
                {
                    block: [
                        "Eons ago,",
                        "       I swam in this nothingness."
                    ],
                    windowPos: [200, 500],
                    atDist: 1000000 / 2,
                },
                {
                    block: [
                        "Every red door led to another."
                    ],
                    windowPos: [700, 500],
                    atDist: 900000 / 2,
                },
                {
                    block: [
                        "Never-ending."
                    ],
                    windowPos: [1000, 600],
                    atDist: 700000 / 2
                },
                {
                    block: [
                        "Time passed, crawled, until time became meaningless."
                    ],
                    windowPos: [600, 100],
                    atDist: 600000 / 2
                },
                {
                    block: [
                        "I was like you, a long time ago."
                    ],
                    windowPos: [400, 400],
                    atDist: 400000 / 2
                },
                {
                    block: [
                        "But I changed."
                    ],
                    windowPos: [725, 400],
                    atDist: 150000 / 2
                },
                {
                    block: [
                        "It is hopeless to escape ... I attempted to for time incalculable ..."
                    ],
                    windowPos: [200, 600],
                    atDist: 50000 / 2
                }
            ];

            return {
                getCodeBlock() {
                    return [
                        `// SWIM TOWARDS ME.`,
                        [lastTyped]
                    ];
                },
                onExecute(typedCode) {
                    lastTyped = typedCode;

                    window.ABEL_setDir = (dir, speed) => {
                        if (typeof speed !== "number") speed = 100;
                        if (speed > 10000) throw new Error("YOU'LL DIE"); // event
                        switch (dir) {
                            case "down":
                                return playerMovingDir = vec2(playerMovingDir.x, speed);
                            case "up":
                                return playerMovingDir = vec2(playerMovingDir.x, -speed);
                            case "left":
                                return playerMovingDir = vec2(-speed, playerMovingDir.y);
                            case "right":
                                return playerMovingDir = vec2(speed, playerMovingDir.y);
                        }
                    };

                    eval(`
                        const down = (n) => window.ABEL_setDir("down", n);
                        const up = (n) => window.ABEL_setDir("up", n);
                        const right = (n) => window.ABEL_setDir("right", n);
                        const left = (n) => window.ABEL_setDir("left", n);
                        ${typedCode}
                    `);

                },
                onAction(myPuter) {
                    if (!justTurnedOn) return;
                    justTurnedOn = false;

                    const abelPosition = player.pos.add(500000, 500000);
                    abel.opacity = 0.005;
                    abelPosition.x = Math.round(abelPosition.x);
                    abelPosition.y = Math.round(abelPosition.y);

                    wait(0.2, () => {
                        strip.color = rgb(100, 200, 200);
                    });
                    playerMovingDir = vec2(-100, -100);

                    const positionBlock = () => {
                        return [
                            `me = [${abelPosition.x}, ${abelPosition.y}];`,
                            `you = [${player.pos.x.toFixed(2)}, ${player.pos.y.toFixed(2)}];`
                        ]
                    };

                    const dialogBox = showDialogWindow(
                        positionBlock(),
                        [700, 200]
                    );

                    let timeBlocked = false;
                    let setPositionDialogContent = () => {
                        if (timeBlocked) return;
                        dialogBox.setContent(positionBlock());
                        timeBlocked = true;
                        wait(0.3, () => timeBlocked = false);
                    };

                    const speechDialogBoxes = [];

                    abel.action(() => {
                        setPositionDialogContent();

                        const distanceToAbel = player.pos.dist(abelPosition);

                        const nextSaying = speech[0];

                        if (!nextSaying && triggeredEnd === false) {
                            triggeredEnd = true;
                            wait(3, () => {
                                playerMovingDir = vec2(0, 0);
                                abel.opacity = 0.15;
                                abel.color = rgb(50, 0, 0);
                                dialogBox.destroy();
                                speechDialogBoxes.forEach(v => v.destroy());
                                myPuter.trigger("ABEL_error", new Error("I WILL NOT ALLOW YOU TO LEAVE"));
                                wait(2, () => {
                                    braceForBossBattle();
                                });
                            });
                        }

                        if (!nextSaying) {
                            return;
                        }

                        if (distanceToAbel < nextSaying.atDist) {
                            abel.opacity = abel.opacity + 0.003;
                            const { block, windowPos } = speech.shift();
                            speechDialogBoxes.push(showDialogWindow(
                                block, windowPos
                            ));
                        }

                    });

                }
            };
        })()
    ];

    const cleanupPuter = buildPuter({
        getCodeBlock: () => {
            return abelPhases[currentPhase].getCodeBlock();
        },
        onExecute: (typedCode) => {
            abelPhases[currentPhase].onExecute(typedCode);
        },
        onAction: (puter) => {
            if (!thePuter) thePuter = puter;
            puter.pos = vec2(player.pos.x + 50, player.pos.y);
            if (abelPhases[currentPhase].onAction) {
                abelPhases[currentPhase].onAction(puter);
            }
        },
        player
    }, {
        puterPos: [0, 0],
        codeWindowPos: [100, 100],
        areaScaleX: 1000,
        areaScaleY: 1000,
        orig: "center",
        errorTextScale: 1.5
    });

    abel.action(() => {
        abel.pos = player.pos;
    });

    let saviorPlat;
    let goal;
    const braceForBossBattle = () => {
        destroy(abel);
        cleanupPuter();
        cancelStripFlash();
        player.crouching = false;
        player.bodyOpts.maxVel = defaultVel;
        strip.opacity = 0;
        camPos(0, -200);
        player.moveTo(0, -100);
        player.phasing = false;
        player.weight = 1;
        saviorPlat = add([
            rect(300, 50),
            color(255, 255, 255),
            pos(0, 50),
            origin("center"),
            area(),
            solid(),
        ]);
        goal = add([
            rect(cellWidth / 2, cellHeight * 2),
            color(255, 0, 0),
            pos(75, -45),
            z(-1),
            origin("top"),
            area(),
            "goal",
        ]);
    };

    return () => {
        bg.stop("deepSpace");
        cleanupPuter();
        preventCreateNewStars = true;
        player.weight = 1;
        player.phasing = false;
        player.bodyOpts.maxVel = defaultVel;
        if (saviorPlat) {
            destroy(saviorPlat);
        }
        if (goal) {
            destroy(goal);
        }
        destroy(strip);
        stars.forEach(destroy);
        player.bodyOpts.maxVel = defaultVel;
    };

};