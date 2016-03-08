angular.module('equitrack.utils', [])


.factory('$localStorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    delete: function(key){
        delete $window.localStorage[key];
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  };
}])
.factory('SoapEnv', ['$window', function($window) {
      var adfsEndpoint = "https://sts.unicef.org/adfs/services/trust/13/UsernameMixed";
      var resourceEndpoint = "https://etools-staging.unicef.org/API";
      var headers = {
        "Content-Type": "application/soap+xml; charset=utf-8"
      };

      function soap_body(username, password) {
        return '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
            '<s:Header>' +
            '<a:Action s:mustUnderstand="1">http://docs.oasis-open.org/ws-sx/ws-trust/200512/RST/Issue</a:Action>' +
            '<a:To s:mustUnderstand="1">' +
            adfsEndpoint +
            '</a:To>' +
            '<o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">' +
            '<o:UsernameToken u:Id="uuid-6a13a244-dac6-42c1-84c5-cbb345b0c4c4-1">' +
            '<o:Username>'+
             username+
            '</o:Username>' +
            '<o:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">' +
            password+
            '</o:Password>' +
            '</o:UsernameToken>' +
            '</o:Security>' +
            '</s:Header>' +
            '<s:Body>' +
            '<trust:RequestSecurityToken xmlns:trust="http://docs.oasis-open.org/ws-sx/ws-trust/200512">' +
            '<wsp:AppliesTo xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy">' +
            '<a:EndpointReference>' +
            '<a:Address>' +
            resourceEndpoint +
            '</a:Address>' +
            '</a:EndpointReference>' +
            '</wsp:AppliesTo>' +
            '<trust:KeyType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Bearer</trust:KeyType>' +
            '<trust:RequestType>http://docs.oasis-open.org/ws-sx/ws-trust/200512/Issue</trust:RequestType>' +
            '</trust:RequestSecurityToken>' +
            '</s:Body>' +
            '</s:Envelope>';
      }




  return {
    body: soap_body,
    adfsEndpoint: adfsEndpoint,
    headers: headers,
  };
}])

.factory('ErrorHandler', function($ionicLoading, $ionicHistory, $ionicPopup, $state, $translate){

    var default_message = $translate.instant('factory.error_handler.default_message');

    function parse(error){
        console.log('error response:', error);
        if (!error){
            return default_message;
        }
        if (typeof(error)=="string"){
            return error;
        } else if ((typeof(error)=="object") && (error.data)){
            if (error.data.detail){
                return error.data.detail;
            } else if (error.data.non_field_errors){
                return error.data.non_field_errors.join('<br>');
            } else if (typeof (error.data == "string") && (error.data.indexOf('security token could not be') != -1)){
                // this means ADFS returned an XML saying invalid credentials
                return $translate.instant('factory.error_handler.password');
            }
        }
        return default_message;
    }

    var popError = function (err, path, stay_on_page){
            console.log("got an error");
            $ionicLoading.hide();
            if (path){
                $state.go(path);
            } else if (!stay_on_page) {
                $ionicHistory.goBack();
            }

            $ionicPopup.alert({
                title: $translate.instant('factory.error_handler.unknow'),
                template: parse(err)
            });
    };
    return {
        parse:parse,
        popError:popError
    };
})

.service('NetworkService', function($ionicPopup, $translate){
  function isOffline(){
    return window.Connection && navigator.connection.type === Connection.NONE;
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
 
  return {
    isOffline       : isOffline,
    showMessage     : showMessage
  };
});