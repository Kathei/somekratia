/**
 * Created by emmilinkola on 03/11/15.
 */

var searchIssues = new SearchIssues();

var app = angular.module('myApp', ['ngRoute', 'uiGmapgoogle-maps']);

app.controller('searchController', function($scope, $http){
   $scope.map = {
       center: {
           latitude: 60.1728365,
           longitude: 24.9399135,
       },
       zoom: 13,
   }
    $scope.coordinateSearch = function(bounds) {

    }

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
                console.log(searchResult);
                //$scope.names = searchResult.objects;
            });
    }


});

/* $(".search-button").on("click", function(){
 var searchInput = $("#search").val();
 console.log(searchInput);
 console.log("Moi");
 searchIssues.handleSearch(searchInput);
 });*/
