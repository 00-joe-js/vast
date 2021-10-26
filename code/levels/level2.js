import buildPuter from "../puters";

export default (player) => {

    player.spawnPoint = vec2(80, 275);
    window.RESET_CAM();

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

    const levelMapString = [
        "                    ",
        "                    ",
        "                    ",
        "     =====          ",
        "                    ",
        "                    ",
        "                    ",
        "            =       ",
        "                    ",
        "===                 ",
        "                    ",
        "     =====          ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                   *",
        "                    ",
        "                  ==",
        "                    "
    ];

    const level = addLevel(levelMapString, levelConfig);

    const INITIAL_PLATFORM_TEXT = "hello world";
    const textObj = add([
        pos(cellWidth * 9.5, cellHeight * 14),
        text(INITIAL_PLATFORM_TEXT, { font: "sink", size: 30 }),
        solid(),
        area()
    ]);

    let lastTypedCode = `const platformMessage = "${INITIAL_PLATFORM_TEXT}";`;

    const cleanupPuter = buildPuter(
        {
            player,
            getCodeBlock: () => {
                return [
                    "// Hello. :)",
                    [lastTypedCode],
                    "makePlatform(platformMessage);"
                ];
            },
            onExecute: (typedCode) => {

                lastTypedCode = typedCode;

                window.ABEL_MAKEPLAT = (name) => {
                    if (typeof name !== "string") throw new Error("platformMessage must be a string.");
                    textObj.text = name;
                };

                eval(`
                    const makePlatform = (s) => { window.ABEL_MAKEPLAT(s); };
                    ${typedCode}
                    makePlatform(platformMessage);
                `);

            }
        },
        {
            puterPos: [cellWidth * 5, cellHeight * 2.5],
            areaScaleX: 3,
            codeWindowPos: [300, 500]
        }
    );


    return () => {
        destroy(level);
        destroy(textObj);
        cleanupPuter();
    };

};