document.addEventListener("DOMContentLoaded", async function () {
  try {
    console.log("Initializing marker map...");

    const response = await fetch("/api/locations");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    console.log("Database Data Loaded:", data);

    const markerMap = L.map("marker-map").setView([40.6782, -73.9442], 12); // Brooklyn

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(markerMap);

    data.forEach(entry => {
      const {
        latitude,
        longitude,
        name,
        type,
        contact_info,
        address,        // or: street_address
        borough,
        zip_code,
        days_open,      // if these exist in DB
        hours_open
      } = entry;

      if (latitude && longitude) {
        const marker = L.marker([parseFloat(latitude), parseFloat(longitude)]);

        const popupContent = `
          <strong>${name || "Food Resource"}</strong><br>
          <em>Type:</em> ${type || "N/A"}<br>
          <em>Address:</em> ${address || "N/A"}, ${borough || ""}, NY ${zip_code || ""}<br>
          <em>Contact:</em> ${contact_info || "N/A"}<br>
          <em>Open:</em> ${days_open || "N/A"}<br>
          <em>Hours:</em> ${hours_open || "N/A"}
        `;

        marker.bindPopup(popupContent);
        marker.bindTooltip(name || "Food Resource");
        marker.addTo(markerMap);
      }
    });

    console.log("Marker map loaded!");
  } catch (error) {
    console.error("Error loading marker map:", error);
  }

  displaySavedLocations();
});


