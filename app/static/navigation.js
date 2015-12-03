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
        var config = {headers: { 'Content-Type': 'application/x-www-form-urlencoded'}}
        $http.post("/issue/" + issueId + "/messages/", "messagefield="+encodeURIComponent(newMessageText), config).success(function(response) {
            //TODO show loading icon
            alert("POST TOIMII");
            $scope.messages.push(response);

        }).error(function(){
            alert("Post doesn't work");
        });


        //$scope.messages.push({text: newMessageText, poster: 'dynamic', time: timeStamp() });

    };

    $http.get("/issue/"+$scope.issueID +"/messages/").success(function(messages) {
        console.log(messages);
        $scope.messages = messages.messages;
    }).error(function(foo, bar, baz){
        alert("Error getting messages!");
    });

    $scope.likeMessage = function(message) {
        var config = {headers: { 'Content-Type': 'application/x-www-form-urlencoded'}};
        message.liked = !message.liked;
        if(message.liked) {
            $http.post("/message/" + message.id + "/vote", "value=1", config).success(function(response) {
                message.imagesrc = "../../static/img/thumbs-up-green.png";
            }).error(function(foo, bar, baz) {
                alert("like failed")
            });
        } else {
            $http.delete("/message/" + message.id + "/vote", config).success(function(response) {
                message.imagesrc = "../../static/img/thumbs-up.png";
            }).error(function(foo, bar, baz) {
                alert("unlike failed");
            });
        }
    };
});

app.controller('subController', function($scope, $http) {
    $scope.subscribeIssue = function(issue) {
        issue.subscribed = !issue.subscribed;
        if (issue.subscribed) {
            var config = {headers: { 'Content-Type': 'application/x-www-form-urlencoded'}}
            $http.post("/issue/" + issue.id + "/subscribe", config).success(function(response) {
                issue.imagesrc = "../../static/img/yellowstar.png";
            }).error(function(foo, bar, baz) {
                alert("subscribe failed")
            });
        } else {
            var config = {
                method: 'DELETE',
            };
            $http.delete("/issue/" + issue.id + "/subscribe", config).success(function(response) {
                issue.imagesrc = "../../static/img/graystar.png";
            }).error(function(foo, bar, baz) {
                alert("unsubscribe failed");
            });
        }

    };
});

app.controller('recentController', function($scope, $http) {
    $http.get('/issues/recent/comments').success(function(response){
        console.log(response);
        $scope.recentlyCommented = response.issues;
    })
});

function timeStamp() {

  var now = new Date();
  var date = [ now.getDate(), now.getMonth() + 1, now.getFullYear() ];
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

// If seconds and minutes are less than 10, add a zero
  for ( var i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }

  return date.join(".") + " " + time.join(":");
}

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
       window: {
           marker: {},
           show: false,
           closeClick: function(){
            this.show = false;
           },
           options: {
               pixelOffset: {
                   height: -30,
                   width: 0,
               }
           },
           issue: {},
       }
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

    $scope.templateUrl = {};

    $scope.content = {};

    $scope.markerClick = function (generated, event, marker){
        console.log(marker);
        $scope.MapOptions.markers.selected = marker;
        var issueId = marker.issue.id;

       // console.log($scope.MapOptions.markers.selected.coords);
        //document.location.href = '/issue/' + issueId;
        $scope.map.window.marker = marker;
        $scope.map.window.issue = marker.issue;
       // console.log(marker.coords);
      //   console.log($scope.window.marker.coords);
     //   $scope.content = '<a href ="/issue/' + issueId +'">' + marker.issue.subject + '</a>';
       /* var link = document.createElement('a');
        link.setAttribute('href',"/issue/" + issueId);
        link.innerHTML = marker.issue.subject;*/
        $scope.templateUrl = '/static/infowindow.html';
        $scope.content = marker.issue;
        console.log($scope.content);
        $scope.map.window.show = !$scope.map.window.show;

        $scope.$apply();
    };

    function addMarkers(issue, index, array) {
        var latLong = issue.geometries[0].coordinates;
        var marker = new google.maps.Marker ({
           // map: $scope.map,
            id: issue.id,
            latitude: latLong[1],
            longitude: latLong[0],
            issue: issue,
            coords: latLong,
            show: false,
        });
        // TODO check if user follows issue and color differently if yes
            //marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');

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

        $scope.closeClick = function() {
            $scope.map.window.show = false;
        };
});

app.controller('loginController', function($scope){

});

app.controller('loginShowController', function($scope, $rootScope){

    $scope.toggleShow = function() {
        $rootScope.showLogin = true;
    }
});

app.controller('templateController', function(){});












