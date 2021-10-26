import buildPuter from "../puters";
import shuffle from "shuffle-array";

export default (player) => {

    player.spawnPoint = vec2(80, 0);
    window.RESET_CAM();

    const zoomingOut = setTimeout(() => {
        camScale(vec2(0.5, 0.5));
        camPos(vec2(width(), height()));
    }, 1500);

    const cellWidth = window.LEVEL_CELL_WIDTH;
    const cellHeight = window.LEVEL_CELL_HEIGHT;

    const grid = [];
    const through = height() * 2;
    const across = width() * 2;

    const firstRow = [];
    for (let col = 0; col < across; col = col + cellWidth) {
        firstRow.push(add([
            pos(col, cellHeight * 2),
            rect(cellWidth / 1.2, cellHeight / 2),
            color(),
            solid(),
            area(),
            opacity(1)
        ]));
    }

    firstRow[12].opacity = 0.1;
    firstRow[12].solid = false;

    for (let row = cellHeight * 4; row < through - (cellHeight * 4); row = row + cellHeight * 2) {
        for (let col = 0; col < across; col = col + cellWidth) {
            grid.push(add([
                pos(col, row),
                rect(cellWidth / 1.2, cellHeight / 2),
                color(),
                solid(),
                area(),
                opacity(1)
            ]));
        }
    }

    const MAX_CALCULATIONS = 350;

    let amountPlats = 30;
    let disableRate = 100;
    const runCalculations = () => {
        return setInterval(() => {
            grid.forEach(cell => {
                cell.opacity = 1;
                cell.solid = true;
            });
            const gridCopy = shuffle([...grid]).slice(0, amountPlats);
            gridCopy.forEach(cell => {
                cell.solid = false;
                cell.opacity = 0.1;
            });
        }, disableRate);
    };

    let runningCalculations = runCalculations();

    const goal = add([
        rect(cellWidth / 2, cellHeight * 2),
        color(255, 0, 0),
        origin("top"),
        area(),
        "goal",
        pos(cellHeight * 60, cellHeight * 36)
    ]);

    const floor = add([
        rect(width() * 2, cellHeight),
        area(),
        solid(),
        pos(0, cellHeight * 38)
    ]);

    let lastTyped = `calculate(30, 100);`;
    const cleanupPuter = buildPuter(
        {
            getCodeBlock: () => {
                return [
                    `// Every day, many calculations.`,
                    `const calculate = (amount, rate) => {`,
                    `   if (amount > ${MAX_CALCULATIONS}) CRASH();`,
                    `   setInterval(() => {`,
                    `       for (let i = 0; i < amount; i++) {`,
                    `           disable(randomPlatform())`,
                    `       }`,
                    `   }, rate); // millseconds`,
                    `};`,
                    [lastTyped]
                ];
            },
            onExecute: (typedCode) => {
                lastTyped = typedCode;

                window.ABEL_setNewCalculations = (newAmount, newRate) => {
                    if (typeof newAmount !== "number") {
                        throw new Error("Amount must be a number.");
                    }
                    if (newAmount > MAX_CALCULATIONS) {
                        throw new Error("EXCESSIVE CALCULATIONS.");
                    }
                    if (typeof newRate !== "number") {
                        throw new Error("Rate must be a number.");
                    }
                    disableRate = newRate;
                    amountPlats = newAmount;
                    clearInterval(runningCalculations);
                    runningCalculations = runCalculations();
                };

                eval(`
                    const calculate = (rate, amount) => window.ABEL_setNewCalculations(rate, amount);
                    ${typedCode}
                `);
            },
            player
        },
        {
            puterPos: [cellWidth * 24, cellHeight * 3.5],
            codeWindowPos: [500, 300],
            areaScaleX: 3,
            orig: "right",
            autoOpen: false,
            errorTextScale: 2.5,
        }
    );

    return () => {
        clearTimeout(zoomingOut);
        destroy(floor);
        firstRow.forEach(destroy);
        grid.forEach(destroy);
        cleanupPuter();
        clearInterval(runningCalculations);
        destroy(goal);
    };

};