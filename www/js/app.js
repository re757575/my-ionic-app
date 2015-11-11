// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'ngCordova'])

.run(function($rootScope, $ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
  });

  document.addEventListener('deviceready', function () {

    // 背景模式預設值
    cordova.plugins.backgroundMode.setDefaults({
      silent: true
    });

    // Enable background mode
    cordova.plugins.backgroundMode.enable();

    $rootScope.interval = null;

    // 回復前景
    cordova.plugins.backgroundMode.ondeactivate = function(){
       // after several times of interval log, this get called
       console.log('backgroundMode.ondeactivate');
       // stop geolocation watch
       navigator.geolocation.clearWatch($rootScope.watchId);
    };

    cordova.plugins.backgroundMode.onfailure = function(errorCode) {
      alert('Error: '. errorCode);
    };

  }, false);

})

.run(function($rootScope, $ionicPlatform, $ionicHistory, $location) {
  $ionicPlatform.registerBackButtonAction(function(e) {

    e.preventDefault();

    if ($rootScope.backButtonPressedOnceToExit && $location.path() == '/app/location') {
      // 離開App
      ionic.Platform.exitApp();
    } else if ($ionicHistory.backView()) {
      // 返回上一頁
      $ionicHistory.goBack();
      console.log('History Back');
    } else {
      // 提示再按一次退出,提示2秒
      $rootScope.backButtonPressedOnceToExit = true;
      // toast
      window.plugins.toast.showWithOptions({
        message: "再按一次退出",
        duration: "short",
        position: "bottom",
        addPixelsY: -200  // added a negative value to move it up a bit (default 0)
      },
        function(a) {
        console.log('toast success: ' + a);
      },
        function(b) {
        console.log('toast error: ' + b);
      });

      setTimeout(function() {
        $rootScope.backButtonPressedOnceToExit = false;
      }, 2000);
    }

  }, 101);
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.location', {
    url: '/location',
    views: {
      'menuContent': {
        templateUrl: 'templates/location.html',
        controller: 'LocationCtrl'
      }
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/location');
});