//leaflet map
document.addEventListener("DOMContentLoaded", async function () {
    try {
        console.log("Initializing maps...");

        //load JSON data
        const response = await fetch("/data/nyc_data.json");
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

        // 🔥 Add your heatmap
        L.heatLayer(heatmapData, {
            radius: 35,
            blur: 20,
            maxZoom: 15,
            gradient: {
                0.1: "blue",
                0.3: "cyan",
                0.5: "lime",
                0.7: "yellow",
                1.0: "red"
            }
        }).addTo(heatmap);


        //zoom-based circular population markers
        const labelMarkers = [];

        
        fetch("data/nyc_nta_pop.geojson")
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            const sortedFeatures = data.features
              .filter(f => f.properties.population)
              .sort((a, b) => b.properties.population - a.properties.population);
              
            sortedFeatures.forEach((feature, i) => {
              const name = feature.properties.name;
              const pop = feature.properties.population || 0;
              const centerCoords = turf.centerOfMass(feature).geometry.coordinates;
              const center = [centerCoords[1], centerCoords[0]];

              

              let minZoom;
              if (i < 5) minZoom = 10;
              else if (i < 10) minZoom = 11;
              else if (i < 20) minZoom = 12;
              else if (i < 40) minZoom = 13;
              else minZoom = 14;

              

              const marker = L.marker(center, {
                icon: L.divIcon({
                  className: "population-label",
                  html: `<div class="bubble-text">
                          <strong>${name}</strong><br>
                          Population: ${pop.toLocaleString()}
                        </div>`
                })
              });

              

              labelMarkers.push({ marker, minZoom });

              if (heatmap.getZoom() >= minZoom) {
                marker.addTo(heatmap);
              }
            });

            function updateVisibleMarkers() {
              const zoom = heatmap.getZoom();
              labelMarkers.forEach(({ marker, minZoom }) => {
                if (zoom >= minZoom) {
                  if (!heatmap.hasLayer(marker)) marker.addTo(heatmap);
                } else {
                  if (heatmap.hasLayer(marker)) heatmap.removeLayer(marker);
                }
              });
            }

            updateVisibleMarkers();
            heatmap.on("zoomend", updateVisibleMarkers);
          })
          .catch(err => {
            console.error("Failed to load GeoJSON or render markers:", err);
            alert("Failed to load population data for the map.");
          });


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
    if (createReviewBtn) {
        createReviewBtn.addEventListener('click', function () {
            if (!currentLocation) {
                alert('Please select a location first by clicking on a map marker.');
                return;
            }
            reviewFormContainer.classList.add('active');
        });
    }

    //close overlay
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', function () {
            reviewFormContainer.classList.remove('active');
        });
    }

    //submit
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', function () {
            const name = document.getElementById('reviewer-name')?.value.trim() || 'Anonymous';
            const comment = document.getElementById('review-comment')?.value.trim() || 'No comment provided.';

            if (currentRatings.price === 0 || currentRatings.quality === 0) {
                alert('Please rate both price and quality.');
                return;
            }

            const review = {
                locationName: currentLocation.Name,
                name,
                comment,
                ratings: { ...currentRatings },
                date: new Date().toLocaleDateString()
            };

            if (!reviewStore[review.locationName]) reviewStore[review.locationName] = [];
            reviewStore[review.locationName].push(review);
            displayReviewsForLocation(review.locationName);

            // Reset form
            document.getElementById('reviewer-name').value = '';
            document.getElementById('review-comment').value = '';
            document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
            currentRatings = { price: 0, quality: 0 };
            reviewFormContainer.classList.remove('active');
        });
    }

  //display reviews
  function displayReviewsForLocation(locationName) 
  {
    reviewsList.innerHTML = '';
    const reviews = reviewStore[locationName] || [];

    if (reviews.length === 0) 
    {
      reviewsList.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
      return;
    }

    reviews.forEach(review => {
      const div = document.createElement('div');
      div.className = 'review-item';
      div.innerHTML = `
          <div class="review-header">
              <span class="review-author">${review.name}</span>
              <span class="review-date">${review.date}</span>
          </div>
          <div class="review-ratings">
              <div class="review-rating"><span>Price:</span><span>${'★'.repeat(review.ratings.price)}</span></div>
              <div class="review-rating"><span>Quality:</span><span>${'★'.repeat(review.ratings.quality)}</span></div>
          </div>
          <div class="review-content">${review.comment}</div>
      `;
      reviewsList.appendChild(div);
    });
  }


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

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector('input[name="username"]').value;
    const password = document.querySelector('input[name="password"]').value;

    document.querySelector(".alert").style.display = "block";

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

      // window.location.href = "/"; 

      console.log(localStorage.getItem("token"));

      document.querySelector(".alert").classList.remove("fail");
      document.querySelector(".alert").classList.add("success");
      document.querySelector(".closebtn").nextSibling.textContent = "Login Successful";

    } 
    else 
    {
      document.querySelector(".alert").classList.remove("success");
      document.querySelector(".alert").classList.add("fail");
      document.querySelector(".closebtn").nextSibling.textContent = "Login failed. Invalid Username or Password";

    }

    document.querySelector(".popup").style.display = "none";
  });

  // document.getElementById("signupForm").addEventListener("submit", async (event) => {


  //   event.preventDefault();


  //   if (isSubmitting) return event.preventDefault(); // prevent double submit
  //   isSubmitting = true;


  //   const email = document.querySelector('input[name="email"]').value;
  //   const username = document.querySelector('input[name="username_s"]').value;
  //   const password = document.querySelector('input[name="password_s"]').value;
  //   const zip_code = document.querySelector('input[name="zip_code"]').value;

  //   document.querySelector(".alert").style.display = "block";

  //   const response = await fetch("/api/new_user", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email, username, password, zip_code }),
  //   });
    
  //   const data = await response.json();

  //   if (response.ok) 
  //   {
  //     if (localStorage.getItem("token"))
  //     {
  //       localStorage.removeItem("token");
  //     }
  //     localStorage.setItem("token", data.token);

  //     // window.location.href = "/"; 

  //     console.log(localStorage.getItem("token"));

  //     document.querySelector(".alert").classList.remove("fail");
  //     document.querySelector(".alert").classList.add("success");
  //     document.querySelector(".closebtn").nextSibling.textContent = "User created successfully";

  //   } 
  //   else 
  //   {

  //     console.log(data.error);
  //     document.querySelector(".alert").classList.remove("success");
  //     document.querySelector(".alert").classList.add("fail");
  //     document.querySelector(".closebtn").nextSibling.textContent = data.error;

  //   }

  //   document.querySelector(".popup").style.display = "none";
  //   isSubmitting = false;
  // });
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

  console.log("Saved Locations",data.savedLocation[0].FoodLocation.name);

  data.savedLocation.forEach(location => {
    const li = document.createElement('li');
    li.classList.add('location-item'); // optional: for styling or logic

    li.innerHTML = `
        <h3 class="location-name">${location.FoodLocation.name}</h3>
        <p class="location-address"><span>Address:</span>${location.FoodLocation.address}</p>
        <div class="bookmark">
            <img class="empty" src="/imgs/Bookmark.svg">
            <img class="filled active" src="/imgs/Bookmark-Filled.svg">
        </div>
    `;

    resultsList.appendChild(li);
  });
  bookmarkSwitch();



}

