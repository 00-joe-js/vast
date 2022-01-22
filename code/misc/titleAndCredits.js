export default (startGame) => {

    const titleCard = document.querySelector("#title-card");

    const removeTitleAndStart = (i) => {
        titleCard.remove();
        startGame(i);
    };

    document.querySelector("#play-button").addEventListener("click", () => removeTitleAndStart());

    let highestReachedLevel = window.localStorage.getItem("reachedLevel");

    if (highestReachedLevel) {
        const buttonsContainer = document.querySelector("#load-level-buttons");
        highestReachedLevel = parseInt(highestReachedLevel);
        for (let i = 1; i < highestReachedLevel; i++) {
            const button = document.createElement("span");
            button.innerText = i + 1;
            buttonsContainer.appendChild(
                button
            );
            button.addEventListener("click", () => removeTitleAndStart(i));
        }
    }

    let showingMain = true;
    const toggles = Array.from(document.querySelectorAll(".credits-title-toggle"));

    const creditsCard = document.querySelector("#title-credits-card");

    toggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            if (showingMain) {
                titleCard.style.display = "none";
                creditsCard.style.display = "block";
                showingMain = false;
            } else {
                window.location.reload();
            }
        });
    });



};
