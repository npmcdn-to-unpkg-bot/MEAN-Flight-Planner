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

        this.getSensors = function() {
          return $http.get("/fc/sensors").
              then(function(response) {
                  if (response.data.length > 100){
                    response.data = response.data.slice(0, 100);
                  }
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
            var url = "/fc/sensors/" + sensor._id;
            console.log("Updating Sensor: " + sensor._id);
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

            var GPS_STEP_VAL = 0.0001; // ~14 meters per step 
            var SIM_STEP_FREQUENCY = 100; // 
            var BATTERY_STEP_VAL = 2;
            var NUM_UAV_IN_DB = sensors.data.length;
            var getCounter = 0;
            var putCounter = 0;

            $scope.uavNumber = NUM_UAV_IN_DB;
            $scope.sendPutReq = false;
            $scope.sentGetReq = false;
            $scope.sensors = sensors.data;
            $scope.missionInProgress = false;
            $scope.stepSim = true;
            $scope.sensor = sensors.data[0];
            $scope.simTime = 0;
            $scope.simRealTime = 0; // Calculated with drone flying ~ 14 m/s
            $scope.selectedSensorIndex = 0;

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
                    lat: $scope.sensor.gpsN,
                    lng: $scope.sensor.gpsW,
                    zoom: 10
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

            $scope.startMission = function(sensorsArr) {

                for(i =0; i < sensorsArr.length; i++){
                    //Set default values
                    sensorsArr[i].battery = 100;
                    sensorsArr[i].vPosSensor = true;
                    sensorsArr[i].uSonicSensor = true;
                    sensorsArr[i].internalErr = "none";
                    sensorsArr[i].internalErrCode = 0;

                    Sensors.updateSensor(sensorsArr[i]);
                }
                // Start Sim once all Sensors are updated
                $scope.missionInProgress = true;

                // Start time tick
                // defualt 10s
            }

            $scope.stopMission = function(){
              $scope.missionInProgress = false;

              // run one last Update to server
              if ($scope.sendPutReq ==  true){
                  for(i = 0; i < $scope.sensors.length; i++){
                    Sensors.updateSensor($scope.sensors[i]);
                  }            
              }
              
            }

            $interval(function () {
              if ($scope.missionInProgress == true && $scope.stepSim == false){
                $scope.droneStep();
              }

            }, SIM_STEP_FREQUENCY);

            // Simlate sensor values for a step in drone movement
            $scope.droneStep = function(){

                // increment simTime and realTime
                $scope.simTime += SIM_STEP_FREQUENCY;
                $scope.simRealTime++;

                for(i = 0; i < $scope.sensors.length; i++){

                    // Movement N & W +/- by GPS_STEP_VAL
                    if ($scope.sensors[i].gpsN > $scope.sensors[i].destN){
                        $scope.sensors[i].gpsN -= GPS_STEP_VAL;
                    }
                    else if ($scope.sensors[i].gpsN < $scope.sensors[i].destN) {
                        $scope.sensors[i].gpsN += GPS_STEP_VAL;
                    }
                    if ($scope.sensors[i].gpsW > $scope.sensors[i].destW){
                        $scope.sensors[i].gpsW -= GPS_STEP_VAL;
                    }
                    else if ($scope.sensors[i].gpsW < $scope.sensors[i].destW) {
                        $scope.sensors[i].gpsW += GPS_STEP_VAL;
                    }
                    // Decrement battery
                    $scope.sensors[i].battery -= BATTERY_STEP_VAL;

                    $scope.markers[i + NUM_UAV_IN_DB].lat = $scope.sensors[i].gpsN;
                    $scope.markers[i + NUM_UAV_IN_DB].lng = $scope.sensors[i].gpsW;

                    if ($scope.sendPutReq ==  true && putCounter == 40){
                        Sensors.updateSensor($scope.sensors[i]);
                        putCounter = 0;
                    }

                    // TODO: Calculate distance:
                    /*
                    destLatlng = L.latLng($scope.sensor.destN, $scope.sensor.destW);
                    droneLatlng = L.latLng($scope.sensor.gpsN, $scope.sensor.gpsW);
                    $scope.distRem = droneLatlng.distanceTo(destLatlng);
                    */
                }
                
                if (getCounter == 80 && $scope.sendGetReq ==  true){
                    // Update Sensors from API 
                    Sensors.getSensors().then(function(doc) {
                        $scope.sensors = doc.data;
                    }, function(response) {
                        alert(response);
                    });
                    getCounter = 0;
                }
                putCounter++;
                getCounter++;
            }
       });
