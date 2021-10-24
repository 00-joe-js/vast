import buildPuter from "../puters";
import createResetPuter from "../puters/reset";
import shuffle from "shuffle-array";

export default (player) => {

    player.spawnPoint = vec2(80, 1200);

    camScale(vec2(0.5, 0.5));
    camPos(vec2(width(), height()));

    const cellWidth = window.LEVEL_CELL_WIDTH;
    const cellHeight = window.LEVEL_CELL_HEIGHT;

    const floor = add([
        rect(width() * 2, cellHeight),
        area(),
        solid(),
        pos(0, cellHeight * 38)
    ]);

    const upStrip = add([
        color(150, 255, 150),
        rect(cellWidth * 2, cellHeight * 25),
        pos(cellWidth * 7, cellHeight * 38),
        opacity(0.7),
        origin("bot"),
        area()
    ]);
    const walls = [
        add([
            color(0, 0, 0),
            rect(cellWidth / 7, cellHeight * 20),
            follow(upStrip, vec2(-58, -player.height)),
            pos(),
            origin("bot"),
            area(),
            solid(),
            z(2)
        ]),
        add([
            color(0, 0, 0),
            rect(cellWidth / 7, cellHeight * 20),
            follow(upStrip, vec2(58, -player.height)),
            pos(),
            origin("bot"),
            area(),
            solid(),
            z(2)
        ]),
    ];
    upStrip.action(() => {
        upStrip.opacity = wave(0.4, 1, time() * 25);
    });

    let playerTravelTo = null;
    const STARTING_THRUST = 35;
    let currentThrust = STARTING_THRUST;

    const defaultVelocity = player.bodyOpts.maxVel;
    let alreadyTouching = false;
    upStrip.action(() => {
        if (playerTravelTo) return;
        const isTouching = upStrip.isTouching(player);
        if (isTouching) {
            if (player.grounded()) {
                player.moveBy(0, -7);
                player.setAnim("float");
            }
            if (alreadyTouching) return;
            alreadyTouching = true;
            player.setAnim("float");
            player.weight = map(currentThrust, 0, 100, 0, -.5);
            player.bodyOpts.maxVel = 0;
        } else {
            if (!alreadyTouching) return;
            alreadyTouching = false;
            player.weight = 1;
            player.bodyOpts.maxVel = defaultVelocity;
        }
    });

    const wordToIndex = {
        moon: 3,
        sun: 4,
        stars: 5,
    };

    const portals = [
        { x: 100, y: 100, color: [0, 255, 0], connectionPortal: wordToIndex["sun"] }, // green
        { x: 250, y: 800, color: [255, 0, 255], connectionPortal: wordToIndex["sun"] }, // magenta
        { x: 1300, y: 1000, color: [0, 255, 255], connectionPortal: wordToIndex["moon"] }, // teal
        { x: 100, y: 500, color: [100, 100, 100] }, // moon
        { x: 1900, y: 400, color: [100, 100, 100] }, // sun
        { x: 2100, y: 100, color: [100, 100, 100] } // stars
    ].map(portalConfig => {
        return add([
            circle(64),
            color(...portalConfig.color),
            opacity(0.1),
            area({ width: 110, height: 110 }),
            origin("center"),
            outline(2, rgb(100, 100, 100)),
            pos(portalConfig.x, portalConfig.y),
            {
                connectionPortal: portalConfig.connectionPortal
            }
        ]);
    });

    upStrip.action(() => {
        const t = time();
        upStrip.opacity = wave(0.4, 1, t * 25);
        portals.forEach((p, i) => {
            p.opacity = wave(0.7, 0.9, t * 50);
            p.outline.width = wave(2, 10, t * 10);

            if (p.isTouching(player) && !playerTravelTo) {
                if (p.connectionPortal === undefined) return;
                player.solid = false;
                player.bodyOpts.maxVel = 0;
                playerTravelTo = portals[p.connectionPortal].pos;
                player.color = p.color;
                player.opacity = 0.5;
            }

        });
    });

    upStrip.action(() => {
        if (playerTravelTo) {
            player.moveTo(playerTravelTo, 1500);
            if (player.pos.x === playerTravelTo.x && player.pos.y === playerTravelTo.y) {
                playerTravelTo = null;
                player.solid = true;
                player.opacity = 1;
                player.color = rgb(255, 255, 255);
                player.bodyOpts.maxVel = defaultVelocity;
            }
        }
    });

    let thrustLastTyped = ``;
    const cleanupThrustPuter = buildPuter({
        getCodeBlock: () => {
            return [
                `// Up, up, and away.`,
                `let thrustSpeed = ${currentThrust};`,
                [thrustLastTyped],
                `if (thrustSpeed > 100) CRASH();`
            ];
        },
        onExecute: (typedCode) => {
            thrustLastTyped = typedCode;
            window.ABEL_setThrust = (newThrust) => {
                if (typeof newThrust !== "number") throw new Error("thrustSpeed must be a number.");
                if (newThrust > 100) throw new Error("INSUFFICIENT FUEL.");
                currentThrust = newThrust;
            };
            eval(
                `
                    let thrustSpeed = ${currentThrust};
                    ${typedCode}
                    window.ABEL_setThrust(thrustSpeed);
                `
            );
        },
        player
    }, {
        puterPos: [2000, 700],
        codeWindowPos: [500, 300],
        orig: "right",
        areaScaleX: 4,
        autoOpen: false,
        errorTextScale: 1.5
    });

    const shuffleWord = word => {
        let shuffled = null;
        do {
            shuffled = shuffle(word.split("")).join("");
        } while (shuffled === word);
        return shuffled;
    };

    let portalLastTyped = ``;
    const cleanUpPortalPuter = buildPuter({
        getCodeBlock: () => {
            return [
                `// A spear, plunging through space and time.`,
                `const destinations = [${["moon", "sun", "stars"].map(shuffleWord).map(s => `"${s}"`).join(", ")}];`,
                `const portals = { magenta: "sun",  teal: "moon", green: "sun" };`,
                [portalLastTyped],
                `freeze(portals.magenta, portals.teal);`
            ];
        },
        onExecute: (typedCode) => {
            portalLastTyped = typedCode;
            window.ABEL_connectPortals = (portalsObj) => {
                if (portalsObj.magenta !== "sun" || portalsObj.teal !== "moon") {
                    throw new Error("SOME DESTINATIONS ARE FATED.");
                }
                portals[0].connectionPortal = wordToIndex[portalsObj.green] || undefined;
            };
            eval(
                `
                    const portals = { magenta: "sun",  teal: "moon", green: "sun" };
                    ${typedCode}
                    window.ABEL_connectPortals(portals);
                `
            );
        },
        player
    }, {
        puterPos: [1000, 1340],
        codeWindowPos: [500, 300],
        orig: "right",
        areaScaleX: 4,
        autoOpen: false,
        errorTextScale: 1.5
    });

    const cleanupResetPuter = createResetPuter(
        [25, 1350],
        player,
        () => {
            portalLastTyped = "";
            thrustLastTyped = ""
            currentThrust = STARTING_THRUST;
            portals[0].connectionPortal = wordToIndex["sun"];
        }
    );

    const levelConfig = {
        width: cellWidth * 2,
        height: cellHeight * 2,
        "=": () => {
            return [
                rect(cellWidth * 2, cellHeight * 2),
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
        "                     ",
        "                     ",
        "                   * ",
        "                 ===",
        "                 ===",
        "                 ===",
        "                 ===",
        "                 ===",
        "                 ===",
        "                 ===",
        "               =====",
        "                 ===",
        "                 ===",
        "                 ===",
        "                 ===",
        "                 ===",
        "    ================",
        "                 ===",
        "                 ===",
    ];

    const level = addLevel(levelMapString, levelConfig);

    return () => {
        destroy(level);
        destroy(floor);
        cleanupThrustPuter();
        cleanupResetPuter();
        cleanUpPortalPuter();
        portals.forEach(destroy);
        destroy(upStrip);
        walls.forEach(destroy);
    };

};