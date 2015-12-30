/**
 * Created by emmilinkola on 03/11/15.
 */

var searchIssues = new SearchIssues();


var app = angular.module('myApp', ['ngRoute', 'ngSanitize', 'uiGmapgoogle-maps', 'infiniteScroll']);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.transformRequest = function(data){
        if (data === undefined) {
            return data;
        }
        var dataString = '';
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                dataString = dataString.concat(key, '=', encodeURIComponent(data[key]), '&');
            }
        }
        return dataString.substring(0, dataString.length - 1); //Drop the trailing '?' or '&'
    }
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
}]);

app.factory('MapHolder', function() {
    var subscriptions = undefined;
    var map = undefined;
    var filter = "";
    var data = {
        get map() {
            return map;
        },
        set map(newVal) {
            if(newVal != map) {
                map = newVal;
                this.subscriptionsUpdated(subscriptions);
                this.categorySelected(filter);
            }
        },
        get filterCategory() {
            return filter;
        }
    }

    function updateFeatureSubscribedProperty(dataLayer, subscriptions, subscribeValue) {
        if(subscriptions != undefined) {
            for (var sub in subscriptions) {
                if (subscriptions.hasOwnProperty(sub)) {
                    var feature = dataLayer.getFeatureById(sub);
                    if(feature != undefined) {
                        feature.setProperty('subscribed', subscribeValue);
                    }
                }
            }
        }
    }
    function startsWith (string, prefix) {
        return string.slice(0, prefix.length) == prefix;
    }
    data.categorySelected = function(category) {
        filter = category.origin_id;
        if(map != undefined) {
            map.data.forEach(function(feature) {
                if(!feature.getProperty('tooOld')) {
                    var featureCategory = feature.getProperty('category_origin_id');
                    var categoryHidden = !startsWith(featureCategory, filter);
                    feature.setProperty('category_hidden', categoryHidden);
                }
            });
        }
    }

    data.subscriptionsUpdated = function(newSubs, oldSubs) {
        subscriptions = newSubs;
        if(data.map == undefined) {
            return;
        }
        updateFeatureSubscribedProperty(map.data, oldSubs, false);
        updateFeatureSubscribedProperty(map.data, newSubs, true);
    };
    return data;
})

app.factory('UiState', function() {
   return {
       'showProfile' : false,
       'showDetails': false,
       'showLoginWindow': false,
       'showLogin': false,
       'showRegister': false,
       'showSearchResults': false,
       'showRecent': false,
       'inputClick': false
   };
});

