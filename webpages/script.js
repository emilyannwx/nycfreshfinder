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

document.addEventListener("DOMContentLoaded", async function () {
    try {
        console.log("Initializing maps...");

        //load JSON data
        const response = await fetch("data/bk_data.json");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("JSON Data Loaded:", data);

        //extract latitude and longitude for heatmap
        const heatmapData = data
            .filter(entry => entry.Latitude && entry.Longitude)
            .map(entry => [parseFloat(entry.Latitude), parseFloat(entry.Longitude)]);

        console.log("Processed Heatmap Data:", heatmapData);

        if (heatmapData.length === 0) {
            throw new Error("No valid latitude/longitude points found in JSON!");
        }

        //heatmap
        //maybe add a legend?
        const heatmapContainer = document.getElementById("heatmap");
        if (heatmapContainer) {
            const heatmap = L.map("heatmap").setView([40.6782, -73.9442], 12);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors"
            }).addTo(heatmap);
            //
            L.heatLayer(heatmapData, {
                radius: 35,
                blur: 20,
                maxZoom: 15,
                gradient: { 
                0.1: "blue", 
                0.3: "cyan",
                0.5: "lime", 
                0.7: "yellow",
                1.0: "red" }
            }).addTo(heatmap);

            console.log("Heatmap loaded successfully!");
            const legend = L.control({ position: "bottomright" });

            legend.onAdd = function(map) {
                const div = L.DomUtil.create("div", "legend");
                div.innerHTML += "<h4><strong>Intensity</strong></h4>";
                div.innerHTML += '<div class="gradient-bar"></div>';
                div.innerHTML += '<div class="labels"><span class="low-label">Low</span><span class="high-label">High</span></div>';
                return div;
            };

            legend.addTo(heatmap);
        }

        //marker map
        const markerMapContainer = document.getElementById("marker-map");
    if (markerMapContainer) {
        const markerMap = L.map("marker-map").setView([40.6782, -73.9442], 12);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(markerMap);

        //add markers for each food resource
        data.forEach(entry => {
            if (entry.Latitude && entry.Longitude) {
                const popupContent = `
                    <strong>${entry.Name || "Food Resource"}</strong><br>
                    <em>Type:</em> ${entry.Type || "N/A"}<br>
                    <em>Contact:</em> ${entry["Contact Info"] || "N/A"}<br>
                    <em>Address:</em> ${entry["Street Address"] || "N/A"}, ${entry.Borough || "N/A"}, ${entry["Zip Code"] || "N/A"}<br>
                    <em>Days:</em> ${entry["Days of Operation"] || "N/A"}<br>
                    <em>Hours:</em> ${entry["Hours of Operation"] || "N/A"}
                `;

                L.marker([parseFloat(entry.Latitude), parseFloat(entry.Longitude)])
                    .bindPopup(popupContent)
                    .addTo(markerMap);
            }
        });

        console.log("Marker map loaded successfully!");
        }
    } catch (error) {
        console.error("Error loading the marker map:", error);
    }
});