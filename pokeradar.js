// MODIFIED POKERADAR CODE; ORIGINAL CODE IS FROM POKERADAR.XYZ

// VARIABLES
var markers = [];
var infoWindowContent = [];
var marker_images = [];
var first_load = true;
var square_distance = 0.0000449 * 50;
var has_error = false;
// var trainer_sprite = "http://img3.wikia.nocookie.net/__cb20140219220430/fantendo/images/0/0b/Pokemon_trainer_red_sprite_by_jamesrayle-d49b1km.png";
var trainer_sprite = "./pokemaniac.png";
var quadrants_loaded = 0;
var quad_data = [];


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

// FUNCTION THAT CALLS THE API FOR MAP DATA
function build_map_update(location) {
  // CLEAR MAP MARKER DATA
  markers = [];
  infoWindowContent = [];
  marker_images = [];
  has_error = false;
  quadrants_loaded = 0;
  quad_data = [];

  // ADD CHARACTER DATA TO MAP
  marker_obj = [["You", location.coords.latitude,location.coords.longitude]];
  markers.push(marker_obj);
  infoWindowContent_obj = ['<div class="info_content"><h3>You</h3></div>'];
  infoWindowContent.push(infoWindowContent_obj);
  marker_images.push(trainer_sprite);

  // RUN AJAX CALLS IN PARALLEL, CALL EVERY 300 MILLISECONDS
  console.log("Starting API Calls");
  for(var quad = 0; quad < 25; quad++) {
    build_map_step_parallel(location, quad); // Unfortunately, server returns 500 errors too often for this method
  }
}

function build_map_step_parallel(location, quadrant) {
  // GET QUADRANT COORDS
  var row = Math.floor(quadrant / 5) - 2;
  var col = Math.floor(quadrant % 5) - 2;

  // GET QUADRANT LOCATION
  var currPosition = {
      latitude: location.coords.latitude + (square_distance * col),
      longitude: location.coords.longitude + (square_distance * row)
  };

  // CALL API FOR LOCATION
  $.ajax({
    type: 'POST',
    url: 'https://pokeradar-map.herokuapp.com/get_poke',
    data: { location: currPosition.latitude.toString()+', '+currPosition.longitude.toString() },
    dataType: 'json',
    success: function (data) {

      // console.log("Quadrant Successful: "+quadrant);

      var quad_markers = [];
      var quad_infos = [];
      var quad_images = [];

      // ADD EACH POKEMON'S LOCATION DATA TO THE MARKER VARIABLES
      $.each(data.data, function(k, v) {
        var marker_obj = [v.name, v.latitude,v.longitude];
        // console.log([v.latitude, v.longitude]);
        quad_markers.push(marker_obj);
        var infoWindowContent_obj = ['<div class="info_content">' + '<h3>'+v.name+'</h3>' + '<p>will be there for another '+v.time_left+' seconds.</p>' +  '<p> Exact location at ' + v.latitude.toString() + ', ' + v.longitude.toString() + '. Zoom in for a more accurate location.' +      '</div>'];
        quad_infos.push(infoWindowContent_obj);

        var num_3_digits = v.id.toString();
        for(var i = num_3_digits.length; i < 3; i++) {
          num_3_digits = "0" + num_3_digits;
        }
        quad_images.push("http://serebii.net/blackwhite/pokemon/"+num_3_digits+".png");

      });

      // INCREMENT COUNTER AND ADD TO BUFFER
      quad_data.push({
        markers: quad_markers,
        infos: quad_infos,
        marker_images: quad_images
      });
      quadrants_loaded += 1;
      if(quadrants_loaded == 25) last_quad_loaded();

    },
    error: function() {
      // console.log("Quadrant FAILED: "+quadrant);

      has_error = true;

      // INCREMENT AND CHECK
      quadrants_loaded += 1;
      if(quadrants_loaded == 25) last_quad_loaded();
    }
  });
}

function last_quad_loaded() {
  console.log("API Calls Done");

  // FLATTEN MAP MARKER DATA
  for(var i = 0; i < quad_data.length; i++) {
    markers.push(quad_data[i].markers);
    infoWindowContent.push(quad_data[i].infos);
    marker_images.push(quad_data[i].marker_images);
  }

  markers = [].concat.apply([], markers);
  infoWindowContent = [].concat.apply([], infoWindowContent);
  marker_images = [].concat.apply([], marker_images);

  // BUILD MAP
  $('#map_canvas').html('');
  create_map();

  // RECURSE
  setTimeout(function(){
    navigator.geolocation.getCurrentPosition(handler);
  }, 30000);
}


window.onload = show_popup;
