class BgMusic {

    static PLAY_MUSIC = true;
    static SONGS = [
        "drone",
        "bossMusic",
        "deepSpace",
        "endMusic"
    ];

    constructor() {
        this._songs = {
            drone: {
                url: "Dangerous Path.wav",
                vol: 0.3,
                loadInitially: true
            },
            bossMusic: {
                url: "battle.wav",
                vol: 0.1,
                loadInitially: false,
            },
            deepSpace: {
                url: "alone.mp3",
                vol: 0.5,
                loadInitially: false
            },
            endMusic: {
                url: "anormal.mp3",
                vol: 0.5,
                loadInitially: false,
                loop: false
            }
        };
        this.currentlyPlaying = null;
        this.currentlyPlayingName = null;
    }

    _stopCurrentlyPlaying() {
        if (this.currentlyPlaying) {
            this.currentlyPlaying.stop();
            this.currentlyPlaying = null;
            this.currentlyPlayingName = null;
        }
    }

    _loadSong(songName, songConfig) {
        return loadSound(songName, `sounds/${songConfig.url}`);
    }

    async play(songName) {

        if (this.currentlyPlayingName === songName) {
            return;
        }

        if (BgMusic.PLAY_MUSIC === false) {
            return;
        }

        this._stopCurrentlyPlaying();
        if (!BgMusic.SONGS.includes(songName)) {
            throw new Error(`Unknown song name: ${songName}`); // Maybe productionize this--to fall back to drone or something.
        }
        const songConfig = this._songs[songName];
        try {
            this.currentlyPlayingName = songName;
            await this._loadSong(songName, songConfig);
            if (this.currentlyPlayingName !== songName) { // This may happen if another play is called before song is loaded.
                stop(songName);
            } else {
                this.currentlyPlaying = play(songName, { 
                    volume: songConfig.vol,
                    loop: songConfig.loop === false ? false : true 
                });
                return this.currentlyPlaying;
            }
        } catch (e) {
            console.error(e);
            // Maybe backup arg.
            this.play("drone");
        }
    }

    stop(songName = null) {
        if (songName !== null) {
            if (this.currentlyPlayingName === songName) {
                this._stopCurrentlyPlaying();
            }
        } else {
            this._stopCurrentlyPlaying();
        }
    }

}

let bg = null;
export default () => {
    if (typeof loadSound === "undefined") {
        throw new Error("BG music manager initialized before kaboom global.");
    }
    if (bg === null) {
        bg = new BgMusic(); // Singleton being used because of the delayed kaboom global context. BLEH
    }
    return bg;
};