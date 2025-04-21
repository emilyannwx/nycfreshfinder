
document.addEventListener("DOMContentLoaded", async function () {
  try 
  {
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
  } 
  catch (error) 
  {
      console.error("Error loading marker map:", error);
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  try {
      console.log("Initializing heatmap...");

      // Load JSON data
      const response = await fetch("/data/bk_data.json");
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

// Open Popup
function openPopup()
{
  document.querySelector(".popup").style.display = "Flex";
}

// Refresh Captcha
// function refreshCaptcha() {
//     document.getElementById('captcha-image').src = '/api/captcha?' + new Date().getTime();
// }


document.addEventListener("DOMContentLoaded", () => {
  // Sign In, Token Retrieval and Redirect
  console.log(document.getElementById("loginForm"));

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
      if (localStorage.getItem("token"))
      {
        localStorage.removeItem("token");
      }
      localStorage.setItem("token", data.token);

      window.location.href = "/"; 

      console.log(localStorage.getItem("token"));
    } 
    else 
    {
      alert(data.message);
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".stars").forEach(starGroup => {
    const category = starGroup.dataset.category;
  
    starGroup.addEventListener("click", (e) => {
      if (e.target.classList.contains("star")) {
        const selectedValue = parseInt(e.target.dataset.value);
  
        // Loop through all stars in this group
        starGroup.querySelectorAll(".star").forEach(star => {
          const starValue = parseInt(star.dataset.value);
          
          // Add .active if starValue <= selectedValue
          if (starValue <= selectedValue) {
            star.classList.add("active");
          } else {
            star.classList.remove("active");
          }
        });
  
        // Store the rating
        starGroup.dataset.rating = selectedValue;
      }
    });
  });
  

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

    console.log("Search In Progress");
    event.preventDefault(); // stop reload

    const searchInput = form.querySelector('.search-input');
    const search = encodeURIComponent(searchInput.value.trim());

    if (!search) return;

    try 
    {
      const response = await fetch(`/api/get_locations/search?search=${search}`);
      const data = await response.json();

      const locationContainer = document.getElementById("location-area");
      locationContainer.innerText = searchInput.value;

      const resultsList = document.querySelector(".location-list");
      resultsList.innerHTML = "";

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
          const li = document.createElement('div');
          li.classList.add("location-item");
          li.onclick = function() {
            selectedLocation(location.name)
            getReviews()
          };
          

          // Add location name
          li.innerHTML = `<h3 class="location-name">${location.name}</h3>
          <p><span>Address:</span class="location-address">${location.address}</p>`;
        
          // Get corresponding reviews
          const locationReviews = reviewsByLocation[location.location_id] || [];
        
          if (locationReviews.length) 
          {
            const ul = document.createElement('p');
            ul.innerHTML = "<span>Rating:</span>";
            let stars = "";
            let totalRating = 0;
            locationReviews.forEach(review => {
              totalRating += review.price_rating + review.quality_rating;
            });

            totalRating = totalRating / (locationReviews.length * 10);

            stars = " ★".repeat(Math.round(totalRating * 5));

            ul.innerHTML += stars;
            li.appendChild(ul);
          } 
          else 
          {
            const ul = document.createElement('p');
            ul.innerHTML = "<p><span>Rating:</span>N/A</p>";
            li.appendChild(ul);
          }
        
          resultsList.appendChild(li);
        });
      } 
      else 
      {
        resultsList.innerHTML = '<h3>No Results Found</h3>';
      }
    } 
    catch (err) 
    {
      console.error("Fetch error:", err);
    }
  });
}

async function saveReview() {
  const name = document.getElementById("selected-location").innerText;
  const token = localStorage.getItem("token");
  const review = document.getElementById("review-comment").value;
  const price_rating = document.querySelector('[data-category="price"]').dataset.rating;
  const quality_rating = document.querySelector('[data-category="quality"]').dataset.rating;


  const response = await fetch("/api/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, token, review, price_rating, quality_rating })
  });

  const data = await response.json();
  console.log(data);

  const list = document.querySelector(".reviews-list");

  const reviewDiv = document.createElement("div");

  reviewDiv.innerHTML = `
    <p><strong>Price Rating:</strong> ${" ★".repeat(Math.round(price_rating))}</p>
    <p><strong>Quality Rating:</strong> ${" ★".repeat(Math.round(quality_rating))}</p>
    <p><strong>Comment:</strong> ${review}</p>
  `;

  list.appendChild(reviewDiv);

  document.querySelector(".review-form-container").style.display = "none";

}

function selectedLocation(locationName)
{
  document.getElementById("selected-location").innerText = locationName;
}

async function getReviews()
{
  // document.querySelector(".reviews-list p").style.display = "none";

  const locationName = document.getElementById("selected-location").innerText;
  const response = await fetch(`/api/get_reviews?name=${encodeURIComponent(locationName)}`);

  const data = await response.json();
  const list = document.querySelector(".reviews-list");
  list.innerHTML = "";

  data.reviews.forEach(review => {
    const reviewDiv = document.createElement("div");
    reviewDiv.classList.add("review-item"); // optional for styling

    reviewDiv.innerHTML = `
      <p><strong>Price Rating:</strong> ${" ★".repeat(Math.round(review.price_rating))}</p>
      <p><strong>Quality Rating:</strong> ${" ★".repeat(Math.round(review.quality_rating))}</p>
      <p><strong>Comment:</strong> ${review.comment}</p>
    `;

    list.appendChild(reviewDiv);
  });

}

function redirectSignUp(el) {
  let selected = el.innerText;
  console.log("Selected:", selected);

  if (selected === "Sign Up") {
    document.querySelector(".form--login").classList.remove("form--active");
    document.querySelector(".form--signup").classList.add("form--active");
  } else {
    document.querySelector(".form--login").classList.add("form--active");
    document.querySelector(".form--signup").classList.remove("form--active");
  }
}

function closePopup()
{
  document.querySelector(".popup").style.display = "none";
}

function openReviewForm()
{
  if (document.getElementById("selected-location").innerText == "No location selected" && localStorage.getItem("token") == null)
  {
    return;
  }

  document.querySelector(".review-form-container").style.display = "flex";
}

function closeReviewForm()
{
  document.querySelector(".review-form-container").style.display = "none";
}