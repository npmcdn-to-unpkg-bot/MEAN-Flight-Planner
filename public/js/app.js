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
      // 57b5e5df58be5e03c433e656
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
            var url = "/fc/sensors/" + "57b5e5df58be5e03c433e656";
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

    })
    .controller('MapBoxController', function($scope, $interval, Sensors, sensors) {
            $scope.sensors = sensors.data;
            $scope.missionInProgress = false;

            var droneLatlng = L.latLng(0, 0);
            var destLatlng = L.latLng(0, 0);
            $scope.distRem = 0;

            var uavsToMarkers = function(points) {
              return points.map(function(ap) {
                return {
                  
                  lat: ap.gpsN,
                  lng: ap.gpsW,
                  message: "UAV # " + ap._id,
                  icon: {
                        iconUrl: '../img/icon_drone.png',
                        iconSize: [50, 50],
                        iconAnchor: [25, 25],
                        popupAnchor: [0, 0],
                        shadowSize: [0, 0],
                        shadowAnchor: [0, 0]
                        }
                };
              });
            };

            var destinationsToMarkers = function(points) {
              return points.map(function(ap) {
                return {
                        lat: ap.destN,
                        lng: ap.destW,
                        focus: false,
                        message: "Destination: " + ap._id,
                        draggable: true
                };
              });
            };

            var destinationsToPaths = function(points) {
              return points.map(function(ap) {
                return {
                            color: 'green',
                            weight: 5,
                            latlngs: [
                                { lat: ap.gpsN, lng: ap.gpsW },
                                { lat: ap.destN, lng: ap.destW }
                            ],
                            message: "Path: " + ap._id + "<br>" + "Collision: unlinkely",
                };
              });
            };

            // initialize leafletJS variables
            angular.extend($scope, {
                center: {
                    lat: 0,
                    lng: 0,
                    zoom: 0
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
                            message: "blank",
                        }
                }
            });
            var destMarkers = destinationsToMarkers(sensors.data);
            var uavMarkers = uavsToMarkers(sensors.data);
            
            $scope.markers = destMarkers.concat(uavMarkers);

            $scope.dronePath = destinationsToPaths(sensors.data);


            // sensorId = "579fa5fc22419f1a34bc19b0"
            // INITIAL Update map based on sensorData
            Sensors.getSensor().then(function(doc) {
                $scope.sensor = doc.data;

                // set map center point & zoom
                $scope.center.lat = $scope.sensor.gpsN;
                $scope.center.lng = $scope.sensor.gpsW;
                $scope.center.zoom = 12;

                /*
                // Set Mission path points & markers
                $scope.dronePath.p1.latlngs[0].lat = $scope.sensor.gpsN;
                $scope.dronePath.p1.latlngs[0].lng = $scope.sensor.gpsW;
                $scope.markers.drone.lat = $scope.sensor.gpsN;
                $scope.markers.drone.lng = $scope.sensor.gpsW;

                $scope.dronePath.p1.latlngs[1].lat = $scope.sensor.destN;
                $scope.dronePath.p1.latlngs[1].lng = $scope.sensor.destW;
                $scope.markers.destination.lat = $scope.sensor.destN;
                $scope.markers.destination.lng = $scope.sensor.destW;

                destLatlng = L.latLng($scope.sensor.destN, $scope.sensor.destW);
                droneLatlng = L.latLng($scope.sensor.gpsN, $scope.sensor.gpsW);

                $scope.dronePath.p1.message = "Drone Path";
                $scope.distRem = droneLatlng.distanceTo(destLatlng);

                */

            }, function(response) {
                alert(response);
            });
            $scope.startMission = function(sensor) {
                //Set default values
                sensor.battery = 90;
                sensor.vPosSensor = true;
                sensor.uSonicSensor = true;
                sensor.internalErr = "none";
                sensor.internalErrCode = 0;

                $scope.missionInProgress = true;

                // Start time tick
                // defualt 10s
            }

            $scope.stopMission = function(){
              $scope.missionInProgress = false;
            }

            $interval(function () {
              if ($scope.missionInProgress == true){
                $scope.droneStep();
              }

            }, 50);

            // Simlate sensor values for a step in drone movement
            $scope.droneStep = function(){
              $scope.sensor.gpsN += 0.0001;
              $scope.sensor.gpsW += 0.0001;

              destLatlng = L.latLng($scope.sensor.destN, $scope.sensor.destW);
              droneLatlng = L.latLng($scope.sensor.gpsN, $scope.sensor.gpsW);
              $scope.distRem = droneLatlng.distanceTo(destLatlng);

              Sensors.updateSensor($scope.sensor);

              $scope.markers.drone.lat = $scope.sensor.gpsN;
              $scope.markers.drone.lng = $scope.sensor.gpsW;
              /*
              if(L.equals(droneLatlng, destLatlng, 0.01)){
                $scope.missionInProgress = false;
              } */

              if($scope.sensor.destN < $scope.sensor.gpsN){
                $scope.missionInProgress = false;
              }

            }
       });
