
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

//leaflet map
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


  //review system
  let reviewStore = {};
  let currentLocation = null;
  let currentRatings = { price: 0, quality: 0 };

  const createReviewBtn = document.getElementById('create-review-btn');
  const reviewFormContainer = document.querySelector('.review-form-container');
  const closeFormBtn = document.querySelector('.close-form');
  const submitReviewBtn = document.getElementById('submit-review');
  const reviewsList = document.querySelector('.reviews-list');
  const selectedLocation = document.getElementById('selected-location');

  //stars
  function initStars() {
      document.querySelectorAll('.star').forEach(star => {
          star.addEventListener('click', function () {
              const category = this.parentElement.dataset.category;
              const value = parseInt(this.dataset.value);
              currentRatings[category] = value;

              this.parentElement.querySelectorAll('.star').forEach((s, i) => {
                  s.classList.toggle('active', i < value);
              });
          });
      });
  }
  initStars();

  //get location info
  document.addEventListener('click', function (e) {
      if (e.target.classList.contains('leaflet-marker-icon')) {
          const popup = document.querySelector('.leaflet-popup-content');
          if (popup) {
              const nameMatch = popup.innerHTML.match(/<strong>(.*?)<\/strong>/);
              if (nameMatch) {
                  const locationName = nameMatch[1].trim();
                  currentLocation = { Name: locationName };
                  selectedLocation.textContent = locationName;
                  displayReviewsForLocation(locationName);
              }
          }
      }
  });

  //open overlay
  // if (createReviewBtn) {
  //     createReviewBtn.addEventListener('click', function () {
  //         if (!currentLocation) {
  //             alert('Please select a location first by clicking on a map marker.');
  //             return;
  //         }
  //         reviewFormContainer.classList.add('active');
  //     });
  // }

  //close overlay
  // if (closeFormBtn) {
  //     closeFormBtn.addEventListener('click', function () {
  //         reviewFormContainer.classList.remove('active');
  //     });
  // }

  //submit
  // if (submitReviewBtn) {
  //     submitReviewBtn.addEventListener('click', function () {
  //         const name = document.getElementById('reviewer-name')?.value.trim() || 'Anonymous';
  //         const comment = document.getElementById('review-comment')?.value.trim() || 'No comment provided.';

  //         if (currentRatings.price === 0 || currentRatings.quality === 0) {
  //             alert('Please rate both price and quality.');
  //             return;
  //         }

  //         const review = {
  //             locationName: currentLocation.Name,
  //             name,
  //             comment,
  //             ratings: { ...currentRatings },
  //             date: new Date().toLocaleDateString()
  //         };

  //         if (!reviewStore[review.locationName]) reviewStore[review.locationName] = [];
  //         reviewStore[review.locationName].push(review);
  //         displayReviewsForLocation(review.locationName);

  //         // Reset form
  //         document.getElementById('reviewer-name').value = '';
  //         document.getElementById('review-comment').value = '';
  //         document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  //         currentRatings = { price: 0, quality: 0 };
  //         reviewFormContainer.classList.remove('active');
  //     });
  // }

  //display reviews
  function displayReviewsForLocation(locationName) {
    getReviews(locationName);
      // reviewsList.innerHTML = '';
      // const reviews = reviewStore[locationName] || [];

      // if (reviews.length === 0) {
      //     reviewsList.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
      //     return;
      // }

      // reviews.forEach(review => {
      //     const div = document.createElement('div');
      //     div.className = 'review-item';
      //     div.innerHTML = `
      //         <div class="review-header">
      //             <span class="review-author">${review.name}</span>
      //             <span class="review-date">${review.date}</span>
      //         </div>
      //         <div class="review-ratings">
      //             <div class="review-rating"><span>Price:</span><span>${'★'.repeat(review.ratings.price)}</span></div>
      //             <div class="review-rating"><span>Quality:</span><span>${'★'.repeat(review.ratings.quality)}</span></div>
      //         </div>
      //         <div class="review-content">${review.comment}</div>
      //     `;
      //     reviewsList.appendChild(div);
      // });
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

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('items-container');
  const searchBar = document.getElementById('search-bar');
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');

  let foodItems = [];

  fetch('data/bk_grocer_items_data.json')
      .then(response => response.json())
      .then(data => {
          foodItems = data;
          renderCards(foodItems);
      })
      .catch(error => {
          console.error('Error loading data:', error);
      });

  function renderCards(items) {
      container.innerHTML = ''; //clear existing cards
      items.forEach(item => {
          const box = document.createElement('div');
          box.className = 'box';

          box.innerHTML = `
              <h2>${item.item}</h2>
              <ul>
                  <li>Price: ${item.price}</li>
                  <li>Location: ${item.location}</li>
              </ul>
              <button>Edit</button>
          `;

          container.appendChild(box);
      });
  }

  function filterItems() {
      const query = searchBar.value.toLowerCase();
      const min = parseFloat(minPriceInput.value) || 0;
      const max = parseFloat(maxPriceInput.value) || Infinity;
  
      const filtered = foodItems.filter(item => {
          const titleMatch = item.item.toLowerCase().includes(query);
          const priceValue = parseFloat(item.price.replace(/[^0-9.]/g, ''));
          const priceMatch = priceValue >= min && priceValue <= max;
  
          return titleMatch && priceMatch;
      });
  
      renderCards(filtered);
  }

  //add listeners
  searchBar.addEventListener('input', filterItems);
  minPriceInput.addEventListener('input', filterItems);
  maxPriceInput.addEventListener('input', filterItems);
});


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
    <p><h3>${data.user.username}</h3></p>
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

async function getReviews(Location)
{
  // document.querySelector(".reviews-list p").style.display = "none";
  let locationName;
  if (Location == null)
  {
    locationName = document.getElementById("selected-location").innerText;
  }
  else
  {
    locationName = Location;
  }

  
  const response = await fetch(`/api/get_reviews?name=${encodeURIComponent(locationName)}`);

  const data = await response.json();
  const list = document.querySelector(".reviews-list");
  list.innerHTML = "";

  console.log(data);

  const userMap = {};
  data.users.forEach(user => {
    userMap[user.user_id] = user.username;
  });


  data.reviews.forEach(review => {
    const user = userMap[review.user_id];
    const reviewDiv = document.createElement("div");
    reviewDiv.classList.add("review-item"); // optional for styling

    reviewDiv.innerHTML = `
      <p><h3>${user}</h3></p>
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
    document.querySelector(".form--forgot-password").classList.remove("form--active");
  } 
  else if (selected === "Login")
  {
    document.querySelector(".form--login").classList.add("form--active");
    document.querySelector(".form--signup").classList.remove("form--active");
    document.querySelector(".form--forgot-password").classList.remove("form--active");
  }
  else
  {
    document.querySelector(".form--login").classList.remove("form--active");
    document.querySelector(".form--signup").classList.remove("form--active");
    document.querySelector(".form--forgot-password").classList.add("form--active");
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