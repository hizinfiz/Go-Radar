// MODIFIED POKERADAR CODE; ORIGINAL CODE IS FROM POKERADAR.XYZ

// VARIABLES
var data_buffer = [];
var first_load = true;
var has_error = false;
var quadrants_loaded = 0;
var markers = [];
var infoWindowContent = [];
var marker_images = [];
var pokeToggle = [];
for (var i = 0; i < 151; i++) {
    pokeToggle.push(true);
}

// SQUARE CONSTANTS
var SQUARE_DISTANCE = 0.0000449 * 30;
var SQUARE_LENGTH = 7;
var OFFSET_MAX = Math.floor(SQUARE_LENGTH / 2);
var SQUARE_UNITS_TOTAL = SQUARE_LENGTH * SQUARE_LENGTH;

// IMAGES
var trainer_sprite = "./pokemaniac.png";
var pokemon_sprite_prefix = "http://www.serebii.net/battletrozei/pokemon/";

// FUNCTION THAT CALLS THE API FOR MAP DATA
function build_map_update(location) {
  // CLEAR MAP MARKER DATA
  has_error = false;
  quadrants_loaded = 0;
  data_buffer = [];

  // RESET BUFFER VARIABLES
  markers = [];
  infoWindowContent = [];
  marker_images = [];

  // ADD POKETRAINER MARKER DATA
  marker_obj = ["You", location.coords.latitude,location.coords.longitude];
  markers.push(marker_obj);
  infoWindowContent_obj = ['<div class="info_content"><h3>You</h3></div>'];
  infoWindowContent.push(infoWindowContent_obj);
  marker_images.push(trainer_sprite);

  // RUN AJAX CALLS IN PARALLEL, CALL EVERY 300 MILLISECONDS
  console.log("Starting API Calls");
  for(var quad = 0; quad < SQUARE_UNITS_TOTAL; quad++) {
    build_map_step_parallel(location, quad); // Unfortunately, server returns 500 errors too often for this method
  }
}

// STEP THROUGH MAP AND MAKE API CALLS
function build_map_step_parallel(location, quadrant) {
  // GET QUADRANT COORDS
  var row = Math.floor(quadrant / SQUARE_LENGTH) - OFFSET_MAX;
  var col = Math.floor(quadrant % SQUARE_LENGTH) - OFFSET_MAX;

  // GET QUADRANT LOCATION
  var currPosition = {
      latitude: location.coords.latitude + (SQUARE_DISTANCE * col),
      longitude: location.coords.longitude + (SQUARE_DISTANCE * row)
  };

  // CALL API FOR LOCATION
  $.ajax({
    type: 'POST',
    url: 'https://pokeradar-map.herokuapp.com/get_poke',
    data: { location: currPosition.latitude.toString()+', '+currPosition.longitude.toString() },
    dataType: 'json',
    success: function (data) {

      // ADD TO BUFFER
      data_buffer.push(data.data);

      quadrants_loaded += 1;
      if(quadrants_loaded == SQUARE_UNITS_TOTAL) last_quad_loaded();

    },
    error: function() {
      has_error = true;

      // INCREMENT AND CHECK
      quadrants_loaded += 1;
      if(quadrants_loaded == SQUARE_UNITS_TOTAL) last_quad_loaded();
    }
  });
}

function last_quad_loaded() {
  console.log("API Calls Done");

  // FLATTEN DATA_BUFFER
  data_buffer = [].concat.apply([], data_buffer);

  var marker_obj;
  var infoWindowContent_obj;

  // GENERATE MARKER DATA
  $.each(data_buffer, function(k, v) {
    if (pokeToggle[v.id-1] == true) {
      var marker_obj = [v.name, v.latitude,v.longitude];
      // console.log([v.latitude, v.longitude]);
      markers.push(marker_obj);
      var infoWindowContent_obj = ['<div class="info_content">' + '<h3>'+v.name+'</h3>' + '<p>will be there for another '+v.time_left+' seconds.</p>' +  '<p> Exact location at ' + v.latitude.toString() + ', ' + v.longitude.toString() + '. Zoom in for a more accurate location.' +      '</div>'];
      infoWindowContent.push(infoWindowContent_obj);

      var num_3_digits = v.id.toString();
      for(var i = num_3_digits.length; i < 3; i++) {
        num_3_digits = "0" + num_3_digits;
      }
      marker_images.push(pokemon_sprite_prefix+num_3_digits+".png");
    }
  });

  console.log(data_buffer, markers);

  // BUILD MAP
  $('#map_canvas').html('');
  create_map();

  // RECURSE
  setTimeout(function(){
    navigator.geolocation.getCurrentPosition(handler);
  }, 60000);

}

// Show/Hide the Pokemon Toggle Box
$(function() {
    var showing = false;
    $("#toggle").click(function() {
        var span = document.getElementById("toggle").firstChild.innerHTML;
        if (showing) {
            $(this).find("span").toggleClass("glyphicon-chevron-right").toggleClass("glyphicon-chevron-left");
            $("#pokeSelect").animate({'left' : '-742px'}, {duration : 400});
            showing = false;
        } else {
            $(this).find("span").toggleClass("glyphicon-chevron-right").toggleClass("glyphicon-chevron-left");
            $("#pokeSelect").animate({'left' : '0'}, {duration : 400});
            showing = true;
        }
    });
});

// Populate the Pokemon Toggle Box
$(document).ready(function(){
    var box = document.getElementById("box");
    var poke = document.createElement("div");
    poke.className = "pokemon";
    for (var i = 1; i < 152; i++) {
        var num = i.toString();
        for(var j = num.length; j < 3; j++) {
        num = "0" + num;
        }
        poke.innerHTML = "<img src='http://serebii.net/blackwhite/pokemon/"+num+".png'><input type='checkbox' name="+num+" value="+num+" onclick='updateToggle("+i+")' checked>";
        box.appendChild(poke.cloneNode(true));
    }
});

// Update pokeToggle array when a checkbox is clicked
function updateToggle(num) {
    pokeToggle[num-1] = !pokeToggle[num-1]
    console.log(pokeToggle)
}

// Force a map rebuild
function refreshMap() {
    navigator.geolocation.getCurrentPosition(handler)
}

$("#sprite").change(function() {
   if  (pokemon_sprite_prefix == "http://www.serebii.net/battletrozei/pokemon/") {
       pokemon_sprite_prefix = "http://www.serebii.net/blackwhite/pokemon/";
       refreshMap();
   } else {
       pokemon_sprite_prefix = "http://www.serebii.net/battletrozei/pokemon/";
       refreshMap();
   }
});