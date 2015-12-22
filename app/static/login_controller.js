/**
 * Created by tiitulahti on 18/12/15.
 */

app.controller('loginWindowController', ['$scope', '$http', 'UserData', 'UiState', function($scope, $http, UserData, UiState){
    $scope.userData = UserData;
    $scope.uiState = UiState;

    $scope.textfieldClick = function(){
        $scope.uiState.inputClick = true;
    }

    $scope.toggleShow = function() {
        if($scope.uiState.inputClick) {
            $scope.uiState.inputClick = false;
            console.log("if");
            return;
        }
        else {
            $scope.uiState.showLogin = !$scope.uiState.showLogin;
            console.log("else");
        }
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
            $scope.userData.subscriptions = response.subscriptions;
            $scope.uiState.showLogin = false;
            console.log($scope.userData.username);
        }).error(function(){
            alert("Kirjautumisessa tapahtui virhe, yritäthän uudelleen!");
        })
    };

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

/*app.controller('loginController', function($scope, UserData){
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
});     */