// app UnicefEquitrackMobile
//  author @robertavram
angular.module('equitrack', ['ionic', 'equitrack.controllers', 'equitrack.services', 'equitrack.utils', 'equitrack.tripControllers'])

.run(function($ionicPlatform, $rootScope, $state, $http, API_urls, $localStorage) {

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        var requireLogin = toState.data.requireLogin;

        if (requireLogin && !Object.keys($localStorage.getObject('currentUser')).length) {
          event.preventDefault();
          $state.go('login');
          // get me to the login page!
        }
        if (toState.data.redirect){
            event.preventDefault();
            $state.go(toState.data.redirect);
        }
    });
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        //if (window.cordova && window.cordova.plugins.Keyboard) {
        //  cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        //  cordova.plugins.Keyboard.disableScroll(true);
        //
        //};
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          StatusBar.styleDefault();
        };
    });
})

.config(["$stateProvider", "$urlRouterProvider", "$httpProvider",
        function($stateProvider, $urlRouterProvider, $httpProvider) {

  $httpProvider.interceptors.push(['$q', '$location', '$localStorage', function ($q, $location, $localStorage) {
       return {
           'request': function (config) {
               config.headers = config.headers || {};
               if ($localStorage.get('jwtoken')) {
                   config.headers.Authorization = 'JWT  ' + $localStorage.get('jwtoken');
               }
               return config;
           },
           'responseError': function (response) {
               if (response.status === 401 || response.status === 403) {
                   $location.path('/login');
               }
               return $q.reject(response);

               //var deferred = $q.defer();
               //if (response.status === 401 || response.status === 403) {
               //    //$location.path('/login');
               //    var $injector = angular.injector();
               //    var tokenExpired = false;
               //    var token_claims = $localStorage.getObject('tokenClaims')
               //    if (token_claims){
               //        var exp_point = new Date(token_claims.exp)
               //        var now = new Date()
               //        console.log('here1')
               //        console.log(exp_point, now, exp_point<now)
               //        if (now > exp_point){
               //            var loginService = $injector.get('LoginService')
               //            console.log('here11')
               //            loginService.refreshLogin(function(){
               //                console.log('got here')
               //                _retryHttpRequest(response.config, deferred);
               //            }, function(){
               //                loginService.logout()
               //                $location.path('/login');
               //                deferred.reject(response);
               //            })
               //        } else {
               //            $location.path('/login');
               //            deferred.reject(response);
               //        }
               //    }
               //} else {
               //    $location.path('/login');
               //    deferred.reject(response);
               //}
               //return deferred.promise;

           }
       };
  }]);

  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl',
    data: {
        requireLogin: true // this property, if set on app will apply to all of its children
    }
  })

  .state('app.reporting', {
      url: '/reporting/:tripId',
      abstract: true,
      views: {
          'menuContent': {
              templateUrl: 'templates/trip/reporting.html',
              controller: 'ReportingCtrl'
          }
      }
  })
  .state('app.reporting.drafts',{
      url: '/drafts',
      views: {
          'tab-drafts': {
              templateUrl: 'templates/trip/reporting-drafts.html',
              controller: 'ReportingDraftsCtrl'
          }
      }
  })
  .state('app.reporting.text',{
      url: '/text',
      cache: false,
      views: {
          'tab-text': {
              templateUrl: 'templates/trip/reporting-text.html',
              controller: 'ReportingTextCtrl'
          }
      }
  })
  .state('app.reporting.picture',{
      url: '/picture',
      views: {
          'tab-pic': {
              templateUrl: 'templates/trip/reporting-picture.html',
              controller: 'ReportingPictureCtrl'
          }
      }
  })
  .state('app.reporting.aps',{
      cache: false,
      url: '/aps',
      views: {
          'tab-aps': {
              templateUrl: 'templates/trip/reporting-aps.html',
              controller: 'ReportingAPSCtrl'
          }
      }
  })
  .state('app.reporting.ap_detail', {
      cache: false,
      url: '/aps/:apId',
      views: {
        'tab-aps': {
          templateUrl: 'templates/trip/reporting-ap_edit.html',
          controller: 'TripApsEditCtrl'
        }
      }

  })
  .state('app.dash', {
      url: '/dash',
      abstract: true,
      views: {
        'menuContent': {
            templateUrl: 'templates/dash.html',
            controller: 'DashCtrl'
        }
      }
  })
  .state('app.dash.my_trip-detail', {
      url: '/my_trips/:tripId',
      cache: false,
      views: {
        'tab-trips': {
          templateUrl: 'templates/dash/trip.html',
          controller: 'TripDetailCtrl'
        }
      }

  })
  .state('app.dash.my_trips', {
      url: '/my_trips',
      views: {
        'tab-trips': {
          templateUrl: 'templates/dash/my-trips.html',
          controller: 'MyTripsCtrl'
        }
      }
  })
  .state('app.dash.supervised', {
      url: '/supervised',
      views: {
        'tab-supervised': {
          templateUrl: 'templates/dash/supervised.html',
          controller: 'SupervisedCtrl'
        }
      }
  })
  .state('app.dash.supervised-detail', {
      url: '/supervised/:tripId',
      views: {
        'tab-supervised': {
          templateUrl: 'templates/dash/trip.html',
          controller: 'TripDetailCtrl'
        }
      }
  })
  .state('login', {
      url: '/login',
      cache: false,
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl',
      data: {
        requireLogin: false
      }
  })
  .state('home', {
      url: '',
      data: {
        requireLogin: false,
        redirect: "app.dash.my_trips",
      }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('login');


}])
//.constant('API_urls', {'BASE':'https://etools-staging.uniceflebanon.org'})
//.constant('API_urls', {'BASE':'https://etools-staging.unicef.org',
//                        'ADFS':true})
.constant('API_urls', {'BASE':'https://22191e85.ngrok.com',
                        'ADFS':false})
//.constant('API_urls', {'BASE':'http://192.168.99.100:8080'})
//.constant('API_urls', {'BASE':'http://192.168.86.10:8080'})
.constant('TripVars', {'checkboxes':['ta_drafted', 'security_granted'],
                       'cards': ['travel_routes', 'files', 'action_points',
                                 'trip_funds']
                      }
)

.filter('underscoreless', function () {
  return function (input) {
      return input.replace(/_/g, ' ');
  };
})
.filter('TitleCase', function(){
    return function(input){
        return input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }
})