// Submit Zip Code or Borough and display Locations and Reviews
function findLocation() {
  const form = document.getElementById("find-location");

  form.addEventListener("submit", async (event) => {
    console.log("Search In Progress");
    event.preventDefault();

    const searchInput = form.querySelector('.search-input');
    const search = encodeURIComponent(searchInput.value.trim());
    if (!search) return;

    try {
      const response = await fetch(`/api/get_locations/search?search=${search}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();

      console.log(data);

      const locationContainer = document.getElementById("location-area");
      locationContainer.innerText = searchInput.value;

      const resultsList = document.querySelector(".location-list");
      resultsList.innerHTML = "";

      const locations = data.locations;
      const reviews = data.reviews;

      const reviewsByLocation = {};
      reviews.forEach(review => {
        if (!reviewsByLocation[review.location_id]) {
          reviewsByLocation[review.location_id] = [];
        }
        reviewsByLocation[review.location_id].push(review);
      });

      if (Array.isArray(locations) && locations.length) {
        locations.forEach(location => {
          const li = document.createElement('div');
          li.classList.add("location-item");

          // Handle click for selection + review
          li.onclick = function () {
            selectedLocation(location.name);
            getReviews();
          };

          // Create bookmark markup with 'active' class if already saved
          const filledClass = location.saved ? "filled active" : "filled";

          li.innerHTML = `
            <h3 class="location-name">${location.name}</h3>
            <p class="location-address"><span>Address:</span>${location.address}</p>
            <div class="bookmark">
              <img class="empty" src="/imgs/Bookmark.svg">
              <img class="${filledClass}" src="/imgs/Bookmark-Filled.svg">
            </div>
          `;

          // Rating section
          const locationReviews = reviewsByLocation[location.location_id] || [];
          const ratingP = document.createElement('p');

          if (locationReviews.length) {
            let totalRating = 0;
            locationReviews.forEach(review => {
              totalRating += review.price_rating + review.quality_rating;
            });

            const avgRating = totalRating / (locationReviews.length * 10);
            const stars = "★".repeat(Math.round(avgRating * 5));
            ratingP.innerHTML = `<span>Rating:</span> ${stars}`;
          } else {
            ratingP.innerHTML = `<span>Rating:</span> N/A`;
          }

          li.appendChild(ratingP);
          resultsList.appendChild(li);
        });
      } else {
        resultsList.innerHTML = '<h3>No Results Found</h3>';
      }

      // After new DOM is rendered
      bookmarkSwitch();

    } catch (err) {
      console.error("Fetch error:", err);
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('items-container');
  const searchBar = document.getElementById('search-bar');
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');

  const addItem = document.getElementById('add-item-btn');
  const addItemPopup = document.querySelector('.add-item');
  const closePopup = document.querySelector('.close-popup');
  const addItemForm = document.getElementById('add-item-form');

  let foodItems = [];

  fetch('/api/get_fooditems')
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
          `;
            // <button>Edit</button>

          container.appendChild(box);
      });
  }

  addItem.addEventListener('click', () => {
        //reset form for new item
        document.querySelector('.add-item h2').textContent = 'Add New Item';
        addItemForm.reset();
        editIndex = null;
        addItemPopup.classList.add('active');
    });

    closePopup.addEventListener('click', () => {
        addItemPopup.classList.remove('active');
        addItemForm.reset();
        editIndex = null;
    });

    addItemPopup.addEventListener('click', (e) => {
        if (e.target === addItemPopup) {
            addItemPopup.classList.remove('active');
            addItemForm.reset();
            editIndex = null;
        }
  });

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

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('items-container');
    const searchBar = document.getElementById('search-bar');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');

    const addItem = document.getElementById('add-item-btn');
    const addItemPopup = document.querySelector('.add-item');
    const closePopup = document.querySelector('.close-popup');
    const addItemForm = document.getElementById('add-item-form');

    let foodItems = [
        { item: "Apples", price: "$2.99", location: "Whole Foods Market - Gowanus" },
        { item: "Bread", price: "$3.50", location: "Key Food - Park Slope" }
    ];

    let editIndex = null;

    function renderCards(items) {
        container.innerHTML = ''; //clears cards
        items.forEach((item, index) => {
            const box = document.createElement('div');
            box.className = 'box';

            box.innerHTML = `
                <h2>${item.item}</h2>
                <ul>
                    <li>Price: ${item.price}</li>
                    <li>Location: ${item.location}</li>
                </ul>
                <button class="edit-btn" data-index="${index}">Edit</button>
            `;

            container.appendChild(box);
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                openEditForm(index);
            });
        });
    }

    



    renderCards(foodItems);
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
    <div class="review-header">
        <span class="review-author">${data.user.username}</span>
    </div>
    <div class="review-ratings">
        <div class="review-rating"><span>Price:</span><span>${'★'.repeat(Math.round(price_rating))}</span></div>
        <div class="review-rating"><span>Quality:</span><span>${'★'.repeat(Math.round(quality_rating))}</span></div>
    </div>
    <div class="review-content">${review}</div>
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
      <div class="review-header">
        <span class="review-author">${user}</span>
      </div>
      <div class="review-ratings">
          <div class="review-rating"><span>Price:</span><span>${'★'.repeat(Math.round(review.price_rating))}</span></div>
          <div class="review-rating"><span>Quality:</span><span>${'★'.repeat(Math.round(review.quality_rating))}</span></div>
      </div>
      <div class="review-content">${review.comment}</div>
    `;

    list.appendChild(reviewDiv);
  });

}

function bookmarkSwitch() {
  const bookmarks = document.querySelectorAll('.bookmark');


  bookmarks.forEach(bookmark => {
    console.log("Bookmark button");
      const emptyIcon = bookmark.querySelector('.empty');
      const filledIcon = bookmark.querySelector('.filled');

      bookmark.addEventListener('click', async () => {
        filledIcon.classList.toggle('active');

        const name = bookmark.closest('.location-item').querySelector('.location-name').textContent.trim();
        const address = bookmark.closest('.location-item').querySelector('.location-address').textContent.replace('Address:', '').trim();


        try {
          
          const response = await fetch('/api/toggle_location', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({ name, address })
          });

          const result = await response.json();
          console.log(result.message);
        } catch (err) {
            console.error('Failed to save location:', err);
        }

      });
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