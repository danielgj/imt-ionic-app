// Ionic Starter App

var url_base_api = "url_to_api_here";

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('smtApp', ['ionic', 'ngCordova', 'smtApp.controllers', 'smtApp.services'])



.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  
$ionicConfigProvider.navBar.alignTitle('center');    
$ionicConfigProvider.views.maxCache(0);
$stateProvider
  
  

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.home', {
    url: '/home',
    views: {
      'menuContent': {
        templateUrl: 'templates/home.html'
      }
    }
  })

  .state('app.inventory', {
      url: '/inventory',
      views: {
        'menuContent': {
          templateUrl: 'templates/inventory.html',
          controller: 'InventoryCtrl'
        }
      }
  })
  
  .state('app.item', {
    url: '/inventory/:itemId',
    views: {
      'menuContent': {
        templateUrl: 'templates/item.html',
        controller: 'InventoryDetailCtrl'
      }
    }
  })
  .state('app.loans', {
      url: '/loans',
      views: {
        'menuContent': {
          templateUrl: 'templates/loans.html',
          controller: 'LoansCtrl'
        }
      }
  })
  .state('app.loan', {
      url: '/loans/:loanId',
      views: {
        'menuContent': {
          templateUrl: 'templates/loan.html',
          controller: 'LoanDetailCtrl'
        }
      }
  })
  .state('app.requests', {
      url: '/requests',
      views: {
        'menuContent': {
          templateUrl: 'templates/requests.html',
          controller: 'RequestsCtrl'
        }
      }
  })
  .state('app.request', {
      url: '/requests/:requestId',
      views: {
        'menuContent': {
          templateUrl: 'templates/request.html',
          controller: 'RequestsDetailCtrl'
        }
      }
  })
  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
