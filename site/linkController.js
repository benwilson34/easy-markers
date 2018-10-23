var app = angular.module('app', []);

app.controller('linkController', function ($scope) {
    $scope.childOnLoad = function () {
        if (document.URL.indexOf("tutorial") > -1) {
            var pageTitle = document.getElementById("pageTitle").children[0];
            pageTitle.href = "../index.html";
            pageTitle.children[0].src = "../pics/pin2.png";
            
            var nav = document.getElementById("nav");
            nav.children[0].href = "../index.html";
            nav.children[1].href = "index.html";
            nav.children[2].href = "../labs.html";

            console.log("done correcting links.");
        }
    };

    $scope.childOnLoad();
});