angular.module('equitrack.services', ['app.core'])

.service('API_urls', function(localStorageService, apiHostDevelopment, defaultConnection) {
        var defaultConn = defaultConnection;
        var options = { 
                        0 : apiHostDevelopment,                 //  development 
                        1 : 'https://etools-dev.unicef.org',    //  staging
                        2 : 'https://etools-staging.unicef.org' //  production
                      };

        function get_base(){
            var base_url = localStorageService.get('base_url');
            if (base_url){
                return options[base_url];
            }
            return options[defaultConn];

        }
        function get_option_name(){
            var base_url = localStorageService.get('base_url');
            if (base_url){
                return base_url;
            }
            return defaultConn;
        }
        function set_base(base){
            localStorageService.set('base_url', base);
        }
        return {
            BASE: get_base,
            ADFS: (get_option_name() == '0') ? false: true,
            get_option_name: get_option_name,
            set_base: set_base
        };
})
.service('TokenService', function(localStorageService){
        function urlBase64Decode(str) {
           var output = str.replace('-', '+').replace('_', '/');
           switch (output.length % 4) {
               case 0:
                   break;
               case 2:
                   output += '==';
                   break;
               case 3:
                   output += '=';
                   break;
               default:
                   throw 'Illegal base64url string!';
           }
           return $window.atob(output);
        }

        function getClaimsFromToken() {
            var token = localStorageService.get('jwtoken');
            //console.log("getclaims", token);
            var user = {"no":"no"};
            if (typeof token !== 'undefined') {
                var encoded = token.split('.')[1];
                user = JSON.parse(urlBase64Decode(encoded));
            }
            return user;
        }
        function isTokenExpired(){
            var token = localStorageService.getObject('tokenClaims');
            var now = new Date();
            if ((!Object.keys(token).length) ||
                ((token.exp*1000) < now.getTime())){
                return true;
            } else {
                return false;
            }
        }
        return{
            getClaimsFromToken: getClaimsFromToken,
            isTokenExpired:isTokenExpired
        };
})
.service('myHttp', function($q, $http, localStorageService, $ionicPopup, LoginService, $ionicLoading, TokenService, $translate){
        var showConfirm = function(template, succ, fail) {
            var confirmPopup = $ionicPopup.prompt({
               title: $translate.instant('service.my_http.session_expired.title'),
               template: template,
               inputType: 'password',
               inputPlaceholder: $translate.instant('service.my_http.session_expired.password')
             });
            confirmPopup.then(function (res) {
                if (res) {
                    succ(res);
                } else {
                    fail(res);
                }
            });
        };
        var httpWrapp = function(method, path, data, ignore_expiration){          
            var def = $q.defer();
            var req = {
                  method: method,
                  url: path
                };
            if (method != 'GET'){
                req.data = data;
            }
            function confirmed_reLogin(res){
                $ionicLoading.show( { template: "<loading></loading>" });
                console.log(res, 'we are logging in again');
                var relogin_cred = localStorageService.getObject('relogin_cred');
                relogin_cred.password = res;
                LoginService.refreshLogin(
                    function(succ){
                        // continue with the action
                        console.log('managed to relogin', succ);
                        $http(req).then(
                            function(res){$ionicLoading.hide(); def.resolve(res);},
                            function(rej){$ionicLoading.hide(); def.reject(rej);}
                        );
                    },
                    function(fail){
                        console.log("failed to relogin", fail);
                        def.reject(fail);
                    }
                    //relogin_cred;
                );
            }
            function failed_reLogin(){
                console.log('user chose not to continue with re-logging in');
                def.reject('Cancelled by user');
            }
            if ((!ignore_expiration) && (TokenService.isTokenExpired())){
                $ionicLoading.hide();
                showConfirm(                  
                  $translate.instant('service.my_http.failed_relogin'),
                  confirmed_reLogin, 
                  failed_reLogin
                );
            } else {
                $http(req).then(
                    function(res){def.resolve(res);},
                    function(rej){def.reject(rej);}
                );
            }
            return def.promise;
        };

        return {
            get: function(path, ignore_expiration){
                return httpWrapp('GET', path, false, ignore_expiration);
            },
            post:function(path, data, ignore_expiration){
                return httpWrapp('POST', path, data, ignore_expiration);
            },
            patch:function(path, data, ignore_expiration){
                return httpWrapp('PATCH', path, data, ignore_expiration);
            },
        };
})
.service('LoginService',['$q', '$rootScope', 'localStorageService', 'Auth', 'API_urls',
    function($q, $rootScope, localStorageService, Auth, API_urls) {
        function successAuth(res, retSuccess) {
               var JWToken;
               if (API_urls.ADFS){
                    console.log(res);
                    var mys;
                    var r;
                    var encoded_token;
                    mys = res.data.substr(res.data.indexOf('BinarySecurityToken'));
                    r = mys.substr(mys.indexOf('>'));
                    encoded_token = r.substr(1,r.indexOf('<')-1);

                    JWToken = Auth.urlBase64Decode(encoded_token);
               } else {
                    JWToken = res.data.token;
               }

               localStorageService.set('jwtoken', JWToken);
               localStorageService.setObject('tokenClaims', Auth.getTokenClaims());

               // trigger a call to get the current User

               //console.log(localStorageService.getObject('currentUser'));
               retSuccess(localStorageService.get('jwtoken'));
        }
        function failAuth(res){
               //console.log("failAuth")
               $rootScope.error = 'Invalid credentials.';
        }

        function logout(){
            localStorageService.delete('jwtoken');
            localStorageService.delete('currentUser');
            localStorageService.delete('trips');
            localStorageService.delete('users');
            localStorageService.delete('tokenClaims');
        }

        return {
            loginUser: function(data, retSuccess, retFail){
                //console.log("loginUser called")
                //console.log(data)
                Auth.login(data).then(
                    function(res){

                        successAuth(res, retSuccess);
                    } ,
                    function(err){
                        //console.log("logingUser.err")
                        retFail(err);
                    });
            },
            refreshLogin: function(retSuccess, retFail, data){
                if (!data){
                    data = localStorageService.getObject('relogin_cred');
                }
                if (!data){
                    console.log('No credentials were provided for relogin');
                    retFail();
                    return;
                }
                Auth.login(data).then(
                    function(res){
                        successAuth(res, retSuccess);
                    } ,
                    function(err){
                        //console.log("logingUser.err")
                        retFail(err);
                    });
            },
            logout: logout

        };

}])
.service('Auth', ['$http', 'localStorageService', 'API_urls', "$window", "soapEnvironmentService",
    function ($http, localStorageService, API_urls, $window, soapEnvironmentService){

        function urlBase64Decode(str) {
           var output = str.replace('-', '+').replace('_', '/');
           switch (output.length % 4) {
               case 0:
                   break;
               case 2:
                   output += '==';
                   break;
               case 3:
                   output += '=';
                   break;
               default:
                   throw 'Illegal base64url string!';
           }
           return $window.atob(output);
       }

       function getClaimsFromToken() {
           var token = localStorageService.get('jwtoken');
           //console.log("getclaims", token);
           var user = {"no":"no"};
           if (typeof token !== 'undefined') {
               var encoded = token.split('.')[1];
               user = JSON.parse(urlBase64Decode(encoded));
           }
           return user;
       }


       return {
           signup: function (data, success, error) {
               $http.post(API_urls.BASE() + '/signup', data).success(success).error(error);
           },
           login: function (data) {
               if (API_urls.ADFS){
                   console.log("in Auth.login");
                   console.log(data);
                   var req = {
                         method: 'POST',
                         //url: "https://unangtst.appspot.com/coords/",
                         url: soapEnvironmentService.adfsEndpoint,
                         headers: soapEnvironmentService.headers,
                         data: soapEnvironmentService.body(data.username, data.password)
                        };
                   console.log(req);
                   return $http(req);
               } else {
                   return $http.post(API_urls.BASE() + '/login/token-auth/', data);
               }



           },
           logout: function (success) {
               localStorageService.delete('currentUser');
               localStorageService.delete('jwttoken');
               localStorageService.delete('trips');
               localStorageService.delete('users');
               localStorageService.delete('tokenClaims');
               success();
           },
           getTokenClaims: getClaimsFromToken,
           urlBase64Decode : urlBase64Decode
       };
}])
.factory('Data', ['$timeout', 'API_urls', 'localStorageService', 'myHttp',
        function ($timeout, API_urls, localStorageService, myHttp) {

        var refresh_trips = function(){
            get_trips_remote(function(){}, function(){});
        };

        var check_timestamp = function(resource){
            var myt = localStorageService.get(resource);
            if (!myt) {
                return false;
            }
            myt = new Date(Number(myt));
            var now = new Date();

            return (now < myt);
        };

        var get_trips_remote = function get_from_server(success, error){
                   return myHttp.get(API_urls.BASE() + '/api/trips/').then(
                       function(succ){
                           localStorageService.setObject('trips',succ.data);
                           success(succ.data);
                       },
                       function(err){
                           error(err);
                       });
        };
        var get_users_remote = function get_from_server(success, error){
                   return myHttp.get(API_urls.BASE() + '/users/api/').then(
                       function(succ){
                           localStorageService.setObject('users', succ.data);

                           var expires = new Date();
                           expires.setMinutes(expires.getMinutes()+5);
                           localStorageService.set('users_timestamp', expires.getTime()+'');
                           success(succ.data);
                       },
                       function(err){
                           error(err);
                       });
        };

        var patchTrip = function patchTrip(tripId, data, success, fail){
            return myHttp.patch(API_urls.BASE() + '/trips/api/' + tripId +"/", data).then(
                function(succ){
                    success(succ);
                },
                function(err){
                    fail(err);
                });
        };

       return {
           get_profile: function (success, error) {
               myHttp.get(API_urls.BASE() + '/users/api/profile/').then(
                   function(succ){
                       var myUser = succ.data;
                       myUser.user_id = myUser.id;
                       console.log('myUser', JSON.stringify(myUser));
                       localStorageService.setObject('currentUser', myUser);
                       success(succ);
                   },
                   error);
           },
           get_trips: function (success, error, refresh) {

               if ((refresh === true) || (!Object.keys(localStorageService.getObject('trips')).length)){
                   get_trips_remote(success, error);
               } else {
                   return success(localStorageService.getObject('trips'));
               }
           },
           get_user_base: function(success, error, refresh) {


               if ((refresh === true) ||
                   (!Object.keys(localStorageService.getObject('users')).length) ||
                   (!check_timestamp('users_timestamp'))){

                   console.log("getting the users from outside");
                   get_users_remote(success, error);

               } else {
                   return success(localStorageService.getObject('users'));
               }
           },
           refresh_trips: refresh_trips,
           patch_trip: patchTrip,
       };
   }
])


