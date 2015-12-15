/**
 * Created by vihtori on 26/11/15.
 */
angular.module('myApp').controller('searchResultController', ['$scope', '$http', function($scope, $http) {
    $scope.showResults = false;
    $scope.searchText = {value: ""};
    $scope.$watch('searchResults', function(newval, oldval){
        if (typeof newval != "undefined"){
            $scope.showResults = true;
        }
    });
}
]);