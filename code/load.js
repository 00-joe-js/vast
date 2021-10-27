export default () => {

  loadSprite("bean", "sprites/bean.png");
    // PLAYER SPRITE.
    // Thank you: https://deadrevolver.itch.io/pixel-prototype-player-sprites
    loadSprite("player", "sprites/player.png", {
      sliceX: 14,
      sliceY: 18.9,
      anims: {
        idle: {
          from: 14,
          to: 20
        },
        run: {
          from: 42,
          to: 49
        },
        jump: {
          from: (8 * 14) + 1,
          to: (8 * 14) + 5
        },
        crouch: {
          from: (9 * 14) + 1,
          to: (9 * 14) + 5
        },
        float: {
          from: (12 * 14) + 1,
          to: (12 * 14) + 3
        },
        hit: {
          from: (17 * 14) + 1,
          to: (17 * 14) + 5
        },
        sit: {
          from: (17 * 14) + 5,
          to: (17 * 14) + 5,
        }
      }
    });
  
    // PUTER SPRITE.
    loadSprite("puterIdle", "sprites/puter/idle.png", {
      sliceX: 4,
      anims: {
        main: {
          from: 0,
          to: 3
        }
      }
    });

    loadSprite("abel", "sprites/abel.png");
  
    // BG MUSIC
    // Thanks: https://joshuuu.itch.io/short-loopable-background-music
    loadSound("dangerouspath", "sounds/Dangerous Path.wav");

    loadSound("computeOpen", "sounds/compute.wav");
    loadSound("computeError", "sounds/error.wav");
    loadSound("computeExecute", "sounds/execute.wav");
    loadSound("reset", "sounds/reset.wav");
    loadSound("jumpSound", "sounds/jump.wav");
    loadSound("scream", "sounds/scream.wav");
    loadSound("bossMusic", "sounds/battle.wav");
    loadSound("elevator", "sounds/elevator.wav");
    
  };