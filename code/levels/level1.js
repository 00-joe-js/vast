import { resetCameraInterface } from "../misc/levelStartUtils";

export default (player) => {

  player.spawnPoint = vec2(80, 275);
  resetCameraInterface.reset();

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

  const controlHintsBoxMoveJump = add([
    rect(250, 500),
    pos(75, 200),
    area(),
    opacity(0)
  ]);

  const controlHintsBoxUseDoor = add([
    rect(100, 500),
    pos(1050, 200),
    area(),
    opacity(0)
  ]);

  const moveJumpText = add([
    text("Move: WASD\nJump: Spacebar", { font: "sink", size: 24 }),
    color(255, 255, 255),
    pos(50, 300),
  ]);

  const useText = add([
    text("Use: E", { font: "sink", size: 24 }),
    color(255, 255, 255),
    pos(900, 300)
  ]);

  controlHintsBoxMoveJump.action(() => {
    if (controlHintsBoxMoveJump.isTouching(player)) {
      moveJumpText.opacity = 1;
    } else {
      moveJumpText.opacity = 0;
    }
  });

  controlHintsBoxUseDoor.action(() => {
    if (controlHintsBoxUseDoor.isTouching(player)) {
      useText.opacity = 1;
    } else {
      useText.opacity = 0;
    }
  });

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
    [
      controlHintsBoxMoveJump,
      controlHintsBoxUseDoor,
      moveJumpText,
      useText
    ].forEach(destroy);
  };

};