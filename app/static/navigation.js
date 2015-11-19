/**
 * Created by emmilinkola on 03/11/15.
 */

var searchIssues = new SearchIssues();

var app = angular.module('myApp', ['ngRoute', 'uiGmapgoogle-maps']);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}]);

app.controller('messageController', function($scope, $http) {
    $scope.deleteMessage = function(messageId){
        console.log("test");
        var config = {
            method: 'DELETE',
        };
        $http.delete("/message/" + messageId + '/', config)
            .success(function() {
                //alert("deleted: " + messageId);
            }).error(function() {
                alert("delete failed!");
            });
        //TODO remove message with messageId from $scope.messages
    };

    $scope.postMessage = function(issueId, newMessageText) {
        //alert(issueId + ": " + newMessageText);
        //TODO httppost to /issue/issueId/messages/
        $scope.messages.push({text: newMessageText, poster: 'dynamic'});
    };
    $http.get("/issue/"+$scope.issueID +"/messages/").success(function(messages) {
        console.log(messages);
        $scope.messages = messages.messages;
    }).error(function(foo, bar, baz){
        alert("Error getting messages!");
    });
});

app.controller('searchController', function($scope, $http){

    $scope.MapOptions = {
        markers: {
            selected: {}
        },
     };

   $scope.map = {
       center: {
           latitude: 60.1728365,
           longitude: 24.9399135,
       },
       zoom: 13,
       options: $scope.mapOptions,
   }

    $scope.map.mapEvents = {};
    $scope.map.mapEvents.bounds_changed = function (map, eventName, args) {
        //console.log(eventName);
        $scope.setMarkers(map.getBounds());
        console.log(map.getBounds().getSouthWest().lat()+ ", " + map.getBounds().getSouthWest().lng() + ", "+ map.getBounds().getNorthEast().lat() + ", "
        +map.getBounds().getNorthEast().lng());
    };

    $scope.textSearch = function(text) {

        console.log("test");
        var config = {
            'params' : {
                'search': text,
                'format': 'json',
            },
        };
        $http.get("/issues/text/", config)
            .success(function(searchResult) {
                //console.log(searchResult);
                //$scope.names = searchResult.objects;
            });
    }
    $scope.issueMarkers = [];


   function createInfoWindow(issue) {

        console.log("infoikkuna");
        var infoString = "info"
        var infowindow = google.maps.InfoWindow({
            content: infoString
            });
        return infowindow;
    }

    $scope.markerClick = function (generated, event, marker){
        console.log(marker);
        $scope.MapOptions.markers.selected = marker;
        var issueId = marker.issue.id;
        console.log(issueId);
        document.location.href = '/issue/' + issueId;

        //createInfoWindow(issue).open($scope.map, marker);
        //$scope.windowOptions.visible = true;
        //$scope.title = "Window Title!";
        //marker.show = !marker.show;
    };

    function addMarkers(issue, index, array) {
        var latLong = issue.geometries[0].coordinates;
        var marker = new google.maps.Marker ({
           // map: $scope.map,
            id: issue.id,
            latitude: latLong[1],
            longitude: latLong[0],
            issue: issue,
        });
      /*  marker.addListener('click', function(generated, event, marker) {
            createInfoWindow(issue).open($scope.map, marker);
        });*/

        $scope.issueMarkers.push(marker);
    }

    var markersUpdating = false;
    $scope.setMarkers = function(bounds) {
        if(markersUpdating) {
            return;
        }
        markersUpdating = true;
        var config = {
            'params' : {
                'minLat': bounds.getSouthWest().lat(),
                'maxLat': bounds.getNorthEast().lat(),
                'minLong': bounds.getSouthWest().lng(),
                'maxLong': bounds.getNorthEast().lng(),
                'format': 'json',
            },
        };


        $http.get("/issues/area", config)
            .success(function(searchResult) {
                $scope.issueMarkers.length = 0;
                searchResult.objects.forEach(addMarkers);
                markersUpdating = false;

            }).error(function(data, status, headers, config){
                console.log("error")
                markersUpdating = false;
        });
    }
 //infowindow related stuff
    $scope.windowOptions = {
            visible: false
        };

        $scope.onClick = function() {
            $scope.windowOptions.visible = !$scope.windowOptions.visible;
        };

        $scope.closeClick = function() {
            $scope.windowOptions.visible = false;
        };

        $scope.title = "Window Title!";


});










