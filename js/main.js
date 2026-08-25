const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const navLinks =
    document.getElementById("navLinks");


mobileMenuBtn.addEventListener("click", () => {

    navLinks.classList.toggle("open");

});



/* Close mobile menu after clicking a link */

document.querySelectorAll(".nav-links a")
    .forEach(link => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("open");

        });

    });