import hl from "highlight.js";

export const getCaretPosition = (preEle) => {

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const clonedRange = range.cloneRange();
    const oldStart = clonedRange.startOffset;
    let oldContainer = clonedRange.startContainer;

    if (oldContainer.parentNode !== preEle) {
        oldContainer = oldContainer.parentNode;
    }

    let caretPosition = oldStart;
    let elementBefore = oldContainer.previousSibling;

    while (elementBefore) {
        caretPosition += elementBefore.textContent.length;
        elementBefore = elementBefore.previousSibling;
    }

    return { oldStart, caretPosition, selection, clonedRange };

};

const recreateCaretPosition = (preEle, caretPosition, selection, clonedRange) => {
    let elementAtCaret = preEle.childNodes[0];
    let lengthSoFar = 0;

    if (!elementAtCaret) {
        return;
    }

    while (lengthSoFar + elementAtCaret.textContent.length < caretPosition) {
        lengthSoFar = lengthSoFar + elementAtCaret.textContent.length;
        elementAtCaret = elementAtCaret.nextSibling;
        if (elementAtCaret === null) break;
    }

    if (!elementAtCaret) {
        return;
    }

    let offset = caretPosition - lengthSoFar;


    if (elementAtCaret.nodeName !== "#text") {
        elementAtCaret = elementAtCaret.childNodes[0];
    }

    selection.removeAllRanges();
    if (offset > elementAtCaret.textContent.length) {
        offset = elementAtCaret.textContent.length - 1;
    }
    try {
        clonedRange.setStart(elementAtCaret, offset);
    } catch (e) {
        console.error(e);
    }

    selection.addRange(clonedRange);
};

const resetContainer = (codeContainer) => {
    codeContainer.innerHTML = "";
};

const createEditablePreElement = () => {
    const pre = document.createElement("pre");
    pre.contentEditable = true;
    pre.spellcheck = false;
    return pre;
};

const highlight = v => {
    return hl.highlight(v, { language: "js" }).value;
};

export const activateEditorAndSetContent = (block, onSubmit, pos = [0, 0]) => {

    let editablePre = null;

    const lines = block.map(entry => {
        if (typeof entry === "string") {
            const pre = document.createElement("pre");
            pre.classList.add("locked-line");
            pre.innerHTML = highlight(entry);
            return pre;
        } else {
            const pre = createEditablePreElement();
            pre.innerHTML = highlight(entry[0]);
            editablePre = pre;
            return pre;
        }
    });

    const codeContainer = document.querySelector("#code-container");
    resetContainer(codeContainer);
    codeContainer.style.display = "block";

    const positionBlock = () => {
        codeContainer.style.left = (canvas.offsetLeft + pos[0]) + "px";
        codeContainer.style.top = (canvas.offsetTop + pos[1]) + "px";
    };
    positionBlock();
    window.addEventListener("resize", positionBlock);

    lines.forEach(pre => codeContainer.appendChild(pre));

    let onInput;
    let onKeyPress;

    editablePre.focus();

    onInput = (e) => {
        const { caretPosition, selection, clonedRange } = getCaretPosition(editablePre);
        editablePre.innerHTML = highlight(editablePre.innerText);
        recreateCaretPosition(editablePre, caretPosition, selection, clonedRange);
    };

    onKeyPress = (e) => {
        if (e.code === "Enter") {
            if (e.ctrlKey) {
                const { caretPosition, selection, clonedRange } = getCaretPosition(editablePre);
                const chars = editablePre.innerText.split("");
                chars.splice(caretPosition, 0, "\n\n");
                editablePre.innerHTML = highlight(chars.join(""));
                recreateCaretPosition(editablePre, caretPosition + 2, selection, clonedRange);
            } else {
                deactivate();
                onSubmit(editablePre.innerText);
            }
        }
    }

    editablePre.addEventListener("input", onInput);
    editablePre.addEventListener("keypress", onKeyPress);

    const { caretPosition, selection, clonedRange } = getCaretPosition(editablePre);

    recreateCaretPosition(editablePre, editablePre.textContent.length, selection, clonedRange);

    const deactivate = () => {
        window.removeEventListener("resize", positionBlock);
        editablePre.removeEventListener("input", onInput);
        editablePre.removeEventListener("keypress", onKeyPress);
        editablePre.remove();
        codeContainer.style.display = "none";
        resetContainer(codeContainer);
    };

    return {
        deactivate
    };

};

export const showDialogWindow = (initContent, initPos) => {

    const newContainer = document.createElement("pre");
    newContainer.classList.add("dialog");
    newContainer.style.display = "block";

    const setContent = (newContent) => {
        if (Array.isArray(newContent)) newContent = newContent.join("\n");
        newContainer.innerText = newContent;
    };
    setContent(initContent);

    const setPos = (pos) => {
        newContainer.style.left = (canvas.offsetLeft + pos[0]) + "px";
        newContainer.style.top = (canvas.offsetTop + pos[1]) + "px";
    };
    setPos(initPos);

    play("computeOpen", { volume: 0.1 });
    document.body.appendChild(newContainer);

    return {
        destroy: () => newContainer.remove(),
        setPos,
        setContent
    };

};