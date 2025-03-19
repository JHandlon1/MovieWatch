const JSONBIN_URL = "https://api.jsonbin.io/v3/b/67dad3be8960c979a574bef2";
const JSONBIN_KEY = "$2a$10$feXF0Nv/uJK85zfH6Sq1WOWMG5GVviV6urtRl16EAh38dsAozwelq";

let movieData = [];
let listNames = ["All Movies"];  // Add "All Movies" as a default list
let currentList = "All Movies";

// Functions to modify movie title content
function setTitleContent(movie) {
    movie.titleContent = movie.title;
    return movie;
}

function appendYear(movie) {
    movie.titleContent += " (" + movie.year + ")";
    return movie;
}

function appendRuntime(movie) {
    movie.titleContent += " - " + movie.runtime + " minutes";
    return movie;
}

// Function to update JSONBin
function updateJSONBin(newData, callback) {
    fetch(JSONBIN_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-Master-Key": JSONBIN_KEY
        },
        body: JSON.stringify(newData)
    })
    .then(response => response.json())
    .then(data => {
        console.log("JSON Updated:", data);
        if (callback) callback();
    })
    .catch(error => console.error("Error updating JSON:", error));
}

// Function to display movies based on the selected list
function displayMovies() {
    let ul = document.querySelector("#target");
    ul.innerHTML = "";

    let filteredMovies = currentList === "All Movies" 
        ? movieData 
        : movieData.filter(movie => movie.list.includes(currentList));

    filteredMovies.forEach(movie => addMovieToUI(movie));

    document.getElementById("target-label").textContent = `Number of entries: ${filteredMovies.length}`;
}

// Function to add a movie to the UI
function addMovieToUI(movie) {
    let ul = document.querySelector("#target");
    setTitleContent(movie);
    appendYear(movie);
    appendRuntime(movie);

    let item = document.createElement('li');
    item.classList.add('list-group-item', 'bg-dark', 'text-light');
    item.textContent = movie.titleContent;

    // Create a delete button
    let deleteBtn = document.createElement('button');
    deleteBtn.textContent = "❌";
    deleteBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-2');
    deleteBtn.onclick = () => removeMovie(movie);

    // Create an edit button
    let editBtn = document.createElement('button');
    editBtn.textContent = "✏️";
    editBtn.classList.add('btn', 'btn-warning', 'btn-sm', 'ms-2');
    editBtn.onclick = () => startEditingMovie(movie, item);

    // Create an "Modify Lists" button
    let modifyListsBtn = document.createElement('button');
    modifyListsBtn.textContent = "📋";
    modifyListsBtn.classList.add('btn', 'btn-info', 'btn-sm', 'ms-2');
    modifyListsBtn.onclick = () => modifyMovieLists(movie, item);

    item.appendChild(deleteBtn);
    item.appendChild(editBtn);
    item.appendChild(modifyListsBtn);
    ul.append(item);
}

// Function to add a new movie
document.getElementById("add-movie-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const year = document.getElementById("year").value;
    const runtime = document.getElementById("runtime").value;

    if (!title || !year || !runtime) {
        alert("Please fill out all fields.");
        return;
    }

    const newMovie = {
        title,
        year: parseInt(year),
        runtime: parseInt(runtime),
        list: [currentList] // Initialize with the current list
    };

    fetch(`${JSONBIN_URL}/latest`, {
        headers: { "X-Master-Key": JSONBIN_KEY }
    })
    .then(response => response.json())
    .then(ob => {
        let data = ob.record;
        data.push(newMovie);
        updateJSONBin(data, () => {
            movieData.push(newMovie);
            displayMovies();
        });
    })
    .catch(error => console.error("Error fetching JSON:", error));

    document.getElementById("add-movie-form").reset();
});

// Function to remove a movie
function removeMovie(movieToRemove) {
    fetch(`${JSONBIN_URL}/latest`, {
        headers: { "X-Master-Key": JSONBIN_KEY }
    })
    .then(response => response.json())
    .then(ob => {
        let data = ob.record;

        let updatedData = data.filter(movie => 
            movie.title !== movieToRemove.title || 
            movie.year !== movieToRemove.year || 
            movie.runtime !== movieToRemove.runtime
        );

        updateJSONBin(updatedData, () => {
            movieData = updatedData;
            displayMovies();
        });
    })
    .catch(error => console.error("Error fetching JSON:", error));
}

// Fetch and display movies on page load
(function () {
    fetch(`${JSONBIN_URL}/latest`, {
        headers: { "X-Master-Key": JSONBIN_KEY }
    })
    .then(response => response.json())
    .then(ob => {
        movieData = ob.record;
        movieData.forEach(movie => {
            movie.list.forEach(listName => {
                if (!listNames.includes(listName)) {
                    listNames.push(listName);  // Add new list names to the list
                }
            });
        });
        populateListNavigation();
        displayMovies();
    })
    .catch(error => console.error("Error fetching JSON:", error));
})();

// Function to populate the list navigation with existing list names
function populateListNavigation() {
    let listNav = document.getElementById("list-nav");
    listNav.innerHTML = "";  // Clear existing list names

    listNames.forEach(listName => {
        let newList = document.createElement("li");
        newList.className = "nav-item";
        newList.innerHTML = `<a class="nav-link" href="#" data-list="${listName}">${listName}</a>`;
        listNav.appendChild(newList);
    });
}

// Function to add a new list
document.getElementById("add-list-btn").addEventListener("click", function () {
    const listNav = document.getElementById("list-nav");
    const listName = prompt("Enter new list name:");
    
    if (listName && listName.trim() !== "" && !listNames.includes(listName)) {
        listNames.push(listName);  // Add the new list name to the listNames array
        populateListNavigation();  // Update the navigation
    }
});

