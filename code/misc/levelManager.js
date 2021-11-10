class LevelManager {
    constructor(loadLevelFns, player, spawnPlayerFunc) {
        this._allLevels = loadLevelFns;
        this.currentLevelIndex = -1;
        this.unloadCurrentLevel = null;
        this._blockCalls = false;
        this._player = player;
        this._spawnPlayer = spawnPlayerFunc;
    }
    _loadLevel() {
        let minLevel = window.localStorage.getItem("reachedLevel")
        if (minLevel) {
            minLevel = parseInt(minLevel);
            if (this.currentLevelIndex + 1 > minLevel && this.currentLevelIndex < 8) {
                window.localStorage.setItem("reachedLevel", this.currentLevelIndex + 1);
            }
        } else {
            if (this.currentLevelIndex !== 0) {
                window.localStorage.setItem("reachedLevel", this.currentLevelIndex + 1);
            }
        }
        if (this.unloadCurrentLevel) {
            this.unloadCurrentLevel();
        }
        this.unloadCurrentLevel = this._allLevels[this.currentLevelIndex](this._player);
        this._spawnPlayer();
    }
    loadNextLevel() {
        if (this._blockCalls) return;
        this._blockCalls = true;
        setTimeout(() => { this._blockCalls = false }, 3000);
        this.currentLevelIndex = this.currentLevelIndex + 1;
        this._loadLevel();
    }
    loadSpecificLevel(level) {
        this.currentLevelIndex = level;
        this._loadLevel();
    }
}

export default LevelManager;