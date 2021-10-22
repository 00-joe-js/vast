import buildPuter from "../puters";
import createResetPuter from "../puters/reset";

export default (player) => {

    player.spawnPoint = vec2(80, -40);

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
            ]
        }
    };

    const strip = add([
        rect(width(), 100),
        pos(width() / 3, 300),
        color(0, 255, 255),
        opacity(1),
        area({ scale: { y: 0.6, x: 1 } }),
        origin("center"),
    ]);

    action(() => {
        strip.opacity = wave(0.4, 1, time() * 25);
    });

    let alreadyTouching = false;
    let degrade = null;
    const defaultVel = player.bodyOpts.maxVel;

    let currentGravity = 0.15;


    action(() => {
        const isTouching = strip.isTouching(player);


        if (isTouching) {
            if (alreadyTouching) return;
            alreadyTouching = true;
            player.setAnim("float");
            const adjustedVel = gravity() * currentGravity;
            player.bodyOpts.maxVel = adjustedVel + 50;
            player.weight = currentGravity > 1 ? currentGravity : 1;
            degrade = setInterval(() => {
                player.bodyOpts.maxVel = player.bodyOpts.maxVel - 10;
                if (player.bodyOpts.maxVel <= adjustedVel) {
                    player.bodyOpts.maxVel = adjustedVel
                    clearInterval(degrade);
                    degrade = null;
                }
            }, 100);
        } else {
            if (!alreadyTouching) return;
            clearInterval(degrade);
            alreadyTouching = false;
            player.bodyOpts.maxVel = defaultVel;
            player.weight = 1;
        }
    });

    let lastTyped = `   gravity = ${currentGravity};`;
    const cleanupPuter = buildPuter(
        {
            getCodeBlock: () => {
                return [
                    `// This is a fate we cannot escape.`,
                    `// Like gravity, it rides everything ...`,
                    `let gravity = 1;`,
                    `if (blueZoned) {`,
                    [lastTyped],
                    `}`
                ];
            },
            onExecute: (typedCode) => {

                lastTyped = typedCode;

                window.ABEL_receiveGravity = (gravity) => {
                    if (typeof gravity !== "number") throw new Error("Gravity must be a number.");
                    currentGravity = gravity;
                };

                eval(
                    `
                        let gravity = 1;
                        ${typedCode}
                        window.ABEL_receiveGravity(gravity);
                    `
                );

            },
            player
        },
        {
            puterPos: [cellWidth * 8, cellHeight * 16.5],
            codeWindowPos: [500, 600],
            areaScaleX: 3,
            orig: "center"
        }
    );


    const levelMapString = [
        "                    ",
        "                    ",
        "                    ",
        "===                 ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                   *",
        "                    ",
        "                  ==",
        "                    ",
        "                    ",
        "       ==          ",
        "                    ",
        "                    "
    ];

    const level = addLevel(levelMapString, levelConfig);

    const cleanupResetPuter = createResetPuter(
        [cellWidth * 0, cellHeight * 2.5],
        player,
        () => {
            currentGravity = 0.15;
            lastTyped = `   gravity = ${currentGravity};`;
        }
    );

    return () => {
        destroy(level);
        cleanupResetPuter();
        cleanupPuter();
    };

};