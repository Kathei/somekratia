/**
 * Created by tiitulahti on 18/12/15.
 */

app.controller('loginWindowController', ['$scope', '$http', 'UserData', function($scope, $http, UserData){
    $scope.userData = UserData;

    console.log($scope.userData+"userdata?");

    $scope.textfieldClick = function(){
        var loginbutton = document.querySelector('[ng-controller="loginShowController"]');
        var loginscope = angular.element(loginbutton).scope();

        loginscope.inputClick = true;
    }

    $scope.login = function(username, password){
        var config = {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
            method: 'POST',
        };
        $http.post("/login", "username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password), config).success(function(response){
            alert("Tervetuloa "+ username);
            $scope.userData.username = response.name;
            $scope.userData.userId = response.id;
            console.log($scope.userData.username);
        }).error(function(){
            alert("Kirjautumisessa tapahtui virhe, yritäthän uudelleen!");
        })
    };

    $scope.cancel = function(){
        var loginbutton = document.querySelector('[ng-controller="loginShowController"]');
        var loginscope = angular.element(loginbutton).scope();

        $scope.toggleShow = function() {
            loginscope.toggleShow();
        }
    }
}
]);

angular.module('myApp').controller('logoutController', ['$scope', '$http', 'UserData', function($scope, $http, UserData){
    $scope.userData = UserData;

    $scope.logout = function(){
        var config = {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
            method: 'POST',
        };
        $http.post("/logout", config).success(function(response){
            alert("Uloskirjautuminen onnistui.");
            $scope.userData.username = undefined;
            $scope.userData.userId = 0;
        }).error(function(){
            alert("Uloskirjautumisessa tapahtui virhe, yritäthän uudelleen!");
        })
    };
}
]);
