
document.addEventListener("DOMContentLoaded", function () {
  displaySavedLocations();
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
      const response = await fetch("/data/bk_data.json");
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
      console.log("Check");

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

// Refresh Captcha
function refreshCaptcha() {
    document.getElementById('captcha-image').src = '/api/captcha?' + new Date().getTime();
}

// Sign In, Token Retrieval and Redirect
document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector('input[name="username"]').value;
    const password = document.querySelector('input[name="password"]').value;

    const response = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();

    if (response.ok) 
    {
        localStorage.setItem("token", data.token);
        window.location.href = data.redirectUrl; 
    } 
    else 
    {
        alert(data.message);
    }
});

// Show saved locations
async function displaySavedLocations()
{
  
  const response = await fetch(`/api/get_saved_locations`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  });
  const data = await response.json();

  const resultsList = document.getElementById("saved-locations");
  resultsList.innerHTML = '';

  console.log(data);

}

// Submit Zip Code or Borough and display Locations and Reviews
function findLocation() {
  const form = document.getElementById("find-location");

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // stop reload

    const searchInput = form.querySelector('input[name="location"]');
    const search = encodeURIComponent(searchInput.value.trim());

    if (!search) return;

    try 
    {
      const response = await fetch(`/api/get_locations/search?search=${search}`);
      const data = await response.json();

      const resultsList = document.getElementById("locations");
      resultsList.innerHTML = '';

      const locations = data.locations;
      const reviews = data.reviews;

      const reviewsByLocation = {};
      reviews.forEach(review => {
        if (!reviewsByLocation[review.location_id]) 
        {
          reviewsByLocation[review.location_id] = [];
        }
        reviewsByLocation[review.location_id].push(review);
      });

      if (Array.isArray(locations) && locations.length) 
      {
        locations.forEach(location => {
          const li = document.createElement('li');
        
          // Add location name
          li.innerHTML = `<h5>${location.name}</h5>`;
        
          // Get corresponding reviews
          const locationReviews = reviewsByLocation[location.location_id] || [];
        
          if (locationReviews.length) 
          {
            const ul = document.createElement('ul');
            locationReviews.forEach(review => {
              const reviewLi = document.createElement('li');
              reviewLi.textContent = `Rating: ${review.rating} — ${review.comment || 'No comment'}`;
              ul.appendChild(reviewLi);
            });
            li.appendChild(ul);
          } 
          else 
          {
            li.innerHTML += `<br><em>No reviews yet</em>`;
          }
        
          resultsList.appendChild(li);
        });
      } 
      else 
      {
        resultsList.innerHTML = '<li>No results found.</li>';
      }
    } 
    catch (err) 
    {
      console.error("Fetch error:", err);
    }
  });
}



