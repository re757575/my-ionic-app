angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
})

.controller('LocationCtrl', function($scope, $rootScope, $ionicModal, $stateParams, $cordovaGeolocation, $ionicLoading, $http, $compile, $ionicPlatform, $q, $filter) {

  document.addEventListener("deviceready", onDeviceReady, false);

  $ionicModal.fromTemplateUrl('map-modal', {
    scope: $scope,
    animation: 'fade-in'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.centerOnMe = function() {
    // if (!$scope.map) {
    //   return;
    // }

    $scope.isAbortGeo = false;

    $ionicLoading.show({
      content: 'Loading',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0,
      template: '取得目前位置...'
    });

    var priority = 600;
    var callback = function() {
      $scope.isAbortGeo = true;
      $ionicLoading.hide();
      // 註銷註冊的事件
      deregister();
    };
    var deregister = $ionicPlatform.registerBackButtonAction(callback, priority);

    $scope.$on('$destroy', deregister);

    var watchID = navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 15000 });
  };

  $scope.toggleStreetView = function () {
    if (!$scope.panorama) {
      return;
    }
    var toggle = $scope.panorama.getVisible();
    if (toggle == false) {
      $scope.panorama.setVisible(true);
    } else {
      $scope.panorama.setVisible(false);
    }
  };

  $scope.fullscreenView = function () {
    if (!$scope.mapOptions) {
      return false;
    } else {

      if (window.StatusBar) {
        // cordova-plugin-statusbar required
        StatusBar.hide();
      }

      $scope.modal.show();

      var map = new google.maps.Map(document.getElementById("map-fullscreen"), $scope.mapOptions);

      var marker = new google.maps.Marker({
        position: $scope.mapOptions.center,
        map: map,
        title: '目前大約所在地'
      });

      var fullScreenPanorama = map.getStreetView();
      fullScreenPanorama.setPosition($scope.mapOptions.center);
      fullScreenPanorama.setPov(({
        heading: 265,
        pitch: 0
      }));

      $scope.fullScreenPanorama = fullScreenPanorama;
    }
  };

  $scope.toggleFullScreenStreetView = function () {
    if (!$scope.fullScreenPanorama) {
      return;
    }
    var toggle = $scope.fullScreenPanorama.getVisible();
    if (toggle == false) {
      $scope.fullScreenPanorama.setVisible(true);
    } else {
      $scope.fullScreenPanorama.setVisible(false);
    }
  };

  $scope.closeFullscreenView = function() {
    if (window.StatusBar) {
      StatusBar.show();
    }
    $scope.modal.hide();
  };

  function onDeviceReady() {

    $ionicLoading.show({
      content: 'Loading',
      animation: 'fade-in',
      showBackdrop: true,
      maxWidth: 200,
      showDelay: 0,
      template: '取得目前位置...'
    });

    var priority = 600;
    var callback = function() {
      $scope.isAbortGeo = true;
      $ionicLoading.hide();
      deregister();
    };
    var deregister = $ionicPlatform.registerBackButtonAction(callback, priority);

    $scope.$on('$destroy', deregister);

    var watchID = navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout: 15000 });

    cordova.plugins.backgroundMode.onactivate = function () {

        var _address = '';
        console.log('backgroundMode.onactivate');

        $rootScope.watchId = navigator.geolocation.watchPosition(function(position) {

          console.log('backgroundMode.onactivate watchPosition');

          var lat = position.coords.latitude,
              long = position.coords.longitude;

          // Modify the currently displayed notification
          cordova.plugins.backgroundMode.configure({
            title: 'backgroundMode start',
            text: lat +','+ long,
            resume: true,
            silent: false
          });

          var dataObj = {
              date: $filter('date')(new Date(), "yyyy-MM-dd HH:mm:ss"),
              latitude: lat,
              longitude: long,
              address: 'null'
          };

          reverseGeocoding(lat, long).then(
            function(data) {
              // 地址改變才上傳資料
              if (_address !== data.address) {
                _address = data.address;
                dataObj.address = data.address;
                update(dataObj);
              }
            },
            function(error) {
              console.error(error);
            }
          );

        },
        onError, { timeout: 15000 });
    };

  }

  function onSuccess(position) {

      console.info(position);

      var lat  = position.coords.latitude,
          long = position.coords.longitude,
          myLatlng = new google.maps.LatLng(lat, long);

      var mapOptions = {
          center: myLatlng,
          zoom: 17,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          enableHighAccuracy: true,
          maximumAge: 0
      };

      var map = new google.maps.Map(document.getElementById("map"), mapOptions);

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: '目前大約所在地'
      });

      var panorama = map.getStreetView();
      panorama.setPosition(myLatlng);
      panorama.setPov(({
        heading: 265,
        pitch: 0
      }));

      $scope.lat = lat;
      $scope.long = long;
      $scope.panorama = panorama;
      $scope.map = map;
      $scope.mapOptions = mapOptions;

      var result = reverseGeocoding(lat, long);

      result.then(
        function(data) {
          console.warn(data);
          var element = document.getElementById('geolocation');
          element.innerHTML = '緯度: '      + lat     + ' ' +
                              '經度: '      + long     + '<br />' +
                              '大約位置: '  + data.address + '<br />'; +
                              '<hr />';

          var contentString = "<div><a ng-click='clickTest()'>"+ data.address +"</a></div>";
          var compiled = $compile(contentString)($scope);

          var infowindow = new google.maps.InfoWindow({
            content: compiled[0]
          });

          google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker);
          });

          $ionicLoading.hide();
        },
        function(error) {
          alert(data);
          console.info(data);
          $ionicLoading.hide();
        }
      );
  }

  function onError(error) {
    if ($scope.isAbortGeo && $scope.isAbortGeo === true) {
      return false;
    }

    $ionicLoading.hide();

    var msg = '';
    switch(error.code) {
      case error.PERMISSION_DENIED:
          msg = "你拒絕使用地理位置的要求"
          break;
      case error.POSITION_UNAVAILABLE:
          msg = "找不到位置信息"
          break;
      case error.TIMEOUT:
          msg = "連線逾時"
          break;
      case error.UNKNOWN_ERROR:
          msg = "未知的錯誤"
          break;
    }
    alert(msg);
  }

  // Reverse Geocoding via Geocoding API (Web service)
  function reverseGeocoding(lat, lng) {

    var def = $q.defer();

    var address = '';

    var params = {
      language: 'zh-TW',
      latlng: lat +','+ lng,
      KEY: 'AIzaSyAcQq1Fbpv-gU9azfjyLlAtvWl8YFpRbe0',
    };

    var API_URL = 'https://maps.googleapis.com/maps/api/geocode/json?';

    $http.get(API_URL, {
      params: params,
      cache: false,
      timeout: 30000,
      responseType: "json",
      timeout: def.promise
      // transformRequest: function(data) {},
      // transformResponse: function(data) {}
    })
    .success(function (data, status) {
      def.resolve({
        'status': 1,
        'address': data.results[0].formatted_address
      });
    })
    .error(function (data, status) {
      def.reject({
        'status': 0,
        'msg': data
      });
    });

    return def.promise;
  }

  // 上傳資料到GAS
  function update(obj) {

   var param = {
      'date': obj.date,
      'latitude': obj.latitude,
      'longitude': obj.longitude,
      'address': obj.address,
      'callback': 'JSON_CALLBACK'
    };

    var service_url = 'https://script.google.com/macros/s/{APP_SCRIPT_KRY}/exec?';

    var paramStr = Object.keys(param).map(function(key) {
        return key + '=' + param[key];
    }).join('&');

    var url = encodeURI(service_url + paramStr);

    $http.jsonp(url, {})
    .success(function (data, status) {
      console.info(data);
    })
    .error(function(data, status) {
      console.info(data);
    });
  }

});