// Function to handle list selection
document.getElementById("list-nav").addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
        currentList = event.target.dataset.list;
        document.querySelectorAll("#list-nav .nav-link").forEach(link => link.classList.remove("active"));
        event.target.classList.add("active");
        displayMovies();
    }
});

// Apply filters on button click
document.getElementById('apply-filters').addEventListener('click', function () {
    let minYear = parseInt(document.getElementById('min-year').value) || 0;
    let maxYear = parseInt(document.getElementById('max-year').value) || 9999;
    let minRuntime = parseInt(document.getElementById('min-runtime').value) || 0;
    let maxRuntime = parseInt(document.getElementById('max-runtime').value) || 9999;

    let filteredMovies = movieData.filter(movie => 
        movie.year >= minYear && movie.year <= maxYear &&
        movie.runtime >= minRuntime && movie.runtime <= maxRuntime
    );

    let ul = document.querySelector('#target');
    ul.innerHTML = '';

    filteredMovies.forEach(movie => addMovieToUI(movie));

    document.getElementById("target-label").textContent = `Number of entries: ${filteredMovies.length}`;
});

// Function to pick a random movie from the current list
function pickRandomMovie() {
    let ul = document.querySelector('#target');
    let movieItems = ul.children;

    if (movieItems.length === 0) {
        alert("No movies in the list.");
        return;
    }

    let randomIndex = Math.floor(Math.random() * movieItems.length);
    let randomMovie = movieItems[randomIndex];

    randomMovie.classList.add('selected');

    setTimeout(() => {
        randomMovie.classList.remove('selected');
    }, 2000);
}

// Add event listener for the random movie button
document.getElementById('random-movie-btn').addEventListener('click', pickRandomMovie);

// Function to handle movie editing
function startEditingMovie(movie, item) {
    // Create a temporary inline form to edit movie details
    let editForm = document.createElement('div');
    editForm.classList.add('d-flex', 'align-items-center', 'my-2');

    let titleInput = document.createElement('input');
    titleInput.value = movie.title;
    titleInput.classList.add('form-control', 'me-2');
    editForm.appendChild(titleInput);

    let yearInput = document.createElement('input');
    yearInput.value = movie.year;
    yearInput.classList.add('form-control', 'me-2');
    editForm.appendChild(yearInput);

    let runtimeInput = document.createElement('input');
    runtimeInput.value = movie.runtime;
    runtimeInput.classList.add('form-control', 'me-2');
    editForm.appendChild(runtimeInput);

    let saveBtn = document.createElement('button');
    saveBtn.textContent = "Save";
    saveBtn.classList.add('btn', 'btn-success', 'btn-sm', 'ms-2');
    saveBtn.onclick = () => saveMovieChanges(movie, titleInput.value, yearInput.value, runtimeInput.value, item, editForm);

    let cancelBtn = document.createElement('button');
    cancelBtn.textContent = "Cancel";
    cancelBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'ms-2');
    cancelBtn.onclick = () => cancelEditing(editForm, item);

    editForm.appendChild(saveBtn);
    editForm.appendChild(cancelBtn);

    item.innerHTML = '';
    item.appendChild(editForm);
}

// Function to save the edited movie
function saveMovieChanges(movie, newTitle, newYear, newRuntime, item, editForm) {
    movie.title = newTitle;
    movie.year = parseInt(newYear);
    movie.runtime = parseInt(newRuntime);

    // Update the movie in the JSON data
    fetch(`${JSONBIN_URL}/latest`, {
        headers: { "X-Master-Key": JSONBIN_KEY }
    })
    .then(response => response.json())
    .then(ob => {
        let data = ob.record;
        let movieIndex = data.findIndex(m => m.title === movie.title && m.year === movie.year && m.runtime === movie.runtime);
        if (movieIndex !== -1) {
            data[movieIndex] = movie;  // Replace the old movie with the updated one
            updateJSONBin(data, () => {
                // Update the movieData array and UI
                movieData[movieIndex] = movie;
                item.innerHTML = '';  // Clear the old item
                addMovieToUI(movie);  // Add the updated movie to the UI
            });
        }
    })
    .catch(error => console.error("Error fetching JSON:", error));

    editForm.remove(); // Remove the editing form
}

// Function to cancel the editing
function cancelEditing(editForm, item) {
    editForm.remove();
    addMovieToUI(movieData.find(m => m.title === item.textContent.trim()));
}

// Function to modify the lists a movie is part of
function modifyMovieLists(movie, item) {
    let newList = prompt("Enter the list(s) to add/remove the movie from, separated by commas (e.g., 'Action, Comedy'):").split(",").map(list => list.trim());

    // Remove duplicates from the lists
    newList = [...new Set(newList)];

    // Update the movie's list field
    movie.list = newList;

    // Update the movie in the backend
    fetch(`${JSONBIN_URL}/latest`, {
        headers: { "X-Master-Key": JSONBIN_KEY }
    })
    .then(response => response.json())
    .then(ob => {
        let data = ob.record;
        let movieIndex = data.findIndex(m => m.title === movie.title && m.year === movie.year && m.runtime === movie.runtime);
        if (movieIndex !== -1) {
            data[movieIndex] = movie;  // Update the movie's list
            updateJSONBin(data, () => {
                movieData[movieIndex] = movie;
                displayMovies();
            });
        }
    })
    .catch(error => console.error("Error fetching JSON:", error));
}
