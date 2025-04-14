let zoomLevel = 1;
let selectedColor = 'red';
let selectedMarker = null;
let markerNotes = new Map(); // Stores notes by marker element

const mapZoom = document.getElementById('mapZoom');
const uploadedMap = document.getElementById('uploadedMap');
const mapUpload = document.getElementById('mapUpload');
const markersContainer = document.getElementById('markers');
const noteContent = document.getElementById('noteContent');
const removeButton = document.getElementById('removeMarker');

// --- Upload Map Image ---
mapUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
            uploadedMap.src = reader.result;
            uploadedMap.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// --- Select Marker Color ---
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedColor = option.getAttribute('data-color');
    });
});

// --- Add Marker on Click ---
mapZoom.addEventListener('click', (e) => {
    if (!uploadedMap.src) return;

    const rect = mapZoom.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

    const marker = document.createElement('div');
    marker.className = 'marker';
    marker.style.backgroundColor = selectedColor;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;

    marker.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent map click
        selectMarker(marker);
    });

    markersContainer.appendChild(marker);
    selectMarker(marker);
});

// --- Select Marker ---
function selectMarker(marker) {
    if (selectedMarker) selectedMarker.classList.remove('selected');
    selectedMarker = marker;
    marker.classList.add('selected');

    const note = markerNotes.get(marker) || '';
    noteContent.value = note;
}

// --- Update Notes ---
noteContent.addEventListener('input', () => {
    if (selectedMarker) {
        markerNotes.set(selectedMarker, noteContent.value);
    }
});

// --- Remove Marker ---
removeButton.addEventListener('click', () => {
    if (selectedMarker) {
        markerNotes.delete(selectedMarker);
        selectedMarker.remove();
        selectedMarker = null;
        noteContent.value = '';
    }
});

// --- Zoom Controls ---
document.getElementById('zoomIn').addEventListener('click', () => {
    zoomLevel *= 1.2;
    mapZoom.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;
});
document.getElementById('zoomOut').addEventListener('click', () => {
    zoomLevel /= 1.2;
    mapZoom.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;
});

// --- Map Dragging ---
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };

const mapContainer = document.getElementById('mapContainer');

mapContainer.addEventListener('mousedown', (e) => {
    // Only drag when no marker is selected
    if (!selectedMarker) {
        isDragging = true;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        mapContainer.style.cursor = 'grabbing';
    }
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        mapZoom.style.transform = `translate(${panOffset.x + dx}px, ${panOffset.y + dy}px) scale(${zoomLevel})`;
    }
});

window.addEventListener('mouseup', (e) => {
    if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        panOffset.x += dx;
        panOffset.y += dy;
        isDragging = false;
        mapContainer.style.cursor = 'grab';
    }
});

function getMapData() {
    const markers = [...markersContainer.children].map(marker => ({
        x: parseFloat(marker.style.left),
        y: parseFloat(marker.style.top),
        color: marker.style.backgroundColor,
        note: markerNotes.get(marker) || ''
    }));

    return {
        imageData: uploadedMap.src,
        markers,
        zoomLevel,
        panOffset
    };
}

function loadMapData(data) {
    uploadedMap.src = data.imageData;
    uploadedMap.style.display = 'block';
    zoomLevel = data.zoomLevel || 1;
    panOffset = data.panOffset || { x: 0, y: 0 };
    mapZoom.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;

    // Clear existing
    markersContainer.innerHTML = '';
    markerNotes.clear();
    selectedMarker = null;
    noteContent.value = '';

    data.markers.forEach(({ x, y, color, note }) => {
        const marker = document.createElement('div');
        marker.className = 'marker';
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        marker.style.backgroundColor = color;

        marker.addEventListener('click', (event) => {
            event.stopPropagation();
            selectMarker(marker);
        });

        markerNotes.set(marker, note);
        markersContainer.appendChild(marker);
    });
}

function saveMapToLocalStorage(name) {
    if (!name) return alert('Please enter a name to save this map.');
    const mapData = getMapData();
    const allMaps = JSON.parse(localStorage.getItem('scribingMaps') || '{}');
    allMaps[name] = mapData;
    localStorage.setItem('scribingMaps', JSON.stringify(allMaps));
    refreshMapDropdown();
}

function loadMapFromLocalStorage(name) {
    const allMaps = JSON.parse(localStorage.getItem('scribingMaps') || '{}');
    const data = allMaps[name];
    if (data) loadMapData(data);
}

function deleteMapFromLocalStorage(name) {
    const allMaps = JSON.parse(localStorage.getItem('scribingMaps') || '{}');
    delete allMaps[name];
    localStorage.setItem('scribingMaps', JSON.stringify(allMaps));
    refreshMapDropdown();
}

function refreshMapDropdown() {
    const dropdown = document.getElementById('loadMap');
    const allMaps = JSON.parse(localStorage.getItem('scribingMaps') || '{}');
    dropdown.innerHTML = '<option value="">-- Load Saved Map --</option>';
    Object.keys(allMaps).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option);
    });
}

document.getElementById('saveMap').addEventListener('click', () => {
    const name = document.getElementById('mapName').value.trim();
    saveMapToLocalStorage(name);
});

document.getElementById('loadMap').addEventListener('change', (e) => {
    const name = e.target.value;
    if (name) loadMapFromLocalStorage(name);
});

document.getElementById('deleteMap').addEventListener('click', () => {
    const dropdown = document.getElementById('loadMap');
    const name = dropdown.value;
    if (name && confirm(`Delete map "${name}"?`)) {
        deleteMapFromLocalStorage(name);
    }
});

// Initialize map list on page load
refreshMapDropdown();
