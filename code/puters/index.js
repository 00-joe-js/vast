import { activateEditorAndSetContent } from "../misc/editorUtils";

const buildPuter = ({ getCodeBlock, onExecute, player }, { puterPos, areaScaleX = 3, codeWindowPos, orig = "left", autoOpen = false, errorTextScale = 1 }) => {

    const puter = add([
        pos(...puterPos),
        sprite("puterIdle"),
        scale(2),
        area({ scale: { x: areaScaleX, y: 1 } }),
        origin(orig),
        "computer"
    ]);

    puter.play("main", { loop: true });

    puter.on("ABEL_error", (err) => {
        play("computeError", { volume: 0.7 });
        shake(10);
        add([
            color(255, 0, 0),
            text(err.message, { font: "sink", size: 16 }),
            pos(),
            follow(puter, vec2(0, -50)),
            lifespan(5, { fade: 0.8 }),
            scale(errorTextScale)
        ]);
    });

    const open = (computer) => {

        if (computer !== puter) return;

        play("computeOpen", { volume: 0.3 });

        const execute = (typedCode) => {
            try {
                onExecute(typedCode);
                play("computeExecute", { volume: 0.3 });
            } catch (e) {
                puter.trigger("ABEL_error", e);
            }
            deactivate();
            player.trigger("doneComputing");
        };

        const { deactivate } = activateEditorAndSetContent(getCodeBlock(), execute, codeWindowPos);

    };

    const cancelComputingListener = player.on("computing", open);

    if (autoOpen) {
        open(puter);
    }

    return () => {
        cancelComputingListener();
        destroy(puter);
    };

};

export default buildPuter;