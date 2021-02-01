import React from "react";
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import "./mapSample.scss";

class MapSample extends React.Component {
  constructor() {
    super();
    this.state = {
      addLayerFlag: '2D',
    }
    this.defLocation = [174.79500011, -41.301107];
    this.positionList = [];
    this.iconUrlList = [];

  }
  initMap = () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiemhhbmdqaW5neXVhbiIsImEiOiJja2R5cHhoNXYycGVtMnlteXkwZGViZDc2In0.UhckH-74AgPwMsDhPjparQ';
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.defLocation,
      zoom: 12,
    });
  }
  getAllCar = () => {
    let positionList = [];
    let iconUrlList = [];
    axios.get('https://api.mevo.co.nz/public/vehicles/all')
      .then(res => {
        if (res.status === 200) {
          console.log(res);
          res.data.map((item) => {
            const { iconUrl, position } = item;
            var index = iconUrl.lastIndexOf("\/");
            let picUrl = '/api/';
            picUrl += iconUrl.substring(index + 1, iconUrl.length);
            iconUrlList = this.iconUrlList.push(picUrl);
            positionList = this.positionList.push({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [Number(position.longitude), Number(position.latitude)],
              },
            });

          });
          return { iconUrlList, positionList };
        }
      })
      .catch(error => console.log(error));
  }
  getHomeZones = () => {
    //home zones
    axios.get('https://api.mevo.co.nz/public/home-zones/all')
      .then(res => {
        if (res.status === 200) {
          console.log(res);
          const { geometry } = res.data.data;
          this.map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': {
              'type': 'geojson',
              'data': {
                'type': 'Feature',
                'geometry': {
                  'type': geometry.type,
                  'coordinates': geometry.coordinates,
                }
              }
            },
            'layout': {
              "line-join": "round",
              "line-cap": "round"
            },
            'paint': {
              'line-color': '#f7590d',
              "line-width": 3
            }
          });
        }
      })
      .catch(error => console.log(error));
  }
  addGeoControl = () => {
    //gps
    const MapboxDirections = window.MapboxDirections;
    const directions = new MapboxDirections({
      accessToken: mapboxgl.accessToken
    });
    this.directions = directions;
    this.map.addControl(directions, 'top-left');
    // Add geolocate control to the map.
    this.geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    });
    this.map.addControl(this.geolocate);
    this.geolocate.on('geolocate', function (e) {
      console.log('aaaaaaaaaaaaaaaaaaaaa');
      this.lon = e.coords.longitude;
      this.lat = e.coords.latitude
      const position = [this.lon, this.lat];
      sessionStorage.setItem('position', position);
      directions.setOrigin(position);
      directions.setDestination([174.79500011, -41.301107]);//use api to find the car near me
    });
  }
  AddMarks = () => {
    this.positionList.map((result, index) => {
      console.log(result);
      const { geometry } = result;
      // create marker node
      const markerNode = document.createElement('div');
      markerNode.style.backgroundImage = `url(${this.iconUrlList[index]})`;
      markerNode.style.backgroundSize = 'cover';
      markerNode.style.width = '30px';
      markerNode.style.height = '40px';
      // add marker to map
      new mapboxgl.Marker(markerNode)
        .setLngLat(geometry.coordinates)
        .addTo(this.map);
    });
  }

  initAll = () => {
    this.initMap();
    this.getAllCar();
    // add navigation control (the +/- zoom buttons)
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this.addGeoControl();

    this.map.on('load', () => {
      this.AddMarks();
      this.getHomeZones();
    })
  }
  componentDidMount() {
    this.initAll();
  }


  //build 3D
  layer = () => {
    let point = sessionStorage.getItem('position');
    if (point) {
      point = point.split(",");
      point.forEach((item, index) => {
        point[index] = parseFloat(point[index])
      })
      console.log(point);
    }

    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/light-v10',
      center: point || this.defLocation,
      zoom: 17.5,
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });
    function rotateCamera(timestamp) {
      // clamp the rotation between 0 -360 degrees
      // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
      map.rotateTo((timestamp / 100) % 360, { duration: 0 });
      // Request the next frame of the animation.
      requestAnimationFrame(rotateCamera);
    }

    map.removeControl(this.directions);
    map.on('load', function () {
      rotateCamera(0);
      // Insert the layer beneath any symbol layer.
      var layers = map.getStyle().layers;
      console.log(layers);
      var labelLayerId;
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
          labelLayerId = layers[i].id;
          break;
        }
      }
      // add navigation control (the +/- zoom buttons)
      map.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 17,
        'paint': {
          'fill-extrusion-color': '#aaa',

          // use an 'interpolate' expression to add a smooth transition effect to the
          // buildings as the user zooms in
          'fill-extrusion-height': [
            "interpolate", ["linear"], ["zoom"],
            17, 0,
            17.05, ["get", "height"]
          ],
          'fill-extrusion-base': [
            "interpolate", ["linear"], ["zoom"],
            17, 0,
            17.05, ["get", "min_height"]
          ],
          'fill-extrusion-opacity': .6
        }
      }, labelLayerId);
      console.log(labelLayerId);
    });
  }

  changeLayer = () => {
    const { addLayerFlag } = this.state;
    if (addLayerFlag === '2D') {
      this.layer();
      this.setState({
        addLayerFlag: '3D',
      })
    } else if (addLayerFlag === '3D') {
      this.setState({
        addLayerFlag: '2D',
      })
      this.initAll();
    }
    sessionStorage.clear();
  }

  componentWillUnmount() {
    this.map.remove();
    sessionStorage.clear();
  }
  render() {
    const { addLayerFlag } = this.state;
    console.log(addLayerFlag);
    return (
      <div>
        <button id="menu" onClick={() => this.changeLayer()}>{addLayerFlag}</button>
        <div ref={el => this.mapContainer = el} style={{ height: '100vh', width: '100vw', position: 'absolute' }} />
      </div>
    );
  }
}

export default MapSample;