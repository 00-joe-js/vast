export default (player) => {

    player.spawnPoint = vec2(80, 275);

    let camFollow;
    camFollow = player.action(() => {
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
        "            ==     *",
        "     =====          ",
        "===  =====     == ==",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    "
    ];

    const level = addLevel(levelMapString, levelConfig);

    return () => {
        destroy(level);
    };

};