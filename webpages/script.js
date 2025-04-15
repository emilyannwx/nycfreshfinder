document.addEventListener("DOMContentLoaded", async function () {
    try {
        console.log("Initializing marker map...");

        //fetch the same JSON data
        const response = await fetch("data/bk_data.json");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("JSON Data Loaded:", data);

        //initialize a separate map for markers
        const markerMap = L.map("marker-map").setView([40.6782, -73.9442], 12); //brooklyn center

        // add base map layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(markerMap);

        // Add detailed markers
        data.forEach(entry => {
            const {
                Latitude,
                Longitude,
                Name,
                Type,
                "Contact Info": ContactInfo,
                "Street Address": StreetAddress,
                Borough,
                "Zip Code": ZipCode,
                "Days of Operation": DaysOfOperation,
                "Hours of Operation": HoursOfOperation
            } = entry;

            if (Latitude && Longitude) {
                const marker = L.marker([parseFloat(Latitude), parseFloat(Longitude)]);

                const popupContent = `
                    <strong>${Name || "Food Resource"}</strong><br>
                    <em>Type:</em> ${Type || "N/A"}<br>
                    <em>Address:</em> ${StreetAddress || "N/A"}, ${Borough || ""}, NY ${ZipCode || ""}<br>
                    <em>Contact:</em> ${ContactInfo || "N/A"}<br>
                    <em>Open:</em> ${DaysOfOperation || "N/A"}<br>
                    <em>Hours:</em> ${HoursOfOperation || "N/A"}
                `;

                marker.bindPopup(popupContent);
                marker.bindTooltip(Name || "Food Resource");
                marker.addTo(markerMap);
            }
        });

        console.log("Marker map loaded!");
    } catch (error) {
        console.error("Error loading marker map:", error);
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    try {
        console.log("Initializing heatmap...");

        // Load JSON data
        const response = await fetch("data/bk_data.json");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        console.log("JSON Data Loaded:", data);

        // Extract latitude and longitude for heatmap
        const heatmapData = data
            .filter(entry => entry.Latitude && entry.Longitude)
            .map(entry => [parseFloat(entry.Latitude), parseFloat(entry.Longitude)]);

        console.log("Processed Heatmap Data:", heatmapData);

        if (heatmapData.length === 0) {
            throw new Error("No valid latitude/longitude points found in JSON!");
        }

        // Initialize heatmap if the container exists
        const heatmapContainer = document.getElementById("heatmap");
        if (heatmapContainer) {
            const heatmap = L.map("heatmap").setView([40.6782, -73.9442], 12);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors"
            }).addTo(heatmap);

            L.heatLayer(heatmapData, {
                radius: 25,
                blur: 15,
                maxZoom: 15,
                gradient: { 
                    0.1: "blue", 
                    0.3: "cyan",
                    0.5: "lime", 
                    0.7: "yellow",
                    1.0: "red" }
            }).addTo(heatmap);

            console.log("Heatmap loaded successfully!");
        }
    } catch (error) {
        console.error("Error loading JSON:", error);
    }
});