/**
 * Created by vihtori on 26/11/15.
 */
angular.module('myApp').controller('searchResultController', ['$scope', '$http', function($scope, $http) {
    $scope.showResults = false;
    $scope.$watch('searchResults', function(newval, oldval){
        if (typeof newval != "undefined"){
            $scope.showResults = true;
        }
    });
    /*$scope.categories = [{id:0, name: "Kaikki kategoriat"}];
    $scope.category = $scope.categories[0];
    $scope.selectCategory = $scope.category;
    $http.get('/categories').success(function(response) {
        $scope.categories = response['objects'];
        $scope.categories.unshift({ id: 0, name: "Kaikki kategoriat" });
        console.log(response);
    }).error(function(foo, bar, baz){
        alert("Post doesn't work");
    });
    $scope.categoryChanged = function() {
        alert($scope.category);
    };*/
}
]);