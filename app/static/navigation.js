/**
 * Created by emmilinkola on 03/11/15.
 */

var searchIssues = new SearchIssues();


var app = angular.module('myApp', ['ngRoute', 'uiGmapgoogle-maps']);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
}]);

app.factory('UserData', function($http){
    var data = {'userId': 0, 'username': undefined, 'showProfile':false, 'subscriptions': []};
    data.isLoggedIn = function() {
        return data.username != undefined && data.userId != 0;
    }
    $http.get('/user/subscriptions').success(function(response) {
        data.subscriptions = response.subscriptions;
    }).error(function(){
        alert('ei saa tilauksia');
    });
    return data;
});

app.factory('IssueData', function($http, $q, UserData) {
    var issueId = 0;
    var requestCanceller;
    function updateIssueData(issueId) {
        if(requestCanceller != undefined) {
            requestCanceller.resolve();
        }
        requestCanceller = $q.defer();
        data.data = null;
        data.messages.length = 0;
        $http.get('/issue/' + issueId +'/').then(function (response) {
            var issue = response.data.jsondetails;
            if(UserData.subscriptions.indexOf(issue.id) > -1) {
                issue.subscribed = true;
            }
            data.data = issue;
            data.messages = response.data.messages;
        }, function (response) {
            alert("Could not load messages for issue: " + data.issueId);
        });

        $http.get('/issue/' + issueId + '/decisions').then(function(response) {
            data.decisions = response.data;
        });
    }
    var data =  {
        'messages' : [],
        'data': undefined,
        'showDetails': false,
        get issueId() {
            return issueId;
        },
        set issueId(val) {
            if (issueId != val) {
                issueId = val;
                updateIssueData(val);
            }
        }
    };
    return data;
});


