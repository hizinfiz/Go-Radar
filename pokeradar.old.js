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
  marker_obj = ["Ashe", location.coords.latitude,location.coords.longitude];
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

  // ADD CHARACTER DATA TO MAP
  marker_obj = ["Ashe", location.coords.latitude,location.coords.longitude];
  markers.push(marker_obj);
  infoWindowContent_obj = ['<div class="info_content"><h3>You</h3></div>'];
  infoWindowContent.push(infoWindowContent_obj);
  marker_images.push(trainer_sprite);

  // CALL RECURSIVE STEPS
  build_map_step(location, 0);
}

function build_map_step(location, quadrant) {
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

      // ADD EACH POKEMON'S LOCATION DATA TO THE MARKER VARIABLES
      $.each(data.data, function(k, v) {
        marker_obj = [v.name, v.latitude,v.longitude];
        // console.log([v.latitude, v.longitude]);
        markers.push(marker_obj);
        infoWindowContent_obj = ['<div class="info_content">' + '<h3>'+v.name+'</h3>' + '<p>will be there for another '+v.time_left+' seconds.</p>' +  '<p> Exact location at ' + v.latitude.toString() + ', ' + v.longitude.toString() + '. Zoom in for a more accurate location.' +      '</div>'];
        infoWindowContent.push(infoWindowContent_obj);
        // marker_images.push("https://pokeradar-map.herokuapp.com/static/poke/"+v.id+".ico");

        var num_3_digits = v.id.toString();
        for(var i = num_3_digits.length; i < 3; i++) {
          num_3_digits = "0" + num_3_digits;
        }
        // marker_images.push("http://serebii.net/xy/pokemon/"+num_3_digits+".png");  // MEDIUM-LARGE SIZED
        // marker_images.push("http://serebii.net/pokedex-xy/icon/"+num_3_digits+".png"); // TINY SIZED
        marker_images.push("http://serebii.net/blackwhite/pokemon/"+num_3_digits+".png"); // MEDIUM SIZED

        // marker_images.push("http://serebii.net/art/th/"+v.id+".png");

      });

      // RECURSE ELSE UPDATE MAP
      console.log("Done Quadrant " + quadrant.toString());
      if (quadrant < 24) {
        build_map_step(location, quadrant + 1);
      } else {
        $('#map_canvas').html('');
        create_map();

        // RECURSE EVERY MINUTE
        setTimeout(function(){
          navigator.geolocation.getCurrentPosition(handler);
        }, 60000);
      }
    },
    error: function() {
      has_error = true;
      // console.log('Error while attempting to retrieve poke locations');
      // alert("An error occured. Please reload the page and try again! If you've already reloaded, please go to the homepage and check the Server Status.");


      // RECURSE ELSE UPDATE MAP
      console.log("Done Quadrant " + quadrant.toString());
      if (quadrant < 24) {
        build_map_step(location, quadrant + 1);
      } else {
        $('#map_canvas').html('');
        create_map();

        if(has_error) {
          console.log('Error while attempting to retrieve poke locations');
          // alert("An error occured. Please reload the page and try again! If you've already reloaded, please go to the homepage and check the Server Status.");
          alert("One or more quandrant searches failed.");
        }

        // RECURSE EVERY MINUTE
        setTimeout(function(){
          navigator.geolocation.getCurrentPosition(handler);
        }, 60000);
      }
    }
  });


}

window.onload = show_popup;
