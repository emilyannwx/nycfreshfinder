document.addEventListener("DOMContentLoaded", function () {
    const popup = document.querySelector(".popup");
    const openPopup = document.getElementById("open-popup");
    const closePopup = document.querySelector(".popup__close");

    const loginForm = document.querySelector(".form--login");
    const signupForm = document.querySelector(".form--signup");
    const formToggles = document.querySelectorAll(".form__toggle");

    openPopup.addEventListener("click", () => {
        popup.classList.add("popup--active");
    });

    closePopup.addEventListener("click", () => {
        popup.classList.remove("popup--active");
    });

    popup.addEventListener("click", (e) => {
        if (e.target === popup) {
            popup.classList.remove("popup--active");
        }
    });

    formToggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
            if (loginForm.classList.contains("form--active")) {
                loginForm.classList.remove("form--active");
                signupForm.classList.add("form--active");
            } else {
                signupForm.classList.remove("form--active");
                loginForm.classList.add("form--active");
            }
        });
    });

    loginForm.classList.add("form--active");
});