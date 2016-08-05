angular.module("contactsApp", ['ngRoute', 'leaflet-directive'])
    .config(function($routeProvider) {
        $routeProvider
            .when("/map", {
                controller: "MapBoxController",
                templateUrl: "map-frame.html",
                resolve: {
                    sensors: function(Sensors) {
                        return Sensors.getSensors();
                    }
                }
            })
            .otherwise({
                redirectTo: "/map"
            })
    })
    .service("Sensors", function($http) {
      // 579d18c62e025e402457042d
        this.getSensors = function() {
          return $http.get("/fc/sensors").
              then(function(response) {
                  return response;
              }, function(response){
                  alert("Error finding /fc/sensors");
              });
        }
        this.getSensor = function() {
          // The single sensor data that is being used
            var url = "/fc/sensors/" + "579fa5fc22419f1a34bc19b0";
            return $http.get(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding this sensor dataset.");
                });
        }
        this.updateSensor = function(sensor) {
            var url = "/fc/sensors/";
            console.log("Updated Sensor: " + sensor._id);
            return $http.put(url, sensor).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error editing this sensor dataset.");
                    console.log(response);
                });
        }
        this.tick = function(sensor) {

        }

    })
    .controller('MapBoxController', function($scope, Sensors, sensors) {
            $scope.sensors = sensors.data;
            // initial Map location before http.get

            var mainMarker = {
                lat: 37.289896645804035,
                lng: -121.90017700195312,
                focus: true,
                message: "Current Drone location",
                draggable: true
            };

            angular.extend($scope, {
                center: {
                    lat: 0,
                    lng: 0,
                    zoom: 0
                },
                markers: {
                    mainMarker: angular.copy(mainMarker)
                },
                position: {
                    lat: 51,
                    lng: 0
                },
                events: { // or just {} //all events
                    markers:{
                      enable: [ 'dragend' ]
                      //logic: 'emit'
                    }
                },
                dronePath: {
                        p1: {
                            color: 'green',
                            weight: 8,
                            latlngs: [
                                { lat: 0, lng: 0 },
                                { lat: 0, lng: 0 }
                            ],
                            message: "<h5>Drone Path</h5><p>Distance: 1862km</p>",
                        }
                }
            });

            // sensorId = "579fa5fc22419f1a34bc19b0"



            Sensors.getSensor().then(function(doc) {
                $scope.sensor = doc.data;

                // set map center point
                $scope.center.lat = $scope.sensor.gpsN;
                $scope.center.lng = $scope.sensor.gpsW;
                $scope.center.zoom = 12;

                // Set Mission path points
                $scope.dronePath.p1.latlngs[0].lat = $scope.sensor.gpsN;
                $scope.dronePath.p1.latlngs[0].lng = $scope.sensor.gpsW;
                $scope.dronePath.p1.latlngs[1].lat = $scope.sensor.destN;
                $scope.dronePath.p1.latlngs[1].lng = $scope.sensor.destW;

            }, function(response) {
                alert(response);
            });
            $scope.startMission = function(sensor, center) {
                //Set default values
                sensor.battery = 100;
                sensor.vPosSensor = true;
                sensor.uSonicSensor = true;
                sensor.internalErr = "none";
                sensor.internalErrCode = 0;

                sensor.gpsN = center.lat;
                sensor.gpsW = center.lng;

                Sensors.updateSensor(sensor);

                // Start time tick
                // defualt 10s
            }



       })
    .controller("EditContactController", function($scope, $routeParams, Contacts) {
        Contacts.getContact($routeParams.contactId).then(function(doc) {
            $scope.contact = doc.data;
        }, function(response) {
            alert(response);
        });

        $scope.toggleEdit = function() {
            $scope.editMode = true;
            $scope.contactFormUrl = "contact-form.html";
        }

        $scope.back = function() {
            $scope.editMode = false;
            $scope.contactFormUrl = "";
        }

        $scope.saveContact = function(contact) {
            Contacts.editContact(contact);
            $scope.editMode = false;
            $scope.contactFormUrl = "";
        }

        $scope.deleteContact = function(contactId) {
            Contacts.deleteContact(contactId);
        }
    });
