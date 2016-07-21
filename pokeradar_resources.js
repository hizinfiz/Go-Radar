// // CHANGE PROTOCOL TO HTTPS IF NECESSARY
// if (location.protocol !== "https:") {
//   location.protocol = 'https:';
// }

// ADD GOOGLE MAPS API TO DOCUMENT
jQuery(function($) {
    // Asynchronously Load the map API
    var script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBJzQIAU0gcP3GrtaLcnvrblPbzqJOYnCM&callback=map_api_loaded";
    document.body.appendChild(script);
});

// MAIN FUNCTIONS
function map_api_loaded() {
    navigator.geolocation.getCurrentPosition(handler);
}

function build_initial_map(location) {
  //Your position
  $('#map_canvas').html('');
  marker_obj = ["You", location.coords.latitude,location.coords.longitude];
  markers.push(marker_obj);
  infoWindowContent_obj = ['<div class="info_content"><h3>You</h3></div>'];
  infoWindowContent.push(infoWindowContent_obj);
  marker_images.push(trainer_sprite);
  create_map();
  first_load = false;
  build_map_update(location);
}

function handler(location) {
  if (first_load) {
        build_initial_map(location);
    }
  else {
    build_map_update(location);
  }
}

function show_popup() {
  var config = {
    apiKey: "AIzaSyBJzQIAU0gcP3GrtaLcnvrblPbzqJOYnCM",
    authDomain: "pokemonfinder-173a7.firebaseapp.com",
    databaseURL: "https://pokemonfinder-173a7.firebaseio.com",
    storageBucket: "",
    };
    firebase.initializeApp(config);
  firebase.database().ref('count').once('value').then(function(snapshot) {
      var numPageViews = (snapshot.val().pageViews);
      var plusOne = numPageViews+1
      firebase.database().ref('count').set({
        "pageViews" : plusOne
      });
  });
  // console.log("this function is called");
  //alert("Getting your current location...");
}

function create_map() {
    var map;
    var bounds = new google.maps.LatLngBounds();
    var mapOptions = {
        mapTypeId: 'roadmap'
    };

    // Display a map on the page
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    map.setTilt(45);

    // Display multiple markers on a map
    var infoWindow = new google.maps.InfoWindow(), marker, i;

    // Loop through our array of markers & place each one on the map
    for( i = 0; i < markers.length; i++ ) {
        var position = new google.maps.LatLng(markers[i][1], markers[i][2]);
        bounds.extend(position);
        marker = new google.maps.Marker({
            position: position,
            map: map,
            title: markers[i][0],
      icon: marker_images[i]
        });

        // Allow each marker to have an info window
        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infoWindow.setContent(infoWindowContent[i][0]);
                infoWindow.open(map, marker);
            }
        })(marker, i));

        // Automatically center the map fitting all markers on the screen
        map.fitBounds(bounds);
    }

    // Override our map zoom level once our fitBounds function runs (Make sure it only runs once)
    var boundsListener = google.maps.event.addListener((map), 'bounds_changed', function(event) {
        this.setZoom(18);
        google.maps.event.removeListener(boundsListener);
    });

}
