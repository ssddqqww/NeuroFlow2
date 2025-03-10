document.addEventListener("DOMContentLoaded", function () {
    const button = document.querySelector("#button");
    const spotsContainer = document.querySelector(".b_l_quad");

    button.addEventListener("change", function () {
        if (this.checked) {
            for (let i = 0; i < 50; i++) {
                let spot = document.createElement("div");
                spot.className = "button_spots";
                spot.style.top = `${Math.random() * 40 - 20}px`;
                spot.style.left = `${Math.random() * 100 - 50}px`;
                spot.style.animation = `explode 0.6s ease-out forwards`;
                spotsContainer.appendChild(spot);
            }
        }
    });
});
