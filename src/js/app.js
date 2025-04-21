document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const earthquakesLayer = L.layerGroup().addTo(map);

  fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=' +   getDateForPeriod('week') + '&minmagnitude=4.5')
    .then(res => res.json())
    .then(data => {
      document.getElementById('earthquakes-list').innerHTML = '';

      data.features.forEach(quake => {
        addEarthquakeToMap(quake, earthquakesLayer);
        addEarthquakeToList(quake);
      });

    })
    .catch(error => {
      console.error('Ошибка загрузки данных:', error);
      document.getElementById('earthquakes-list').innerHTML = '<li>Ошибка загрузки данных.</li>'
    });

  function getDateForPeriod(period) {
    const date = new Date();
    switch(period) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
    }
    return date.toISOString().split('T')[0];
  }

  function addEarthquakeToMap(quake, layer) {
    const lat = quake.geometry.coordinates[1];
    const lng = quake.geometry.coordinates[0];
    const magnitude = quake.properties.mag;

    const radius = Math.max(5, magnitude * 2);
    const color = getMagnitudeColor(magnitude);

    const marker = L.circleMarker([lat, lng], {
      radius: radius,
      fillColor: color,
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.7
    }).addTo(layer);

    marker.bindPopup(createPopupContent(quake));

    marker.quakeId = quake.id;
  }

  function addEarthquakeToList(quake) {
    const listElement = document.getElementById('earthquakes-list');
    const listItem = document.createElement('li');
    listItem.classList.add('earthquake-item');

    const magnitude = quake.properties.mag;
    const magnitudeClass = getMagnitudeClass(magnitude);

    const location = quake.properties.place || 'Неизвестное положение';
    const time = new Date(quake.properties.time).toLocaleString();

    listItem.innerHTML = `
      <span class="magnitude" ${magnitudeClass}>${magnitude.toFixed(1)}</span>
      <div class="earthquake-info">
        <div class="location">${location}</div>
        <div class="time">${time}</div>
      </div>
    `;

    listItem.addEventListener('click', () => {
      const lat = quake.geometry.coordinates[1];
      const lng = quake.geometry.coordinates[0];

      map.setView([lat, lng], 6);

      earthquakesLayer.eachLayer(layer => {
        if (layer.quakeId === quake.id) {
          layer.openPopup();
        }
      });
    });

    listElement.appendChild(listItem);
  }

  function getMagnitudeColor(magnitude) {
    if (magnitude >= 6.0) return '#f44336';
    if (magnitude >= 5.0) return '#ff9800';
    return '#4caf50';
  }

  function getMagnitudeClass(magnitude) {
    if (magnitude >= 6.0) return 'magnitude-high';
    if (magnitude >= 5.0) return 'magnitude-medium';
    return 'magnitude-low';
  }

  function createPopupContent(quake) {
    const magnitude = quake.properties.mag;
    const location = quake.properties.place || 'Неизвестное положение';
    const depth = quake.geometry.coordinates[2];
    const time = new Date(quake.properties.time).toLocaleString();
    const url = quake.properties.url;

    return `
      <div class="popup-content">
        <h3>Землетрясение M${magnitude.toFixed(1)}</h3>
        <p><strong>Местоположение:</strong> ${location}</p>
        <p><strong>Глубина:</strong> ${depth} км</p>
        <p><strong>Время:</strong> ${time}</p>
        <p><a href="${url}" target="_blank">Подробнее на сайте USGS</a></p>
      </div>
    `;
  }

});