/**
 * Created by vihtori on 26/11/15.
 */
angular.module('myApp').controller('navbarController', ['$scope', '$http', 'MapHolder', 'UiState', function($scope, $http, MapHolder, UiState) {
    $scope.categories = [{id:0, name: "Kaikki kategoriat", origin_id: ""}];
    $scope.category = $scope.categories[0];
    $scope.selectCategory = $scope.category;
    $scope.uiState = UiState;
    $http.get('/categories').success(function(response) {
        $scope.categories = response['objects'];
        $scope.categories.unshift({ id: 0, name: "Kaikki kategoriat", origin_id: "" });
    }).error(function(foo, bar, baz){
    });
    $scope.categoryChanged = function(category) {
        MapHolder.categorySelected(category);
    };

    $scope.isSelected = function(option) {
        return MapHolder.filterCategory == option.origin_id;
    }

    $scope.closeAll = function() {
        for (var key in $scope.uiState) { 
            if ($scope.uiState.hasOwnProperty(key)) { 
                $scope.uiState[key] = false; 
            } 
        }
    };
}
]);