/**
 * Created by tiitulahti on 18/12/15.
 */
angular.module('myApp').controller('loginWindowController', ['$scope', '$http', function($scope, $http){
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

