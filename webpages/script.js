//login system
document.addEventListener("DOMContentLoaded", function () {
    const popup = document.querySelector(".popup");
    const openPopup = document.getElementById("open-popup");
    const closePopup = document.querySelector(".popup__close");

    const forms = {
        login: document.querySelector(".form--login"),
        signup: document.querySelector(".form--signup"),
        reset: document.querySelector(".form--reset")
    };

    const formNavigationMap = {
        'sign up': 'signup',
        'login': 'login',
        'forgot password?': 'reset'
    };

    function showForm(formType) {
        Object.values(forms).forEach(form => {
            form.classList.remove("form--active");
        });
        forms[formType].classList.add("form--active");
    }

    openPopup.addEventListener("click", () => {
        popup.classList.add("popup--active");
        showForm('login');
    });

    closePopup.addEventListener("click", () => {
        popup.classList.remove("popup--active");
    });

    popup.addEventListener("click", (e) => {
        if (e.target === popup) {
            popup.classList.remove("popup--active");
        }
    });

    document.querySelectorAll(".form__toggle").forEach((toggle) => {
        toggle.addEventListener("click", (e) => {
            e.preventDefault();
            const toggleText = toggle.textContent.trim().toLowerCase();
            const formType = formNavigationMap[toggleText];
            
            if (formType) {
                showForm(formType);
            }
        });
    });

    showForm('login');
});


//leaflet map
document.addEventListener("DOMContentLoaded", async function () {
    try {
        console.log("Initializing maps...");

        //load JSON data
        const response = await fetch("data/nyc_data.json");
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
        .then(res => res.json())
        .then(data => {
            const sortedFeatures = data.features
                .filter(f => f.properties.population)
                .sort((a, b) => b.properties.population - a.properties.population);

            sortedFeatures.forEach((feature, i) => {
                const name = feature.properties.name;

            const pop = feature.properties.population || 0;

            const centerCoords = turf.centerOfMass(feature).geometry.coordinates;
            const center = [centerCoords[1], centerCoords[0]];

                //tier zoom level
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

                //add immediately if zoom level allows
                if (heatmap.getZoom() >= minZoom) {
                    marker.addTo(heatmap);
                }
            });

            //zoom listener: show/hide markers by tier
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

            updateVisibleMarkers(); // initial
            heatmap.on("zoomend", updateVisibleMarkers);
        });
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
    function displayReviewsForLocation(locationName) {
        reviewsList.innerHTML = '';
        const reviews = reviewStore[locationName] || [];

        if (reviews.length === 0) {
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
});


// item cards for compare pages + search, price filter
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

    function openEditForm(index) {
        const item = foodItems[index];
        editIndex = index;

        //change form titles for edit form
        document.querySelector('.add-item h2').textContent = 'Edit Item';
        document.getElementById('item-name').value = item.item;
        document.getElementById('item-price').value = parseFloat(item.price.replace('$', ''));
        document.getElementById('item-location').value = item.location;

        addItemPopup.classList.add('active');
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

    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newItem = {
            item: document.getElementById('item-name').value,
            price: `$${parseFloat(document.getElementById('item-price').value).toFixed(2)}`,
            location: document.getElementById('item-location').value
        };

        if (editIndex !== null) {
            //update existing item
            foodItems[editIndex] = newItem;
        } else {
            //add new item
            foodItems.push(newItem);
        }

        //reset form and change ui
        addItemForm.reset();
        addItemPopup.classList.remove('active');
        renderCards(foodItems);
        editIndex = null;
    });

    renderCards(foodItems);

    //POTENTIAL DATABASE CODE (not updated to include edit feature)
    /*
    const addItem = document.getElementById('add-item-btn');
    const addItemPopup = document.querySelector('.add-item');
    const closePopup = document.querySelector('.close-popup');
    const addItemForm = document.getElementById('add-item-form');

    let foodItems = [];
    let editIndex = null; // Track the index of the item being edited

    // Open menu for adding a new item
    addItem.addEventListener('click', () => {
        document.querySelector('.add-item h2').textContent = 'Add New Item';
        addItemForm.reset();
        editIndex = null; // Clear edit index
        addItemPopup.classList.add('active');
    });

    // Close menu
    closePopup.addEventListener('click', () => {
        addItemPopup.classList.remove('active');
        addItemForm.reset();
        editIndex = null; // Clear edit index
    });

    addItemPopup.addEventListener('click', (e) => {
        if (e.target === addItemPopup) {
            addItemPopup.classList.remove('active');
            addItemForm.reset();
            editIndex = null; // Clear edit index
        }
    });

    // Handle form submission
    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newItem = {
            item: document.getElementById('item-name').value,
            price: `$${parseFloat(document.getElementById('item-price').value).toFixed(2)}`,
            location: document.getElementById('item-location').value
        };

        try {
            if (editIndex !== null) {
                // Update existing item
                const response = await fetch(`/api/items/${editIndex}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newItem)
                });

                if (response.ok) {
                    foodItems[editIndex] = newItem;
                    renderCards(foodItems);
                    addItemForm.reset();
                    addItemPopup.classList.remove('active');
                    editIndex = null; // Clear edit index
                } else {
                    throw new Error('Failed to update item');
                }
            } else {
                // Add new item
                const response = await fetch('/api/items', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newItem)
                });

                if (response.ok) {
                    foodItems.push(newItem);
                    renderCards(foodItems);
                    addItemForm.reset();
                    addItemPopup.classList.remove('active');
                } else {
                    throw new Error('Failed to add item');
                }
            }
        } catch (error) {
            console.error('Error handling item:', error);
            alert('Failed to process item. Please try again.');
        }
    });

    // Fetch initial data from JSON
    fetch('data/bk_grocer_items_data.json')
        .then(response => response.json())
        .then(data => {
            foodItems = data;
            renderCards(foodItems);
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });

    // Render cards
    function renderCards(items) {
        const container = document.getElementById('items-container');
        container.innerHTML = ''; // Clear existing cards
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

        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                openEditForm(index);
            });
        });
    }

    // Open edit form
    function openEditForm(index) {
        const item = foodItems[index];
        editIndex = index; // Set the index of the item being edited

        // Update form title and pre-fill form fields
        document.querySelector('.add-item h2').textContent = 'Edit Item';
        document.getElementById('item-name').value = item.item;
        document.getElementById('item-price').value = parseFloat(item.price.replace('$', ''));
        document.getElementById('item-location').value = item.location;

        // Show the popup
        addItemPopup.classList.add('active');
    }
        */
});


//bookmark switch
document.addEventListener('DOMContentLoaded', () => {
    const bookmarks = document.querySelectorAll('.bookmark');

    bookmarks.forEach(bookmark => {
        const emptyIcon = bookmark.querySelector('.empty');
        const filledIcon = bookmark.querySelector('.filled');

        bookmark.addEventListener('click', () => {
            filledIcon.classList.toggle('active');
        });
    });
});