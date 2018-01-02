import {minLength, maxLength, required} from 'vuelidate/lib/validators'
import {getLocalUser} from "../../router/index";

export default {
  name: 'Map',
  data: ()=> ({
    form: {
      title: null,
      desc: null,
      type: null,
      image: null
    },
    id: 0,
    isPlaced: false,
    marker: null,
    sending: false,
    lat: 0,
    lng: 0
  }),
  validations: {
    form: {
      title: {
        required,
        minLength: minLength(3),
        maxLength: maxLength(32)
      },
      desc: {
        required,
        minLength: minLength(10)
      },
      type: {
        required
      },
      image: {
        required
      }
    }
  },
  methods: {
    getValidationClass (fieldName) {
      const field = this.$v.form[fieldName];
      if (field) {
        return {
          'md-invalid': field.$invalid && field.$dirty
        }
      }
    },

    // calling when exit popup window
    clearForm() {
      this.$v.$reset();
      this.form.title = null;
      this.form.desc = null;
      this.form.type = null;
      this.form.image = null
    },

    // calling when submit input form
    validateData () {
      this.$v.$touch();

      if (!this.$v.$invalid) {
        this.saveIssue()
      }
    },

    initMap() {
      var self = this;
        this.map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 48.29149, lng: 25.94034},
          zoom: 14,
          maxZoom: 19,
          minZoom: 14,
          disableDefaultUI: true,
          disableDoubleClickZoom: true,
          zoomControl: true,
          mapTypeControl: true,
        });
        this.addYourLocationButton();
        this.addSearchField();
        this.getUserLocation();
        this.map.addListener('dblclick', function(e) {
          if(getLocalUser()) {
            self.saveCoords(e.latLng.lat(), e.latLng.lng())
          }
        });
    },

    search() {
      var self = this;
      var pos;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        })
      } else {
        pos = new google.maps.LatLng(48.29149, 25.94034);
      }
      var autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('pac-input'), {
          types: ['establishment'],
          location: pos,
          radius: 10000,
        });
      autocomplete.bindTo('bounds', self.map);
      autocomplete.addListener('place_changed', function() {
         var place = autocomplete.getPlace();
         if (!place.geometry) {
           alert("No details available for input: '" + place.name + "'");
           return;
         }
         else {
           self.$http.post('map/getMarkerByCoords', null, {
             params: {
               lat: place.geometry.location.lat(),
               lng: place.geometry.location.lng()
             }
           }).then((response) => {
             if(response.body.data[0] == null) {
               self.map.setCenter(place.geometry.location);
               self.map.setZoom(19);
               self.saveCoords(place.geometry.location.lat(), place.geometry.location.lng())
             }
             else {
               self.map.setCenter(place.geometry.location);
               self.map.setZoom(19);
             }
           })
         }
      });
    },
    getUserLocation() {
      var self = this;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          self.map.setCenter(pos);
          self.map.setZoom(19);
          var infoWindow = new google.maps.InfoWindow({map: self.map});
          infoWindow.setPosition(pos);
          infoWindow.setContent('<b>Your location</b>');
          setTimeout(function() { infoWindow.close(); }, 2000)
        }, function() {
          self.handleLocationError(true)
        })
      }
      else {
        self.handleLocationError(false)
      }
    },

    handleLocationError(browserHasGeolocation) {
      alert(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    },

    addSearchField() {
      var self = this;
      var input = document.createElement('input');
      input.setAttribute('placeholder', 'Enter a location');
      input.setAttribute('id', 'pac-input');
      input.setAttribute('type', 'text');
      input.style.marginTop = '10px';
      input.style.border = '1px solid transparent';
      input.style.borderRadius = '2px 0 0 2px';
      input.style.height = '29px';
      input.style.width = '300px';
      input.style.outline = 'none';
      input.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.3)';
      input.style.padding = '0 11px 0 13px';
      input.style.fontSize = '15px';
      input.style.borderColor = '#4d90fe';
      this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
      input.addEventListener('click', function() {
        self.search()
      });
    },

    addYourLocationButton() {
      var self = this;
      var controlDiv = document.createElement('div');

      var firstChild = document.createElement('button');
      firstChild.style.backgroundColor = '#fff';
      firstChild.style.border = 'none';
      firstChild.style.outline = 'none';
      firstChild.style.width = '28px';
      firstChild.style.height = '28px';
      firstChild.style.borderRadius = '2px';
      firstChild.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
      firstChild.style.cursor = 'pointer';
      firstChild.style.marginRight = '10px';
      firstChild.style.padding = '0px';
      firstChild.title = 'Find your location';
      controlDiv.appendChild(firstChild);

      var secondChild = document.createElement('div');
      secondChild.style.margin = '5px';
      secondChild.style.width = '18px';
      secondChild.style.height = '18px';
      secondChild.style.backgroundImage = 'url(https://maps.gstatic.com/tactile/mylocation/mylocation-sprite-1x.png)';
      secondChild.style.backgroundSize = '180px 18px';
      secondChild.style.backgroundPosition = '0px 0px';
      firstChild.appendChild(secondChild);

      firstChild.addEventListener('click', function() {
        self.getUserLocation()
      });
      this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlDiv)
    },

    saveCoords(lat, lng) {
      window.lat = lat;
      window.lng = lng;
      this.openPopup()
    },


    openPopup() {
      var modal = document.getElementById('myModal');
      var span = document.getElementsByClassName("close")[0];
      modal.style.display = "block";
      span.onclick = function() {
        modal.style.display = "none";
        document.getElementById('pac-input').value = '';
        document.getElementById("preview").hidden = true;
        window.lat = 0;
        window.lng = 0;
      };
    },

    saveIssue() {
      if(window.isPlaced) {
        this.setMarkerType(window.marker, this.form.type)
      } else {
          var marker = new google.maps.Marker({
            map: this.map,
            position: {
              lat: window.lat,
              lng: window.lng
            },
            animation: google.maps.Animation.DROP
          });

          var title = this.form.title;
          var desc = this.form.desc;
          var type = this.form.type;

          this.setMarkerType(marker, this.form.type);
          this.setListeners(marker);
          this.$http.post('map/saveMarker', {
            lat: window.lat,
            lng: window.lng
          }).then((response) => {
            this.$http.post('map/saveIssue',{
              markerId: response.body.data[0].id,
              title: title,
              text: desc,
              typeId: type
              //image: TODO
            }).then((response) => {console.log(response.body)
            });
          });
      }

      document.getElementById('myModal').style.display = "none";
      this.clearForm();
      window.isPlaced = false;
      window.marker = null;
      window.lat = 0;
      window.lng = 0;
      document.getElementById('pac-input').value = '';
      document.getElementById("preview").hidden = true;
    },

    setMarkerType(marker, type) {
      var url;
      switch(type) {
        case '1': url = '/src/assets/caution.png';
          break;
        case '2': url = '/src/assets/info.png';
          break;
        case '3': url ='/src/assets/feedback.png';
          break;
        default: url = ''
      }
      var icon = {
        url: url,
        scaledSize: new google.maps.Size(260, 260),
        anchor: new google.maps.Point(130, 150)
    };
      marker.setIcon(icon);
    },

    setListeners(marker) {
      var self = this;
      var timer = 0;
      var delay = 300;
      var prevent = false;

      marker.addListener('click', function() {
        timer = setTimeout(function() {
          if (!prevent) {

          }
          prevent = false;
        }, delay);

      });
      marker.addListener('dblclick', function() {
          clearTimeout(timer);
          prevent = true;

          self.getMarkerByCoords(marker.getPosition().lat(), marker.getPosition().lng());
          window.marker = marker;
          var modal = document.getElementById('myModal');
          var span = document.getElementsByClassName("close")[0];
          modal.style.display = "block";
          span.onclick = function() {
            modal.style.display = "none";
          };
      });
    },

    getMarkerByCoords(lat, lng) {
      this.$http.post('map/getMarkerByCoords', null, {
        params: {
          lat: lat,
          lng: lng
        }
      }).then((response) => {
        window.id = response.body.data[0].id;
        window.isPlaced = true;
      })
    },

    previewImage() {
      var reader = new FileReader();
      reader.readAsDataURL(document.getElementById("uploadImage").files[0]);
      reader.onload = function (e) {
        document.getElementById("preview").src = e.target.result;
        document.getElementById("preview").hidden = false;
      };
    },



    /*google.maps.event.addListener('dblclick', function() {
        map.setCenter(marker.getPosition());
        marker.setAnimation(google.maps.Animation.BOUNCE);
      });*/
    tornOffBounce(marker) {
      marker.setAnimation(null);
    },

    /*addMarker(lat, lng) {
        let self = this
        var marker = new google.maps.Marker({
            map: self.map,
            position: {
              lat: parseFloat(lat),
              lng: parseFloat(lng)
            },
            animation: google.maps.Animation.DROP
        })
        this.$http.post('map/saveMarker', {
            lat: lat,
            lng: lng
          }).then((response) => {console.log(response.body)
        })
    },*/

    /*loadAllMarkers() {
        let self = this
        this.$http.get('map').then((response) => {
            for (var i = 0; i < response.body.data.length; i++) {
                var lat = parseFloat(response.body.data[i].lat)
                var lng = parseFloat(response.body.data[i].lng)
                var id = parseFloat(response.body.data[i].id)
                var marker = new google.maps.Marker({
                    map: self.map,
                    position: {
                      lat: lat,
                      lng: lng
                    },
                    animation: google.maps.Animation.DROP
                })

                var infoWindow = new google.maps.InfoWindow();
                marker.addListener('click', (function(marker, infoWindow, id){
                    return function() {
                        infoWindow.setContent(id.toString())
                        infoWindow.open(map, marker)
                        google.maps.event.addListener(self.map, 'click', function(){
                          infoWindow.close();
                        })
                    };
                })(marker, infoWindow, id))
            }
        }
        );
    },*/
        /*function drop() {
      for (var i =0; i < markerArray.length; i++) {
        setTimeout(function() {
          addMarkerMethod();
        }, i * 200);
      }
    }*/
  },

  mounted: function () {
      this.initMap();
  }
}
