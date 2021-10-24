import buildPuter from "../puters";
import {activateEditorAndSetContent} from "../misc/editorUtils";

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
    strip.action(() => {
        strip.opacity = wave(0.2, 0.3, time() * 10);
        camPos(player.pos);
        player.move(playerMovingDir);
    });

    const createStar = (delay = true) => {

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

    let stars = null;
    setTimeout(() => {
        stars = new Array(200).fill(null).map(() => createStar(true));
    }, 300);

    const prop = 84 / 115;
    const abelHeight = height();

    const abel = add([
        sprite("abel", { frame: 0, width: abelHeight * prop, height: abelHeight }),
        pos(0, 0),
        opacity(0.015),
        origin("center")
    ]);

    let thePuter = null;

    const abelPhases = [
        (function () {

            let numberOfExecutions = 0;
            let lastTyped = `down(100);`;
            
            let confirmedExploring = false;
            let timeNotMoving = 0;
            let notMoving = false;

            let yelledMove = false;
            let yelledMoveAgain = false;

            abel.action(() => {
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
                    if (yelledMove && timeNotMoving > 10 && timeNotMoving < 11) {
                        thePuter.trigger("ABEL_error", new Error("EXPLORE THE VASTNESS, \n\n\n\n\n\tOR DIE."));
                    }
                    if (yelledMove && timeNotMoving > 15) {
                        if (yelledMoveAgain) return;
                        yelledMoveAgain = true;
                        window.BG_MUSIC.stop();
                        setTimeout(() => {
                            const d = activateEditorAndSetContent([`// Fine.`, [""]], () => {}, [width() / 2, 200]);
                            play("computeOpen", { volume: 0.15 });
                            setTimeout(() => {
                                d.deactivate();
                                const de = activateEditorAndSetContent([`// I will show you where I am.`, [""]], () => {}, [width() / 3, 500]);
                                play("computeOpen", { volume: 0.15 });
                                setTimeout(() => {
                                    de.deactivate();
                                    window.BG_MUSIC.play();
                                    strip.color = rgb(100, 200, 200);
                                }, 3000);
                            }, 3000);
                        }, 2000);
                    }
                }
            });

            setTimeout(() => {
                confirmedExploring = true;
            }, 7000);

            return {
                getCodeBlock: () => {
                    return [
                        `// Where would you like to go, explorer?`,
                        [lastTyped],
                        confirmedExploring ? `// Yes, go wherever you like.` : ""
                    ];
                },
                onExecute: (typedCode) => {

                    numberOfExecutions++;
                    lastTyped = typedCode;

                    window.ABEL_setDir = (dir, speed) => {
                        if (speed === 0) {
                            notMoving = true;
                        } else {
                            notMoving = false;
                        }
                        if (typeof speed !== "number") speed = 100;
                        if (speed > 20000) throw new Error("YOU'LL DIE"); // event
                        switch(dir) {
                            case "down":
                                return playerMovingDir = vec2(0, speed);
                            case "up":
                                return playerMovingDir = vec2(0, -speed);
                            case "left":
                                return playerMovingDir = vec2(-speed, 0);
                            case "right":
                                return playerMovingDir = vec2(speed, 0);
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
            }
        })()
    ];

    const cleanupPuter = buildPuter({
        getCodeBlock: () => {
            return abelPhases[0].getCodeBlock();
        },
        onExecute: (typedCode) => {
            abelPhases[0].onExecute(typedCode);
        },
        onAction: (puter) => {
            if (!thePuter) thePuter = puter;
            puter.pos = vec2(player.pos.x + 50, player.pos.y);
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

    return () => {
    };

};