app.factory('UserData', function($http, MapHolder){
    var subscriptions = {};
    var data = {
        'userId': 0,
        'username': undefined,
        get subscriptions() {
            return subscriptions;
        },
        set subscriptions(newVal) {
            var oldVal = subscriptions;
            subscriptions = newVal;
            MapHolder.subscriptionsUpdated(newVal, oldVal);
        }
    };
    data.isLoggedIn = function() {
        return data.username != undefined && data.userId != 0;
    };
    data.profilePictureUrl = function() {
        if (data.userId != 0) {
            return "/user/" + data.userId + "/picture";
        } else {
            return;
        }
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
    var recentlyCommentedIssues;
    var requestCanceller;
    function updateIssueData(issueId) {
        if(requestCanceller != undefined) {
            requestCanceller.resolve();
        }
        requestCanceller = $q.defer();
        data.data = null;
        data.messages.length = 0;
        data.decisions.length = 0;
        $http.get('/issue/' + issueId +'/').then(function (response) {
            var issue = response.data.jsondetails;
            if(UserData.subscriptions.hasOwnProperty(issue.id)) {
                issue.subscribed = true;
            }
            data.data = issue;
            data.messages = response.data.messages;
        }, function (response) {
            alert("Could not load messages for issue: " + data.issueId);
        });

        $http.get('/issue/' + issueId + '/decisions').then(function(response) {
            data.decisions = response.data.objects;
        });
    }
    var data =  {
        textSearchResults: [],
        textSearchLoading: false,
        'messages' : [],
        'decisions' : [],
        'data': undefined,
        get issueId() {
            return issueId;
        },
        set issueId(val) {
            if (issueId != val) {
                issueId = val;
                updateIssueData(val);
            }
        },
        get recentlyCommented() {
            return recentlyCommentedIssues;
        },
        reloadRecentlyCommentedIssues: function() {
            $http.get('/issues/recent/comments').success(function (response) {
                recentlyCommentedIssues = response.commented;
            })
        },
        isMessageLiked: function(message) {
            return message.liked_by.indexOf(UserData.userId) > -1
        }
    };
    return data;
});


app.service('MessageService', function($http, IssueData) {
    function replaceNewLinesWithBreaks(str) {
        return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
    }
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
            for (var i = 0; i < messages.length; i++) {
                var created = Date.parse(messages[i].created);
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

    this.postMessage = function(issueId, newMessageText, replaceNewLines) {
        var text = replaceNewLines ? replaceNewLinesWithBreaks(newMessageText) : newMessageText;
        var config = {
            data: {
                messagefield: text
            },
            method: 'POST',
            url: "/issue/" + issueId + "/messages/"
        };
        return $http(config).success(function(response) {
            IssueData.messages.push(response);
            IssueData.reloadRecentlyCommentedIssues();
        }).error(function(){
            alert("Post doesn't work");
        });
    };

    this.replyToMessage = function(message, newMessageText, replaceNewLines) {
        var text = replaceNewLines ? replaceNewLinesWithBreaks(newMessageText) : newMessageText;
        var config = {
            method: 'POST',
            url: "/message/" + message.id + "/reply",
            data: { replyfield: text, }
        };
        console.log("nappia painettu");
        return $http(config).success(function(response) {
            IssueData.reloadRecentlyCommentedIssues();
        }).error(function() {
            alert("vastaus ei toimi");
        });
    };
    this.deleteMessage = function(messageId) {
       var messages = IssueDatassueData.messages;
        console.log("test");
        var config = {
            method: 'DELETE',
            url: "/message/" + messageId + '/',
        };
        return $http(config)
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

app.service('IssueService', function($http, IssueData){
    var searchInfo = {text: undefined, page: 0, pageSize: 40};
    this.searchInfo = searchInfo;
    this.getDecisions = function(issueId) {

    };
    this.subscribe = function(issueId) {

    };

    this.unsubscribe = function(issueId) {

    };
    this.textSearch = function(text, page, pageSize) {
        if (page == 1) {
            IssueData.textSearchResults.length = 0;
            IssueData.textSearchResultsDone = false;
            IssueData.textSearchResultCount = 0;
        }
        searchInfo.text = text;
        searchInfo.page = page;
        searchInfo.pageSize = pageSize

        var config = {
            method: 'GET',
            params: {
                search: searchInfo.text,
                format: 'json',
                pageSize: searchInfo.pageSize,
                page: searchInfo.page,
            },
            url: '/issues/text/'
        };
        IssueData.textSearchLoading = true;
        return $http(config).then(function(searchResult) {
            IssueData.textSearchResults.push.apply(IssueData.textSearchResults, searchResult.data.objects);
            IssueData.textSearchLoading = false;
            IssueData.textSearchResultCount = searchResult.data.meta.total_count;
            searchInfo.page = searchResult.data.meta.page;
            if (IssueData.textSearchResults.length == IssueData.textSearchResultCount) {
                IssueData.textSearchResultsDone = true;
            }

        }, function(data) {
            alert("Loading text search results failed: " + data);
        });
    };
    this.loadMoreTextResults = function() {
        return this.textSearch(searchInfo.text, searchInfo.page + 1, searchInfo.pageSize);
    };
});

app.controller('messageController', function($scope, $http, IssueData, MessageService, UiState, UserData) {
    $scope.issueData = IssueData;
    $scope.uiState = UiState;
    $scope.userData = UserData;
    $scope.messageText = {'value': ""};

    $scope.lastDecisionTime = function() {
        var data = $scope.issueData.data;

        var formatDate = function (datum) {
            var date = new Date(datum);
            return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
        };

        return data == undefined ? "" : formatDate(data.last_decision_time);
    }



    $scope.isTextLongEnough = function () {
        return $scope.messageText.value.length > 3;
    }
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
        for (var i = 0; i < $scope.issueData.messages.length; i++){
            var created = Date.parse(messages[i].created);
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

    $scope.postMessage = function(issueId) {

        if ($scope.isTextLongEnough()){

            var usersMessageText = $scope.messageText.value;
            MessageService.postMessage(issueId, usersMessageText, true).then(function(result) {
                $scope.messageText.value = "";
            });
        }

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
            for (var i = 0; i < decisions.length; i++) {
                var created = Date.parse(decisions[i].origin_last_modified_time);
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
        var messageLiked =  IssueData.isMessageLiked(message);
        var config = {
            url: '/message/' + message.id + '/vote',
            data: {
                value: 1
            },
            method: messageLiked ? 'DELETE' : 'POST'
        };
        message.liked = !message.liked;

        $http(config).success(function(response) {
            var likes = message.liked_by;
            if (config.method == 'POST') {
                likes.push(UserData.userId)
            } else {
                // Delete like
                var idx = likes.indexOf(UserData.userId);
                if (idx > -1) {
                    likes.splice(idx, 1);
                }
            }
        }).error(function(foo, bar, baz) {
            alert((message.liked ? "" : "un") + "like failed");
        });
    };
});

app.controller('replyController', function($scope, MessageService, UserData) {
    $scope.userData = UserData;
    $scope.showReplyControls = {value:false};
    $scope.replyText = {'value': ""};
    $scope.toggleReplyControls = function() {
        $scope.showReplyControls.value = !$scope.showReplyControls.value;
    }

    $scope.isTextLongEnough = function () {
        return $scope.replyText.value.length > 3;
    }

    $scope.replyToMessage = function(message) {
        if ($scope.isTextLongEnough()){
            $scope.showReplyControls.value = false;
            MessageService.replyToMessage(message, $scope.replyText.value, true).then(function(response) {
                $scope.replies.push(response.data);
                $scope.replyText.value = "";
            });
        }

    };

    });

app.controller('subController', function($scope, $http, UserData, IssueData, MapHolder) {
    $scope.userData = UserData;
    $scope.issueData = IssueData;
    $scope.subscribeClass = "grey";
    $scope.subscribeText = "Seuraa";
    $scope.$watch("issueData.data.subscribed", function(subscribed, oldVal) {
       if(subscribed) {
           $scope.subscribeClass = "blue";
           $scope.subscribeText = "Lopeta seuraaminen";
       } else {
           $scope.subscribeClass = "grey";
           $scope.subscribeText = "Seuraa";
       }
    });
    $scope.subscribeIssue = function(issue) {
        issue.subscribed = !issue.subscribed;
        if (issue.subscribed) {
            var config = {
                            method: 'POST',
                            url: "/issue/" + issue.id + "/subscribe"
            };
            $http(config).success(function(response) {
                $scope.subscribeClass = "blue";
                $scope.subscribeText = " Lopeta seuraaminen";
                $scope.userData.subscriptions[response.issueId.toString()] = response;
                if(MapHolder.map != undefined) {
                    var feature = MapHolder.map.data.getFeatureById(response.issueId);
                    feature.setProperty('subscribed', true);
                }
            }).error(function(foo, bar, baz) {
                alert("subscribe failed")
            });
        } else {
            var config = {
                method: 'DELETE',
                url: '/issue/' + issue.id + '/subscribe'
            };
            $http(config).success(function(response) {
                $scope.subscribeClass = "grey";
                $scope.subscribeText = " Seuraa";
                delete UserData.subscriptions[issue.id.toString()];
                MapHolder.map.data.getFeatureById(issue.id).setProperty('subscribed', false);
            }).error(function(foo, bar, baz) {
                alert("unsubscribe failed");
            });
        }

    };

});

app.controller('attachmentsController', function($scope, $sce){
        $scope.attachmentsShow = {value:false};
        $scope.toggleAttachments = function() {
            $scope.attachmentsShow.value = !$scope.attachmentsShow.value;
        };
        $scope.to_trusted = function (html) {
            return $sce.trustAsHtml(html);
        }
    }
);

app.controller('recentDecisionsController', function($scope, $http) {
    $http.get('/issues/recent').success(function(response){
        $scope.recentIssues = response.recent_decisions;
        console.log(response);
    });
});


app.controller('recentController', function($scope, $http, IssueData) {
    $scope.issueData = IssueData;
    IssueData.reloadRecentlyCommentedIssues();
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

app.controller('textSearchController', function($scope, IssueService, UiState){
    $scope.textSearch = function(text) {
        IssueService.textSearch(text, 1, 40);
        UiState.showSearchResults = true;
        UiState.showDetails = false;
    }
});

app.controller('searchController', function($scope, $http, $timeout, IssueData, IssueService, UserData, MapHolder){
    $scope.canLoad = true;
    $scope.issueData = IssueData;
    $scope.issueService = IssueService;
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
        if($scope.map.window.marker.id != feature.getId()) {
            $scope.map.window.show = true;
        } else {
            $scope.map.window.show = !$scope.map.window.show;
        }
        var geometry = feature.getGeometry().get();
        var lat = geometry.lat;
        var lng = geometry.lng;
        $scope.map.window.marker.id = feature.getId();
        $scope.map.window.marker.issue = $scope.content;
        $scope.map.window.marker.coords = [geometry.lng(), geometry.lat()];
        $scope.map.window.issue = $scope.content;
        if($scope.map.window.show) {
            var map = MapHolder.map;
            var lat = (map.getBounds().getNorthEast().lat() - map.getCenter().lat()) / 2 + geometry.lat();
            MapHolder.map.panTo({'lat': lat, 'lng': geometry.lng()});
        }
        $scope.$apply();
    };

    var dataLayerInitialized = false;
    $scope.map.mapEvents = {tilesloaded: function (map) {
        MapHolder.map = map;
        if (!dataLayerInitialized) {
            dataLayerInitialized = true;
            $scope.$apply(function () {
                map.data.loadGeoJson('/static/issue_index.json');
                map.data.addListener("click", function(event) {
                    featureClick(event.feature);
                });

            });

            map.data.setStyle(function(feature) {
                //Filter categories
                var category = feature.getProperty('category_origin_id');
                var icon =  '/static/img/marker-orange.png';
                if (UserData.subscriptions.hasOwnProperty(feature.getId())) {
                    icon = 'static/img/marker-blue.png';
                }
                var tooOld = feature.getProperty("tooOld");
                var categoryHidden = feature.getProperty('category_hidden');
                categoryHidden = categoryHidden != undefined && categoryHidden;
                return { visible: !categoryHidden && !tooOld, icon: icon};
            });

            map.data.addListener('addfeature', function(e) {
                var feature = e.feature;
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
                if(tooOld) {
                    feature.setProperty("tooOld", true);
                }
            });
        }},};


    $scope.closeClick = function() {
        $scope.map.window.show = false;
    };
    $scope.loadMoreSearchResults = function() {
        $scope.canLoad = false;
        IssueService.loadMoreTextResults().then(function (result) {
            $scope.canLoad = true;
        });
    }
    $scope.canLoadMoreTextResults = function() {
        return $scope.canLoad && !IssueData.textSearchResultsDone;
    }
});

app.controller('windowController', function($scope, $http, IssueData, UiState) {
    $scope.uiState = UiState;
    $scope.issueData = IssueData;
    $scope.windowClick = function (issueId) {
        $scope.issueData.issueId = issueId;
        if ($scope.uiState.showSearchResults == false && $scope.uiState.showRecent == false) {
            for (var key in $scope.uiState) {
                if ($scope.uiState.hasOwnProperty(key)) {
                    $scope.uiState[key] = false;
                }
            }
        }
        $scope.uiState.showDetails = true;
        //console.log(issue);
        //console.log("täällä! showIssue: " + UiState.showIssue);
    };

});

app.controller('templateController', function(){});

app.controller('closeController', function($scope, IssueData, UiState){
    var controller = document.querySelector('[ng-controller="messageController"]');
    var topscope = angular.element(controller).scope();
    $scope.uiState = UiState;
    $scope.issueData = IssueData;
    $scope.closeIssue = function() {
        //console.log('ruksia klikattiin');
        $scope.uiState.showDetails = false;
    }

    $scope.closeSearchResults = function() {
        $scope.uiState.showSearchResults = false;
    }

    $scope.closeRecent = function() {
        $scope.uiState.showRecent = false;
    }
});

app.controller('profileController', function($scope, $http, UserData, UiState) {
    $scope.userData = UserData;
    $scope.uiState = UiState;
    //console.log(UiState.showProfile);

    $http.get("/user/").success(function(response){
        $scope.user = response;
        $scope.subscriptions = $scope.user.subscriptions;
    }).error(function(foo, bar, baz){
        //alert("User not found");
    });
});

app.controller('profileNavController', function($scope, $http, UserData, UiState){
    //profileScope.showProfile = false;
    $scope.uiState = UiState;
    $scope.userData = UserData;
    $http.get("/user/").success(function(response){
        $scope.userData.userId = response.id;
        $scope.userData.username = response.name;
        $scope.user = response;
        //$scope.getPicture($scope.user.id);
    }).error(function(foo, bar, baz){
        //alert("User not found");
    });



    $scope.toggleShow = function() {
        for (var key in $scope.uiState) {
            if ($scope.uiState.hasOwnProperty(key)) {
                $scope.uiState[key] = false;
            }
        }
        $scope.uiState.showProfile = true;
    }

});

app.controller('closeProfileController', function($scope, UiState){
    $scope.uiState = UiState;

    $scope.closeProfile = function() {
        //console.log('ruksia klikattiin');
        $scope.uiState.showProfile = false;
    }
});

app.controller('subscriptionController', function($scope, $http, UserData){

    $http.get("/user/").success(function(response){
        $scope.user = response;
        $scope.subscriptions = UserData.subscriptions;
        console.log($scope.user);
    }).error(function(foo, bar, baz){
        //alert("User not found");
    });

});

app.controller('messageInputController', function($scope) {

});








