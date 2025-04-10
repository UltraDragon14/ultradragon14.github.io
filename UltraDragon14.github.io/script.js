var markers = {};
var selectedMarker = null;
var selectedColor = 'red';
var zoomLevel = 1;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 4.0;
let panX = 0, panY = 0;
let isPanning = false;
let startX = 0, startY = 0;

document.getElementById('mapUpload').addEventListener('change', function(event) {
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var uploadedMap = document.getElementById('uploadedMap');
            uploadedMap.src = e.target.result;
            uploadedMap.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        selectedColor = this.dataset.color;
    });
});

document.getElementById('noteContent').addEventListener('input', function() {
    if (selectedMarker !== null) {
        markers[selectedMarker].note = this.value;
    }
});

document.getElementById('removeMarker').addEventListener('click', function() {
    if (selectedMarker !== null) {
        const markerElement = document.querySelector(`.marker[data-id='${selectedMarker}']`);
        if (markerElement) markerElement.remove();
        delete markers[selectedMarker];
        selectedMarker = null;
        document.getElementById('noteContent').value = '';
    }
});

document.getElementById('mapContainer').addEventListener('wheel', function(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
        zoomLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
    } else {
        zoomLevel = Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM);
    }
    updateTransform();
});

document.getElementById('zoomIn').addEventListener('click', function() {
    zoomLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
    updateTransform();
});

document.getElementById('zoomOut').addEventListener('click', function() {
    zoomLevel = Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM);
    updateTransform();
});

document.getElementById('mapContainer').addEventListener('mousedown', function(e) {
    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
});

document.addEventListener('mouseup', function() {
    isPanning = false;
});

document.addEventListener('mousemove', function(e) {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
});

function updateTransform() {
    document.getElementById('mapZoom').style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

function placeMarker(event) {
    if (event.target.classList.contains('marker')) return;

    var mapZoom = document.getElementById('mapZoom');
    var rect = mapZoom.getBoundingClientRect();

    var id = Date.now();
    var x = (event.clientX - rect.left) / rect.width * 100;
    var y = (event.clientY - rect.top) / rect.height * 100;

    var marker = document.createElement('div');
    marker.classList.add('marker');
    marker.style.left = x + '%';
    marker.style.top = y + '%';
    marker.style.backgroundColor = selectedColor;
    marker.dataset.id = id;
    marker.onclick = function(event) {
        event.stopPropagation();
        selectMarker(id);
    };

    markers[id] = { x: x, y: y, note: "", color: selectedColor };
    document.getElementById('markers').appendChild(marker);
}

function selectMarker(id) {
    document.querySelectorAll('.marker').forEach(m => m.classList.remove('selected'));
    const selectedEl = document.querySelector(`.marker[data-id='${id}']`);
    if (selectedEl) selectedEl.classList.add('selected');
    selectedMarker = id;
    document.getElementById('noteContent').value = markers[id]?.note || '';
}

function updateTransform() {
    document.getElementById('mapZoom').style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
}

function zoomIn() {
    zoomLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
    updateTransform();
}
