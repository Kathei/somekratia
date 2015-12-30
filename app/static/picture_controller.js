/**
 * Created by emmilinkola on 30/12/15.
 */

app.directive('file', function () {
    return {
        scope: {
            file: '='
        },
        link: function (scope, el, attrs) {
            el.bind('change', function (event) {
                var file = event.target.files[0];
                scope.file = file ? file : undefined;
                scope.$apply();
            });
        }
    };
});


app.controller('pictureController', ['$scope', '$http', 'UserData', function($scope, $http, UserData){

    $scope.changePicture = function() {
        $http({
            method: 'POST',
            url: '/user/' + UserData.userId + "/picture",
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            data: {
                file: $scope.file,
            },
            transformRequest: function (data, headersGetter) {
                var formData = new FormData();
                angular.forEach(data, function (value, key) {
                    formData.append(key, value);
                });

                var headers = headersGetter();
                delete headers['Content-Type'];

                return formData;
            }
        }).success(function(response){
            alert("Profiilikuvan vaihto onnistui!");
        }).error(function(){
            alert("Kuvan vaihtamisessa tapahtui virhe, yritäthän uudelleen!");
        });

    }

}]);