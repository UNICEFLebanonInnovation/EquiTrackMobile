(function() {
    'use strict';

    angular
        .module('app.core')
        .service('networkService', networkService);

    function networkService($ionicPopup, $translate, $cordovaNetwork) {
        var service = {
            isOffline : isOffline,
            showMessage : showMessage
        };

        return service;

        function isOffline(){            
            return $cordovaNetwork.isOffline();
        }

        function showMessage(title, content){
            if (title === undefined) {
              title = $translate.instant('service.network.title');
            }

            if (content === undefined) {
              content = $translate.instant('service.network.content');
            }

            $ionicPopup.alert({
              title  : title,
              content: content
            });
        }        
    }

})();