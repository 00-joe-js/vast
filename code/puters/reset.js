const makeResetComputer = (puterPos, player, onReset) => {

    const resetPuter = add([
        color(0, 255, 255),
        pos(...puterPos),
        sprite("puterIdle"),
        scale(2),
        area({ scale: { x: 2, y: 1 } }),
        origin("left"),
        "computer"
    ]);

    const resetText = add([
        text("RESET ALL CODE", { font: "sink", size: 32 }),
        color(0, 255, 255),
        pos(puterPos[0] + 20, puterPos[1] - 20),
        opacity(1),
    ]);

    window.resetText = resetText;

    const unlisten = player.on("computing", (computer) => {
        if (computer !== resetPuter) return;
        setTimeout(() => {
            onReset();
            play("reset", { volume: 0.2 });
            player.trigger("doneComputing");
        }, 1000);
    });

    resetPuter.action(() => {
        if (resetPuter.isTouching(player)) {
            console.log("touch");
            resetText.opacity = 1;
        } else {
            resetText.opacity = 0;
        }
    });

    return () => {
        unlisten();
        destroy(resetPuter);
        destroy(resetText);
    }; 

};

export default makeResetComputer;