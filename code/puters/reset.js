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

    const unlisten = player.on("computing", (computer) => {
        if (computer !== resetPuter) return;
        setTimeout(() => {
            onReset();
            play("reset", { volume: 0.2 });
            player.trigger("doneComputing");
        }, 1000);
    });

    return () => {
        unlisten();
        destroy(resetPuter);
    }; 

};

export default makeResetComputer;