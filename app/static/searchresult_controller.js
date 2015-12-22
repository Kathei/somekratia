/**
 * Created by vihtori on 26/11/15.
 */
angular.module('myApp').controller('searchResultController', ['$scope', '$http', 'UiState', function($scope, $http, UiState) {
    $scope.uiState = UiState;
    $scope.searchText = {value: ""};
    $scope.$watch('searchResults', function(newval, oldval){
        if (typeof newval != "undefined"){
            UiState.showseashowResults = true;
        }
    });
}
]);