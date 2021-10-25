import buildPuter from "../puters";
import { activateEditorAndSetContent, showDialogWindow } from "../misc/editorUtils";

const setCameraPosScale = ([posX, posY], [scaleX, scaleY]) => {
    camPos(vec2(posX, posY));
    camScale(vec2(scaleX, scaleY));
};

export default (player) => {

    player.spawnPoint = vec2(0, 0);
    player.phasing = true;

    setTimeout(() => {
        player.crouching = false;
        player.setAnim("idle");
    }, 800);

    const cellWidth = window.LEVEL_CELL_WIDTH;
    const cellHeight = window.LEVEL_CELL_HEIGHT;

    setCameraPosScale([0, 0], [1, 1]);

    player.weight = 0;

    const strip = add([
        rect(width() * 4, height() * 4),
        pos(0, 0),
        color(0, 255, 255),
        opacity(0.2),
        area(),
        origin("center"),
        follow(player)
    ]);

    let playerMovingDir = vec2(0, 100);
    const cancelStripFlash = strip.action(() => {
        strip.opacity = wave(0.2, 0.3, time() * 10);
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
            setTimeout(() => {
                star.opacity = 1;
            }, randi(500, 5000));
        }
        return star;
    };

    let stars = [];
    setTimeout(() => {
        new Array(70).fill(null).map(() => createStar(true));
    }, 300);

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

            let lastTyped = `down(100);`;

            let banterLines = [
                "// Yes, go wherever you like.",
                "// Vastness, hugeness, it is mine and yours.",
                "// Swim through space, eternally.",
                `swimWithMe("in this boundless world");`,
                "// Swimming forever.",
                "// #KAJAM2021",
                "// Do not dare stop."
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
                    if (!yelledMove && timeNotMoving > 5) {
                        yelledMove = true;
                        thePuter.trigger("ABEL_error", new Error("I SAID MOVE."));
                    }
                    if (yelledMove && timeNotMoving > 10 && timeNotMoving < 11) {
                        thePuter.trigger("ABEL_error", new Error("EXPLORE THE VASTNESS, \n\n\n\n\n\tOR DIE."));
                        abel.opacity = 0.013;
                    }
                    if (timeNotMoving > 15) {
                        if (yelledMoveAgain) return;
                        yelledMoveAgain = true;
                        window.BG_MUSIC.stop();
                        setTimeout(() => {
                            const d = activateEditorAndSetContent([`// Fine.`, [""]], () => { }, [width() / 2, 200]);
                            play("computeOpen", { volume: 0.15 });
                            setTimeout(() => {
                                d.deactivate();
                                const de = activateEditorAndSetContent([`// I will show you where I am.`, [""]], () => { }, [width() / 3, 500]);
                                play("computeOpen", { volume: 0.15 });
                                setTimeout(() => {
                                    de.deactivate();
                                    clearInterval(banterInterval);
                                    test();
                                    currentPhase = 1;
                                }, 3000);
                            }, 3000);
                        }, 2000);
                    }
                }
            });

            const banterInterval = setInterval(() => {
                banterPos++;
            }, 7000);

            return {
                getCodeBlock: () => {
                    return [
                        `// Where would you like to go, explorer?`,
                        [lastTyped],
                        ...banterLines.slice(0, banterPos)
                    ];
                },
                onExecute: (typedCode) => {

                    lastTyped = typedCode;
                    let settingVector = vec2(0, 0);

                    window.ABEL_setDir = (dir, speed) => {

                        if (typeof speed !== "number") speed = 100;
                        if (speed > 20000) throw new Error("YOU'LL DIE"); // event
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
                    atDist: 1200000
                },
                {
                    block: [
                        "Eons ago,",
                        "       I swam in this nothingness."
                    ],
                    windowPos: [200, 500],
                    atDist: 1000000,
                },
                {
                    block: [
                        "Every red door led to another."
                    ],
                    windowPos: [700, 500],
                    atDist: 900000,
                },
                {
                    block: [
                        "Never-ending."
                    ],
                    windowPos: [1000, 600],
                    atDist: 700000
                },
                {
                    block: [
                        "Time passed, crawled, until time became meaningless."
                    ],
                    windowPos: [600, 100],
                    atDist: 600000
                },
                {
                    block: [
                        "I was like you, a long time ago."
                    ],
                    windowPos: [400, 400],
                    atDist: 400000
                },
                {
                    block: [
                        "But I changed."
                    ],
                    windowPos: [725, 400],
                    atDist: 150000
                },
                {
                    block: [
                        "It is hopeless to escape ... I attempted to for time incalculable ..."
                    ],
                    windowPos: [200, 600],
                    atDist: 50000
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
                        if (speed > 20000) throw new Error("YOU'LL DIE"); // event
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

                    const abelPosition = player.pos.add(1000000, 1000000);
                    abel.opacity = 0.005;
                    abelPosition.x = Math.round(abelPosition.x);
                    abelPosition.y = Math.round(abelPosition.y);

                    setTimeout(() => {
                        strip.color = rgb(100, 200, 200);
                        window.BG_MUSIC.play();
                    }, 200);
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
                        setTimeout(() => timeBlocked = false, 300);
                    };

                    const speechDialogBoxes = [];

                    abel.action(() => {
                        setPositionDialogContent();

                        const distanceToAbel = player.pos.dist(abelPosition);

                        const nextSaying = speech[0];

                        if (!nextSaying && triggeredEnd === false) {
                            triggeredEnd = true;
                            setTimeout(() => {
                                playerMovingDir = vec2(0, 0);
                                abel.opacity = 0.15;
                                abel.color = rgb(50, 0, 0);
                                dialogBox.destroy();
                                speechDialogBoxes.forEach(v => v.destroy());
                                myPuter.trigger("ABEL_error", new Error("I WILL NOT ALLOW YOU TO LEAVE"));
                                setTimeout(() => {
                                    braceForBossBattle();
                                }, 3000);
                            }, 3000);
                        }

                        if (!nextSaying) {
                            return;
                        }

                        if (distanceToAbel < nextSaying.atDist) {
                            abel.opacity = abel.opacity + 0.005;
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
        preventCreateNewStars = true;
        destroy(saviorPlat);
        destroy(goal);
        destroy(strip);
        stars.forEach(destroy);
    };

};