.factory('TripsFactory', ['Data', 'localStorageService', 'myHttp', 'API_urls', function(Data, localStorageService, myHttp, API_urls) {

    function formatAP(ap, for_upload){

            if (for_upload === true){
                ap.due_date = ap.due_year+"-"+
                        ap.due_month+"-"+
                        ap.due_day;
                delete ap.due_day;
                delete ap.due_year;
                delete ap.due_month;
                delete ap.person_responsible_name;
                return ap;


            } else {
                ap.person_responsible += "";
                var date_array = ap.due_date.split("-");
                ap.due_year = date_array[0];
                ap.due_day = date_array[2];
                ap.due_month = date_array[1];
                return ap;
            }


    }
    function getAP(trip, ap_id){
        for(var i=0;i<trip.actionpoint_set.length;i++){
            if (trip.actionpoint_set[i].id == ap_id){
                return formatAP(trip.actionpoint_set[i]);
            }
        }
        return null;
    }
    function sendAP(tripId, ap, success, fail){
        data = {"actionpoint_set":[formatAP(ap, true)]};
        Data.patch_trip(tripId, data, success, fail);

    }
    function tripAction(id, action, data){
        var url = API_urls.BASE() + '/trips/api/' + id + '/';
        var result = myHttp.post(url + action + '/', data);
        return result;

    }
    function localTripUpdate(id, trip){
      var currentTrips = localStorageService.getObject('trips');
      for (var i=0; i<currentTrips.length; i++){
				if (currentTrips[i].id == id){
          currentTrips[i] = trip;
          localStorageService.setObject("trips", currentTrips);
					return true;
				}
			}
      return false;
    }
    function localAction(id, action){
        var currentTrips = localStorageService.getObject('trips');
        for(var i=0;i<currentTrips.length;i++){
				if(currentTrips[i].id == id){
                    currentTrips[i].status = action;
                    localStorageService.setObject("trips", currentTrips);
					return true;
				}
			}
            return ;
    }

    function reportText(data, tripId, success, fail){
        // if we need any extra data proccessing here would be the place
        Data.patch_trip(tripId, data, success, fail);

    }
    function getDraft(tripId, dtype){
        // if there isn't a currentUser in here we're in big trouble anyway
        var country = localStorageService.getObject('currentUser').profile.country;
        var my_obj = localStorageService.getObject('draft-' + country);

        if (Object.keys(my_obj).length) {
          // check for trip
          if (my_obj[tripId]) {
            var validDataTypes = ['text', 'notes', 'main_observations', 'constraints', 'lessons_learned', 'opportunities'];

            for(validDataType of validDataTypes) {
              if (( validDataType === dtype) && (my_obj[tripId][dtype])) {
                return my_obj[tripId][dtype];
              }
            }
          }
        }

        return {};
    }

    function setDraft(tripId, dtype, draft){
        console.log("tripid, type, draft", tripId, dtype, draft);
        // if there isn't a currentUser in here we're in big trouble anyway
        var country = localStorageService.getObject('currentUser').profile.country;
        var my_obj = localStorageService.getObject('draft-' + country);

        // if there is an object stored
        if (Object.keys(my_obj).length){
            // if this object has the tripId
            if (my_obj[tripId]){
                my_obj[tripId][dtype] = draft;
            } else {
                my_obj[tripId]={};
                my_obj[tripId][dtype] = draft;
            }
        } else {
            my_obj = {};
            my_obj[tripId]={};
            my_obj[tripId][dtype] = draft;
        }
        localStorageService.setObject('draft-'+country, my_obj);
    }

    function deleteDraft(tripId, dataType){
      var country = localStorageService.getObject('currentUser').profile.country;
      var obj = localStorageService.getObject('draft-' + country);
      
      if (dataType in obj[tripId]) {
        delete obj[tripId][dataType];
        localStorageService.setObject('draft-' + country, obj);
      }
    }

	return {
        localApprove: function(id){
            return localAction(id, 'approved');
        },
        localSubmit: function(id){
            return localAction(id, 'submitted');
        },
		getTrip: function(id){
            console.log("getting trip from", localStorageService.getObject('trips'));
			for(var i=0;i<localStorageService.getObject('trips').length;i++){
				if(localStorageService.getObject('trips')[i].id == id){
					return localStorageService.getObject('trips')[i];
				}
			}
			return null;
		},
        reportText: reportText,
        tripAction: tripAction,
        localTripUpdate: localTripUpdate,
        getAP:getAP,
        sendAP:sendAP,
        getDraft:getDraft,
        setDraft:setDraft,
        deleteDraft:deleteDraft
	};
}])
.factory('appInterceptor', ['$q', '$location', 'localStorageService', function($q, $location, localStorageService) {
    return {
        'request': function (config) {
            config.headers = config.headers || {};
            
            if (localStorageService.get('jwtoken')) {
                config.headers.Authorization = 'JWT  ' + localStorageService.get('jwtoken');
            }

            return config;
        },
        'responseError': function (response) {
            if (response.status === 401 || response.status === 403) {
                $location.path('/login');
            }

            return $q.reject(response);
        }
    }
}]);