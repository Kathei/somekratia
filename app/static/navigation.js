/**
 * Created by emmilinkola on 03/11/15.
 */
$(document).ready(function(){
    var searchIssues = new SearchIssues();

    /*var app = angular.module('myApp', ['ngRoute']);
    app.controller('myCtrl', function($scope) {

    });

    app.controller('searchController', function($scope, $http){
        console.log("test");
        $http.get("http://dev.hel.fi/openahjo/v1/issue/search/?text=%s&format=json%s")
            .success(function(searchResult) {
                console.log(searchResult);
                $scope.names = searchResult.objects;
            });
    });*/

    $(".search-button").on("click", function(){
        var searchInput = $("#search").val();
        console.log(searchInput);
        console.log("Moi");
        searchIssues.handleSearch(searchInput);
    });
});