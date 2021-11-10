import { showDialogWindow } from "../misc/editorUtils";
import getBgMusicMan from "../misc/bgMusicManager";
import buildPuter from "../puters"

const delay = (n) => {
    return new Promise((r) => {
        wait(n / 1000, r);
    });
};

const abelSay = (content, pos, destroyAfter = null) => {
    const { destroy } = showDialogWindow(
        content, pos
    );
    if (destroyAfter) {
        wait(destroyAfter / 1000, () => {
            destroy();
        });
    }
    return destroy;
};

const buildScript = () => {

    const start = async () => {
        await delay(5000);
        abelSay(["You are an insignificant speck."],
            [600, 300], 5000);
        await delay(8000);
        abelSay([
            ["this is the weight of the universe."],
            ["                          ... of everything AGAINST YOU"]
        ], [600, 500], 6000);
        await delay(3000);
        abelSay([
            "HOPELESS"
        ], [50, 500], 10000);
        await delay(2000);
        abelSay([
            "AFRAID"
        ], [200, 200], 8000);
        await delay(500);
        abelSay([
            "SMALL"
        ], [1000, 600], 7500);
        await delay(3000);
    };

    return {
        start
    }; //script runner;
};

export default (player) => {

    player.bossFight = true;
    camScale(1, 1);
    camPos(600, 360);

    player.spawnPoint = vec2(80, height() + 75);
    player.spawnPlayer();

    const bg = getBgMusicMan();
    bg.stop("drone");

    bg.play("endMusic");

    wait((2 * 60 + 2), () => {
        bg.play("deepSpace");
    });

    const stars = new Array(150).fill(null).map(() => {
        const initialPos = [randi(width() * 2 * -1, width() * 2), randi(height() * 2 * -1, height() * 2)];
        const speed = randi(1, 5);
        const star = add([
            circle(1.2),
            color(255, 255, 255),
            pos(...initialPos),
            z(-1),
            {
                speed,
                initialPos
            }
        ]);
        return star;
    });

    const cellWidth = window.LEVEL_CELL_WIDTH;
    const cellHeight = window.LEVEL_CELL_HEIGHT;

    const floor = add([
        rect(width() * 4, cellHeight),
        solid(),
        area(),
        origin("center"),
        pos(camPos().x, height() + 100)
    ]);

    const elevatorMovingDone = floor.action(() => {
        const h = height();
        if (floor.pos.y === h) {
            elevatorMovingDone();
            return;
        }
        floor.pos.y = floor.pos.y - (dt() * 70);
        if (floor.pos.y < h) {
            floor.pos.y = h;
        }
    });

    const zoomOut = (speed = 0.075, targetScale) => {
        const endZoom = floor.action(() => {
            let newCamScale = camScale().x - (dt() * speed);
            newCamScale = Math.max(targetScale, newCamScale);
            camScale(newCamScale, newCamScale);
            if (newCamScale === targetScale) {
                endZoom();
            }
        });
    };
    const zoomIn = () => {
        const targetScale = 1;
        const endZoom = floor.action(() => {
            let newCamScale = camScale().x + (dt() * 0.7);
            newCamScale = Math.min(targetScale, newCamScale);
            camScale(newCamScale, newCamScale);
            if (newCamScale === targetScale) {
                endZoom();
            }
        });
    };
    const walls = [add([
        rect(10, height() * 8),
        area(),
        solid(),
        pos(camPos().x - width() / 2 - 10, 0),
        opacity(0),
    ]), add([
        rect(10, height() * 8),
        area(),
        solid(),
        pos(camPos().x + width() / 2 + 10, 0),
        opacity(0),
    ])];

    const script = buildScript();
    let destroyLastMessage;
    script.start().then(() => {
        destroyLastMessage = abelSay([
            `I told you 
        
                 there is no escape.`
        ], [600, 100]);
    });

    const whiteFlash = add([
        rect(width() * 1000, height() * 1000),
        color(255, 255, 255),
        opacity(0),
        pos(camPos()),
        origin("center"),
        z(10000),
        {
            flash() {
                whiteFlash.action(() => {
                    whiteFlash.opacity = whiteFlash.opacity + (dt() * 4);
                });
            }
        }
    ]);

    wait(7, () => zoomOut(undefined, 0.05));
    wait(22, () => zoomIn());

    let destroyBigPuter = null;
    wait(20, () => {
        destroyBigPuter = buildPuter({
            getCodeBlock() {
                return [
                    ["const mySize = 16;"],
                    "// trees bend and creak as i walk",
                    "// though i was made small",
                    "// i feel huge."
                ];
            },
            onExecute(typedCode) {
                window.ABEL_insult = () => {
                    throw new Error(
                        choose(["WEAK", "PUNY", "SMALL", "FAILURE", "HOPELESS", "ALONE", "DIE"])
                    );
                };
                window.ME_growHuge = () => {
                    player.growing = true;
                    const timeStart = time();
                    const camPosYStart = camPos().y;
                    player.action(() => {
                        const since = Math.abs(time() - timeStart)
                        const newScale = (since / 500) * 100000;
                        player.scaleTo(Math.max(1, newScale));
                        const cam = camPos();
                        camPos(cam.x, cam.y + (since * 100) * -1);
                    });
                    zoomOut(0.3, 0.01);
                    wait(3, () => {
                        destroyLastMessage();
                        whiteFlash.flash();
                    });
                    wait(7, () => {
                        hasEnded();
                    });
                };
                eval(
                    `
                        ${typedCode}
                        if (mySize === Infinity) {
                            window.ME_growHuge();
                        } else {
                            window.ABEL_insult();
                        }
                    `
                );
            },
            player
        }, {
            puterPos: [600, height() - 25],
            codeWindowPos: [0, 0],
            errorTextScale: 2.5,
            getErrorTextPos() {
                return [randi(50, 1100), randi(25, height() - 200)];
            }
        });
    });

    const cleanupLevel = () => {
        stars.forEach(destroy);
        walls.forEach(destroy);
        destroy(whiteFlash);
        if (destroyBigPuter) {
            destroyBigPuter();
        }
        if (destroyLastMessage) {
            destroyLastMessage();
        }
    };

    const hasEnded = () => {
        cleanupLevel();
        canvas.style.display = "none";
        document.querySelector("#credits-card").style.display = "block";
    };

    return () => {
        destroy(level);
    };

};