app.service('MessageService', function($http, IssueData) {
    this.getMessages = function(issueId) {
        $http.get("/issue/"+ issueID +"/messages/").success(function(response) {
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
    };

    this.postMessage = function(issueId, newMessageText) {
        var config = {headers: { 'Content-Type': 'application/x-www-form-urlencoded'}};
        $http.post("/issue/" + issueId + "/messages/", "messagefield="+encodeURIComponent(newMessageText), config).success(function(response) {
            //TODO show loading icon
            alert("POST TOIMII");
            IssueData.messages.push(response);
            //$scope.$apply();

        }).error(function(){
            alert("Post doesn't work");
        });
    };

    this.replyToMessage = function(messageId, newMessageText) {
        var config = {headers: { 'Content-Type': 'application/x-www-form-urlencoded'}};
        $http.post("/message/" + message.id + "/reply", "replyfield="+encodeURIComponent(newMessageText), config).success(function(response) {
            $scope.latestReply = Date.parse(response.created);
            IssueData.messages.push(response);
            message.showReplyControls.value = !message.showReplyControls.value;
            console.log(message.showReplyControls);
        }).error(function() {
            alert("vastaus ei toimi");
        });
    };
    this.deleteMessage = function(messageId) {
       var messages = IssueDatassueData.messages;
        console.log("test");
        var config = {
            method: 'DELETE',
        };
        $http.delete("/message/" + messageId + '/', config)
            .success(function() {
                var idx = 0;
                for(;idx < messages.length; idx++) {
                    if (messages[idx].id == messageId) {
                        messages.splice(idx, 1);
                        break;
                    }
                }
                //alert("deleted: " + messageId);
            }).error(function() {
                alert("delete failed!");
            });
    }
});

app.service('IssueService', function($http, MessageService){
    this.getDecisions = function(issueId) {

    };

    this.subscribe = function(issueId) {

    };

    this.unsubscribe = function(issueId) {

    };
});

app.controller('messageController', function($scope, $http, IssueData, MessageService) {
    $scope.issueData = IssueData;
    $scope.$watch('issueData.messages', function(messages, oldVal){
        if(messages == undefined || messages.length == 0) {
                $scope.latestMessage = 'undefined';
                $scope.firstMessage = 'undefined';
                $scope.messages = [];
                return;
        }
        $scope.latestMessage = messages[0];
        $scope.firstMessage = messages[0];
        var first = Date.parse(messages[0].created);
        var last = Date.parse(messages[0].created);
        for (message of $scope.issueData.messages) {
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
        $scope.messages = $scope.issueData.messages;
    });
    $scope.deleteMessage = function(messageId){
        MessageService.deleteMessage(messageId);
    };

    $scope.postMessage = function(issueId, newMessageText) {
        MessageService.postMessage(issueId, newMessageText);
    };

    $scope.getDecisions = function(issueID) {
        $http.get("/issue/" + issueID + "/decisions/").success(function (response) {
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
            for (decision of
            decisions
            )
            {
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
        }).error(function (foo, bar, baz) {
            alert("Error getting decisions!");
        });
    }


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
        //console.log(timeStamp);
        var position = 0;
        if (timeSpan != 0) {
            position = (timeStamp - firstAndLast.begin) / timeSpan;
        }
        var offset = 4;
        var percentage = position * 92 + offset;
        // console.log(position);
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
    $scope.toggleReplyControls = function(message) {
        message.showReplyControls.value = !message.showReplyControls.value;
    }
});

app.controller('subController', function($scope, $http, UserData) {
    $scope.userData = UserData;

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

        $scope.recentlyCommented = response.commented;
        //console.log(response.commented);
        for (i = 0; i < 10; i++) {
            //console.log(i);
            $scope.getNameOfIssue($scope.recentlyCommented[i].issueID, i);
        }
        //console.log($scope.recentlyCommented[0].issueID);
    });

    $scope.getNameOfIssue = function(issueID, i) {
        $http.get('/issue/'+ issueID).success(function(response){
            //console.log(response);
            var issueName = response.jsondetails.subject;
            $scope.recentlyCommented[i].issue = response.jsondetails;
            $scope.recentlyCommented[i].name = issueName;
            //console.log(issueName);
        }).error(function(foo, bar, baz) {
            alert("could not find recent issue");
        });
    }



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

app.controller('textSearchController', function($scope, $http){
    $scope.textSearch = function(text) {

        console.log("test");
        var config = {
            'params' : {
                'search': text,
                'format': 'json',
            },
        };
        $http.get("/issues/text/", config)
            .then(function(searchResult) {
                var resultController = document.querySelector('[ng-controller="searchResultController"]');
                var resultScope = angular.element(resultController).scope();
                resultScope.searchText.value = searchResult.config.params.search;
                resultScope.searchResults = searchResult.data.objects;
            });
    }
});

app.controller('searchController', function($scope, $http, $timeout, IssueData, UserData){
    $scope.issueMarkers = [];
    $scope.currentIssues = {};
    $scope.templateUrl = {};
    $scope.windowContent = {};
    $scope.MapOptions = {
        markers: {
            selected: {},
        },
        mapTypeControl: false,
        mapTypeControlOptions: { mapTypeIds: [] },

    };

    $scope.map = {
        center: {
            latitude: 60.1728365,
            longitude: 24.9399135,
        },
        zoom: 13,
        options: $scope.MapOptions,
        window: {
            marker: {},
            show: false,
            closeClick: function () {
                this.show = false;
            },
            options: {
                maxWidth: 200,
                pixelOffset: {
                    height: -30,
                    width: 0,
                }
            },


            issue: {},
        }
    };

    function featureClick(feature) {
        $scope.templateUrl = '/static/infowindow.html';
        IssueData.issueId = feature.getId();
        $scope.content = {issueId: feature.getId()};
        console.log($scope.content);
        $scope.map.window.show = !$scope.map.window.show;
        var geometry = feature.getGeometry().get();
        var lat = geometry.lat;
        var lng = geometry.lng;
        $scope.map.window.marker.id = feature.getId();
        $scope.map.window.marker.issue = $scope.content;
        $scope.map.window.marker.coords = [geometry.lng(), geometry.lat()];
        $scope.map.window.issue = $scope.content;
        $scope.$apply();
    };

    var dataLayerInitialized = false;
    $scope.map.mapEvents = {tilesloaded: function (map) {
        if (!dataLayerInitialized) {
            dataLayerInitialized = true;
            $scope.$apply(function () {
                map.data.loadGeoJson('/static/issue_index.json');
                map.data.addListener("click", function(event) {
                    featureClick(event.feature);
                });

            });
            map.data.setStyle(function(feature) {
                //Show only issues with decisions less than 6 months ago
                var lastModified = new Date(feature.getProperty('latest_decision_date'));
                var now = new Date();
                var month = now.getMonth();
                var maxTimeSinceLatestDecision = 6;
                if(month > maxTimeSinceLatestDecision) {
                    now.setMonth(now.getMonth() - maxTimeSinceLatestDecision);
                } else {
                    now.setMonth((month - maxTimeSinceLatestDecision) % 11);
                    now.setFullYear(now.getFullYear()-Math.ceil(maxTimeSinceLatestDecision / 12));
                }
                var tooOld = lastModified.getTime() < now.getTime();
                //Filter categories
                var category = feature.getProperty('category_origin_id');
                var icon =  '/static/img/marker-orange.png';
                if (UserData.subscriptions.indexOf(feature.getId()) > -1) {
                    icon = 'static/img/marker-blue.png';
                }
                return { visible: !tooOld, icon: icon};
            });
        }},};


    $scope.closeClick = function() {
        $scope.map.window.show = false;
    };


});

app.controller('windowController', function($scope, $http, IssueData) {
    $scope.issueData = IssueData;
    $scope.windowClick = function (issue) {
        $scope.issueData.showDetails = true;
        console.log(issue);
        console.log("täällä! showIssue: " + $scope.issueData.showIssue);
    };

});

app.controller('loginController', function($scope, UserData){
    $scope.userData = UserData;
    var loginbutton = document.querySelector('[ng-controller="loginShowController"]');
    var loginscope = angular.element(loginbutton).scope();

    $scope.toggleShow = function() {
        loginscope.toggleShow();
    }

});

app.controller('loginShowController', function($scope, $rootScope, UserData){
    $scope.userData = UserData;
    $scope.inputClick = false;

    $scope.toggleShow = function() {
        if($scope.inputClick) {
            $scope.inputClick = false;
            return;
        }
        else {
            $rootScope.showLogin = !$rootScope.showLogin;
        }
    }
});

app.controller('templateController', function(){});

app.controller('closeController', function($scope, IssueData){
    var controller = document.querySelector('[ng-controller="messageController"]');
    var topscope = angular.element(controller).scope();
    $scope.issueData = IssueData;
    $scope.closeIssue = function() {
        console.log('ruksia klikattiin');
        $scope.issueData.showDetails = false;
    }
});

app.controller('profileController', function($scope, $http, UserData) {
    $scope.userData = UserData;
    console.log($scope.userData.showProfile);

    $http.get("/user/").success(function(response){
        $scope.user = response;
    }).error(function(foo, bar, baz){
        //alert("User not found");
    });
});

app.controller('profileNavController', function($scope, $http, UserData){
    //profileScope.showProfile = false;
    $scope.userData = UserData;
    $http.get("/user/").success(function(response){
        $scope.user = response;
        //$scope.getPicture($scope.user.id);
    }).error(function(foo, bar, baz){
        alert("User not found");
    });

    $scope.getPicture = function(userId) {
        $http.get("/user/" + userId + "/picture").success(function (response) {
            //console.log(response);
            $scope.user.picture = response;

        }).error(function (foo, bar, baz) {
            alert("Error getting profile pic!");
        });
    }

    $scope.toggleShow = function() {
        console.log(UserData.showProfile);
        $scope.userData.showProfile = true;
    }

});

app.controller('closeProfileController', function($scope, UserData){
    $scope.closeProfile = function() {
        //console.log('ruksia klikattiin');
        UserData.showProfile = !UserData.showProfile;
    }
});

app.controller('subscriptionController', function($scope){
    var controller = document.querySelector('[ng-controller="searchController"]');
    var topScope = angular.element(controller).scope();

    console.log(topScope.subscriptions);
});











