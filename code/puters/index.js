import { activateEditorAndSetContent } from "../misc/editorUtils";

const buildPuter = ({ getCodeBlock, onExecute, player }, { puterPos, areaScaleX, codeWindowPos }) => {

    const puter = add([
        pos(...puterPos),
        sprite("puterIdle"),
        scale(2),
        area({ scale: { x: areaScaleX || 3, y: 1 } }),
        origin("left"),
        "computer"
    ]);

    puter.play("main", { loop: true });

    puter.on("ABEL_error", (err) => {
        shake(10);
        add([
            color(255, 0, 0),
            text(err.message, { font: "sink", size: 16 }),
            pos(),
            follow(puter, vec2(0, -50)),
            lifespan(5, { fade: 0.8 })
        ]);
    });

    const cancelComputingListener = player.on("computing", (computer) => {

        if (computer !== puter) return;

        const execute = (typedCode) => {
            try {
                onExecute(typedCode);
            } catch (e) {
                puter.trigger("ABEL_error", e);
            }
            deactivate();
            player.trigger("doneComputing");
        };

        const { deactivate } = activateEditorAndSetContent(getCodeBlock(), execute, codeWindowPos);

    });

    return () => {
        cancelComputingListener();
        destroy(puter);
    };

};

export default buildPuter;