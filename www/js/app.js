// app UnicefEquitrackMobile
//  author @robertavram
angular.module('equitrack', ['ionic', 'equitrack.controllers', 'equitrack.services', 'equitrack.utils'])

.run(function($ionicPlatform, $rootScope, $state, $http, API_urls, $localStorage) {

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        var requireLogin = toState.data.requireLogin;
        console.log(event)

        console.log('loginstatechange', requireLogin, $localStorage.currentUser);

        if (requireLogin && typeof $localStorage.currentUser === 'undefined') {
            console.log("why?")
          event.preventDefault();
          $state.go('login');
          // get me to the login page!
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
               if ($localStorage.jwtoken) {
                   config.headers.Authorization = 'JWT  ' + $localStorage.jwtoken;
               }
               return config;
           },
           'responseError': function (response) {
               if (response.status === 401 || response.status === 403) {
                   $location.path('/login');
               }
               return $q.reject(response);
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

  .state('app.search', {
    url: '/search',
    views: {
        'menuContent': {
            templateUrl: 'templates/search.html'
        }
    }
  })

  .state('app.trips', {
      url: '/trips',
      views: {
        'menuContent': {
          templateUrl: 'templates/trips.html',
          controller: 'TripsCtrl'
        }
      }
  })
  .state('app.playlists', {
      url: '/playlists',
      views: {
        'menuContent': {
          templateUrl: 'templates/playlists.html',
          controller: 'PlaylistsCtrl'
        }
      }
  })

  .state('app.single', {
      url: '/playlists/:playlistId',
      views: {
        'menuContent': {
        templateUrl: 'templates/playlist.html',
        controller: 'PlaylistCtrl'
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
  .state('app.dash.three', {
      url: '/three',
      views: {
        'tab-three': {
          templateUrl: 'templates/dash/three.html'
        }
      }
  })
  .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl',
      data: {
        requireLogin: false
      }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('login');


}])
.constant('API_urls', {'BASE':'http://192.168.99.100:8080'});
