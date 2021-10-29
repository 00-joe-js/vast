class ResetCam {
    constructor() {
        this._defaultPos = null;
    }
    _checkKaboomInitiated() {
        if (!window.camPos) {
            throw new Error("Attempting to use reset camera before kaboom context is globalized.");
        }
        return true;
    }
    setDefaultPos(vec) {
        this._defaultPos = vec;
    }
    reset() {
        if (this._checkKaboomInitiated) {
            camPos(this._defaultPos);
            camScale(1, 1);
        }
    }
}

export const resetCameraInterface = new ResetCam();