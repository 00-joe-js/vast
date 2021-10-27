import buildPuter from "../puters";
import createResetPuter from "../puters/reset";

export default (player) => {

    player.spawnPoint = vec2(140, 0);
    window.RESET_CAM();

    const cellWidth = window.LEVEL_CELL_WIDTH;
    const cellHeight = window.LEVEL_CELL_HEIGHT;

    const getDefaultPlatSpeed = (i) => i === 0 ? 200 : rand(2000, 4000);

    const platformRailXValues = [300, 600, 900];

    const rails = platformRailXValues.map((x) => {
        return add([
            rect(2, 10000),
            pos(x, 0)
        ]);
    });

    const railedPlats = platformRailXValues.map((x, i) => {
        const plat = add([
            rect(200, 10),
            origin("center"),
            area(),
            solid(),
            z(2),
            pos(x, randi(0, height())),
            "movingPlat",
            {
                speed: getDefaultPlatSpeed(i)
            }
        ]);
        action(() => {
            plat.moveTo(vec2(x, -40), plat.speed);
            if (plat.pos.y < -30) {
                plat.moveTo(x, height());
            }
        });
        return plat;
    });

    const getSpeedObjs = () => {
        return railedPlats.map(plat => `{ speed: ${plat.speed} }`).join(", ");
    };

    let lastTyped = "";
    const cleanupPuter = buildPuter(
        {
            getCodeBlock: () => {
                return [
                    "// I see ... you know a bit about this.",
                    `const platforms = [${getSpeedObjs()}];`,
                    [lastTyped],
                    `// ctrl+enter for new line`
                ];
            },
            onExecute: (typedCode) => {

                lastTyped = typedCode;

                window.ABEL_READ_PLATS = (objs) => {
                    objs.forEach((platObj, i) => {
                        if (typeof platObj.speed !== "number") {
                            throw new Error(`Platform ${i + 1} missing speed value.`);
                        }
                    });
                    objs.forEach((platObj, i) => {
                        railedPlats[i].speed = platObj.speed;
                    });
                }

                eval(`
                    const platforms = [${getSpeedObjs()}];
                    ${typedCode}
                    window.ABEL_READ_PLATS(platforms);
                `);

            },
            player
        },
        {
            puterPos: [cellWidth * 0, cellHeight * 16.5],
            areaScaleX: 3,
            codeWindowPos: [100, 500]
        }
    );

    const cleanupResetPuter = createResetPuter(
        [cellWidth * 0, cellHeight * 5.5],
        player,
        () => {
            lastTyped = "";
            railedPlats.forEach((plat, i) => {
                plat.speed = getDefaultPlatSpeed(i);
            });
        }
    );   

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

    const levelMapString = [
        "                    ",
        "                    ",
        "                    ",
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
        "                   *",
        "                    ",
        "                  ==",
        "                    ",
        "=                   ",
        "                    ",
        "                    "
    ];

    const level = addLevel(levelMapString, levelConfig);

    const initialJumpForce = player.jumpForce;
    railedPlats[0].action(() => {
        const curr = player.curPlatform();
        if (curr?.is("movingPlat")) {
            if (curr.speed >= 2000) {
                player.jumpForce = -20;
            }
            player.moveTo(vec2(player.pos.x, -10), curr.speed + 10);
        } else {
            player.jumpForce = initialJumpForce;
        }
    });

    return () => {
        destroy(level);
        cleanupPuter();
        cleanupResetPuter();
        railedPlats.forEach(destroy);
        rails.forEach(destroy);
    };

};