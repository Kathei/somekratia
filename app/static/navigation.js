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
    /*$scope.latestMessage = Date.parse("2999-11-24T15:24:25.730Z");
    $scope.latestDecision = Date.parse("2999-11-24T15:24:25.730Z");
    $scope.firstMessage = Date.parse("1970-11-24T15:24:25.730Z");
    $scope.firstDecision = Date.parse("1970-11-24T15:24:25.730Z");*/
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
            $scope.latestMessage = Date.parse(response.created);
            $scope.messages.push(response)
            $scope.$apply();

        }).error(function(){
            alert("Post doesn't work");
        });


        //$scope.messages.push({text: newMessageText, poster: 'dynamic', time: timeStamp() });

    };

    $http.get("/issue/"+$scope.issueID +"/messages/").success(function(response) {
        console.log(response);
        var messages = response.messages;
        if (messages.length == 0) {
            $scope.latestMessage = 'undefined';
            $scope.firstMessage = 'undefined';
            $scope.messages = [];
            return;
        }
        $scope.latestMessage = messages[0];
        $scope.firstMessage = messages[0];
        var first = Date.parse(messages[0].created);
        var last = Date.parse(messages[0].created);
        for (message of messages) {
            var created = Date.parse(message.created);
            if (created >= last) {
                $scope.latestMessage = created;
                last = created;
            }
            if (created <= first) {
                $scope.firstMessage = created;
                first = created;
            }
        }
        $scope.messages = messages;
    }).error(function(foo, bar, baz){
        alert("Error getting messages!");
    });

    $http.get("/issue/"+$scope.issueID +"/decisions/").success(function(response) {
        console.log(response);
        var decisions = response.objects;
        if (decisions.length == 0) {
            $scope.latestDecision = 'undefined';
            $scope.firstDecision = 'undefined';
            $scope.messages = [];
            return;
        }
        $scope.latestDecision = decisions[0];
        $scope.firstDecision = decisions[0];
        var first = Date.parse(decisions[0].origin_last_modified_time);
        var last = Date.parse(decisions[0].origin_last_modified_time);
        for (decision of decisions) {
            var created = Date.parse(decision.origin_last_modified_time);
            if (created >= last) {
                $scope.latestDecision = created;
                last = created;
            }
            if (created <= first) {
                $scope.firstDecision = created;
                first = created;
            }
        }
        $scope.decisions = decisions;
    }).error(function(foo, bar, baz){
        alert("Error getting decisions!");
    });


    function getTimeSpan() {
        var span = {}
        if ($scope.latestMessage == 'undefined') {
            span.begin = $scope.firstDecision;
            span.end = $scope.latestDecision;
        } else if ($scope.latestDecision == 'undefined') {
            span.begin = $scope.firstMessage;
            span.end = $scope.latestMessage;
        } else {
            span.begin = $scope.firstMessage < $scope.firstDecision ? $scope.firstMessage : $scope.firstDecision;
            span.end = $scope.latestMessage > $scope.latestDecision ? $scope.latestMessage : $scope.latestDecision;
        }
        return span;
    }

    $scope.getStyle = function(index, timing) {
        var timeStamp = Date.parse(timing);
        var firstAndLast = getTimeSpan();
        var timeSpan = firstAndLast.end - firstAndLast.begin;
        console.log(timeStamp);
        var position = 0;
        if (timeSpan != 0) {
            position = (timeStamp - firstAndLast.begin) / timeSpan;
        }
        var offset = 6;
        var percentage = position * 86 + offset;
        //console.log(position);
        return {
          'left': percentage + '%'
        }
    };

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

app.controller('searchController', function($scope, $http, $timeout){

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
    var markerRefreshPromise;
    $scope.map.mapEvents.bounds_changed = function (map, eventName, args) {
        // reset the update timer by canceling the last call
        if (markerRefreshPromise != undefined) {
            $timeout.cancel(markerRefreshPromise);
        }
        var waitTime = 500;
        // schedule marker refresh to start in 500 ms (waitTime)
        markerRefreshPromise = $timeout($scope.setMarkers, waitTime, false, map.getBounds());
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
        var config = {
            'params' : {
                'minLat': bounds.getSouthWest().lat().toFixed(3),
                'maxLat': bounds.getNorthEast().lat().toFixed(3),
                'minLong': bounds.getSouthWest().lng().toFixed(3),
                'maxLong': bounds.getNorthEast().lng().toFixed(3),
                'format': 'json',
                'page' : 1,
                'pageSize' : 50,
            },
        };

        function loadData(config, initial, semaphore) {
            $http.get("/issues/area", config)
                .success(function (searchResult) {
                    // stop updating if new query has been started
                    if(semaphore.stop) {
                        return;
                    }
                    // clear markers when first page is received
                    if (initial) {
                        $scope.issueMarkers.length = 0;
                    }
                    searchResult.objects.forEach(addMarkers);
                    // read paging metadata from response
                    var pageSize = searchResult.meta.limit;
                    var page = searchResult.meta.page;
                    var total = searchResult.meta.total_count;
                    var pages = total / pageSize;
                    // load next page if available
                    if (page < pages && !semaphore.stop && page < 4) {
                        config.params.page = page+1;
                        loadData(config, false, semaphore);
                    } else {
                        // update loading status
                        semaphore.markersUpdating = false;
                    }
                }).error(function (data, status, headers, config) {
                    console.log("error")
                    semaphore.markersUpdating = false;
                });
        }
        // cancel previous marker request
        if ($scope.previousRequestSemapahore != undefined) {
            $scope.previousRequestSemapahore.stop = true;
        }
        var semaphore = {stop: false, markersUpdating: true};
        loadData(config, true, semaphore);
        $scope.previousRequestSemaphore = semaphore;
    }

        $scope.closeClick = function() {
            $scope.map.window.show = false;
        };
});

app.controller('loginController', function($scope){
    var loginbutton = document.querySelector('[ng-controller="loginShowController"]');
    var loginscope = angular.element(loginbutton).scope();

    $scope.toggleShow = function() {
        loginscope.toggleShow();
    }

});

app.controller('loginShowController', function($scope, $rootScope){

    $scope.toggleShow = function() {
        $rootScope.showLogin = !$rootScope.showLogin;
    }
});

app.controller('templateController', function(){});












