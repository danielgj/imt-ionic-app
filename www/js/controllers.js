angular.module('smtApp.controllers', [])

.controller('AppCtrl', function($scope, $rootScope, $http, $ionicModal, $ionicHistory, $ionicPopup, $state, Utils, $ionicLoading) {
    
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
    $scope.openLogin = function() {
        $scope.modal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function() {
        
        if(!(Utils.isUndefinedOrNull($scope.loginData.username) || Utils.isUndefinedOrNull($scope.loginData.password))) {
               
               $ionicLoading.show({
                template: '<ion-spinner></ion-spinner> Loading...'
               });

            
                $http({
                    method: 'POST',
                    url: url_base_api + 'users/login/',
                    headers: {
                       "Accept": "application/json;charset=utf-8"
                   },
                   dataType:"json",
                   data: {'username':$scope.loginData.username, 'password':$scope.loginData.password}
                }).then(function(obj) {
                    if(obj.status==200 && obj.data.success) {
                        $rootScope.user = obj.data.id_user;
                        $rootScope.username = obj.data.name;
                        $rootScope.token = obj.data.token;
                        $rootScope.role = obj.data.role;
                        $rootScope.email = obj.data.email;


                        //////////////////LocalStorage
                        localStorage.setItem("user", $rootScope.user);
                        localStorage.setItem("username", $rootScope.username);
                        localStorage.setItem("role", $rootScope.role);
                        localStorage.setItem("token", $rootScope.token);
                        localStorage.setItem("email", $rootScope.email);

                        $rootScope.withError = false;
                        $rootScope.errorMsg = "";

                        $ionicLoading.hide();
                        $scope.closeLogin();

                        $ionicHistory.nextViewOptions({
                            disableBack: true
                        });
                        $state.go("app.inventory");

                    } else {
                        
                    }
                }).catch(function(err) {
                    $ionicLoading.hide();
                    $rootScope.withError = true;
                    $rootScope.errorMsg = err.data.err.message;                    
                });
            } else {
                $rootScope.withError = true;
                $rootScope.errorMsg = "Please, enter required files";
            }
        };
    
    
    $scope.logout = function() {
        
        var confirmPopup = $ionicPopup.confirm({
         title: 'Close Session',
         template: 'Are you sure you want to logout?'
       });

       confirmPopup.then(function(res) {
         if(res) {
            $rootScope.user = undefined;
            $rootScope.username = undefined;
            $rootScope.token = undefined;
            $rootScope.role = undefined;
            $rootScope.email = undefined;
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go("app.home");
         } 
       });        
    }

})
            
.controller('InventoryCtrl', function($scope, $http, $rootScope, $state, dataService, Utils, $http, $ionicPopup, $ionicListDelegate, $ionicLoading, $ionicTabsDelegate) {

      
      //Fill Master Data
      if(!Utils.isUndefinedOrNull($rootScope.user)) {
          
          $ionicLoading.show({
                template: '<ion-spinner></ion-spinner> Loading...'
          });
          
          dataService.async('categories/').then(function(d) { 
          
              if(d.status) {
                  $rootScope.categories = d.data;
                  
                  dataService.async('brands/').then(function(d) { 
          
                      if(d.status) {

                          $rootScope.brands = d.data;
                          
                          dataService.async('loans/open').then(function(d) { 

                              if(d.status) {
                                  $rootScope.open_loans = d.data;
                                  
                                  dataService.async('items/').then(function(d) { 

                                      if(d.status) {

                                          var inventarioNotParsed = d.data;
                                          var inventarioParsed = [];

                                          for (i=0; i< inventarioNotParsed.length ; i++) {
                                            var currentInventarioItem = inventarioNotParsed[i];
                                            currentInventarioItem.available = true;
                                            currentInventarioItem.loan = {};
                                            for(j=0; j< $rootScope.open_loans.length ; j++) {
                                              var currentItemPrestamos = $rootScope.open_loans[j];
                                              if(currentItemPrestamos.item._id == currentInventarioItem._id) {
                                                  currentInventarioItem.available = false;
                                                  currentInventarioItem.loan = currentItemPrestamos;
                                                  currentInventarioItem.loanedTo = currentItemPrestamos.user.firstname + ' ' + currentItemPrestamos.user.lastname;                      
                                              }
                                            }
                                            inventarioParsed.push(currentInventarioItem);
                                          }

                                          $rootScope.inventory = inventarioParsed;
                                          $ionicLoading.hide();

                                      } else {
                                          
                                          console.log("Error loading items");
                                          $ionicLoading.hide();
                                      }

                                  });
                              } else {
                                  
                                  console.log("Error loading open loans");
                                  $ionicLoading.hide();
                              }

                          });

                      } else {
                          
                          console.log("Error loading brands");
                          $ionicLoading.hide();
                      }

                  });
                  
              } else {
                  
                  console.log("Error loading categories");
                  $ionicLoading.hide();
              }
              
          });
                    
          
      } 
      else {
          //Navigate to Home
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go("app.home");
      }
      
      $scope.selectedFilter = 0;
      $scope.requestLoan = function(item) {
          $rootScope.currentLoanRequestItem = item;      
          $scope.data = {};
        
        var myPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="data.notes">',
            title: 'Request loan',
            subTitle: 'Please enter your comments for loaning ' + item.name,
            scope: $scope,
            buttons: [
              { 
                text: 'Cancel',
                onTap: function(e) {
                    $ionicListDelegate.closeOptionButtons();                            
                }
              },
              {
                text: '<b>Request</b>',
                type: 'button-positive',
                onTap: function(e) {
                    
                    var itemToCreate = {
                        "user" : $rootScope.user,
                        "item" : item._id,
                        "comments" : $scope.data.notes,
                        "requestDate": Date.now(),
                        "state": "Requested"
                    }
                    
                    $http({
                        method: 'POST',
                          url: url_base_api + 'loans/',
                          headers: {
                             "Accept": "application/json;charset=utf-8",
                             "Authorization" : "Bearer " + $rootScope.token
                         },
                         dataType:"json",
                         data: itemToCreate
                    }).then(function(obj) {
                        if(obj.status==200) {
                            
                            $ionicListDelegate.closeOptionButtons();
                            dataService.async('loans/open').then(function(d) { 

                              if(d.status) {
                                  $rootScope.open_loans = d.data;
                                  
                                  dataService.async('items/').then(function(d) { 

                                      if(d.status) {

                                          var inventarioNotParsed = d.data;
                                          var inventarioParsed = [];

                                          for (i=0; i< inventarioNotParsed.length ; i++) {
                                            var currentInventarioItem = inventarioNotParsed[i];
                                            currentInventarioItem.available = true;
                                            currentInventarioItem.loan = {};
                                            for(j=0; j< $rootScope.open_loans.length ; j++) {
                                              var currentItemPrestamos = $rootScope.open_loans[j];
                                              if(currentItemPrestamos.item._id == currentInventarioItem._id) {
                                                  currentInventarioItem.available = false;
                                                  currentInventarioItem.loan = currentItemPrestamos;
                                                  currentInventarioItem.loanedTo = currentItemPrestamos.user.firstname + ' ' + currentItemPrestamos.user.lastname;                      
                                              }
                                            }
                                            inventarioParsed.push(currentInventarioItem);
                                          }

                                          $rootScope.inventory = inventarioParsed;
                                          
                                          $scope.loading = false;

                                      } else {
                                          
                                          console.log("Error loading items");
                          
                                          $scope.loading = false;
                                      }

                                  });
                              } else {
                                  
                                  console.log("Error loading open loans");
                          
                                  $scope.loading = false;

                              }

                          });

                            return $scope.data.notes;                            
                        } else {
                            $rootScope.withError = true;
                            $rootScope.errorMsg = "An error has occured";  
                        }
                    }).catch(function(err) {
                        $rootScope.withError = true;
                        $rootScope.errorMsg = "An error has occured";              
                    });
                    
                }
              }
            ]
          });
      }
      
      $scope.showAll = function() {
        $ionicTabsDelegate.select(0);
        $scope.selectedFilter = 0;
      }
      
      $scope.showAvailable = function() {
        $ionicTabsDelegate.select(1);
        $scope.selectedFilter = 1;
      }
      
      $scope.showLoaned = function() {
        $ionicTabsDelegate.select(2);
        $scope.selectedFilter = -1;
      }
      
      $scope.filterInv = function(item) {
       
          if($scope.selectedFilter==0) {
              return true;
          } else if($scope.selectedFilter==1) {
              return item.available;
          } else {
              return !item.available;
          }
      }
      
})
            
.controller('InventoryDetailCtrl', function($scope, $rootScope, $stateParams, $state, $location, $http, $ionicPopup, dataService, Utils, $ionicLoading) { 

    if(!Utils.isUndefinedOrNull($rootScope.user)) {
          
          $ionicLoading.show({
                template: '<ion-spinner></ion-spinner> Loading...'
          });
                  
          dataService.async('loans/open').then(function(d) { 

            if(d.status) {
                var open_loans = d.data;
                                  
                dataService.async('items/' + $stateParams.itemId).then(function(d) { 

                    if(d.status) {
                                          
                        var item = d.data;
                        item.available = true;
                                          
                        for(j=0; j< open_loans.length ; j++) {
                            var currentItemPrestamos = open_loans[j];
                            if(currentItemPrestamos.item._id == item._id) {
                                item.available = false;
                                item.loan = currentItemPrestamos;
                                item.loanedTo = currentItemPrestamos.user.firstname + ' ' + currentItemPrestamos.user.lastname;                      
                            }
                        }       
                        $scope.item = item;
                        $ionicLoading.hide();

                    } else {                                          
                        console.log("Error loading items");                          
                        $ionicLoading.hide();
                    }

                });
            } else {                                  
                console.log("Error loading open loans");                          
                $ionicLoading.hide();
            }
        
        });
        
      } 
      else {
          //Navigate to Home
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go("app.home");
      }
      
    $scope.requestLoan = function (item) {
        $rootScope.currentLoanRequestItem = item;      
        $scope.data = {};
        
        var myPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="data.notes">',
            title: 'Request loan',
            subTitle: 'Please enter your comments for loaning ' + item.name,
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Request</b>',
                type: 'button-positive',
                onTap: function(e) {
                    
                    var itemToCreate = {
                        "user" : $rootScope.user,
                        "item" : item._id,
                        "comments" : $scope.data.notes,
                        "requestDate": Date.now(),
                        "state": "Requested"
                    }
                    $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner> Loading...'
                    });
                    
                    $http({
                        method: 'POST',
                          url: url_base_api + 'loans/',
                          headers: {
                             "Accept": "application/json;charset=utf-8",
                             "Authorization" : "Bearer " + $rootScope.token
                         },
                         dataType:"json",
                         data: itemToCreate
                    }).then(function(obj) {
                        if(obj.status==200) {
                            $ionicLoading.hide();
                            $state.go('app.inventory');
                            return $scope.data.notes;                            
                        } else {
                            $ionicLoading.hide();
                            $rootScope.withError = true;
                            $rootScope.errorMsg = "An error has occured";  
                        }
                    }).catch(function(err) {
                        $ionicLoading.hide();
                        $rootScope.withError = true;
                        $rootScope.errorMsg = "An error has occured";              
                    });
                    
                }
              }
            ]
          });
      }
    
    $scope.viewLoan = function(loan) {
    
        $rootScope.currentLoanItem = loan;      
        $scope.data = {};
        
        var myPopup = $ionicPopup.show({
            template: '<b>Loaned to: </b>' + loan.user.firstname + ' ' + loan.user.lastname + "<br/>" + '<b>Loan Date: </b>' + loan.requestDate + "<br/>" + '<b>Loan Status: </b>' + loan.state,
            title: 'Loan Details',
            subTitle: 'Details of loan for ' + loan.item.name,
            scope: $scope,
            buttons: [
              { text: 'Close' }
            ]
          });
  
    }
})
            
.controller('LoansCtrl', function($scope, $http, $rootScope, $state, dataService, Utils, $ionicListDelegate, $ionicPopup, $ionicLoading, $ionicTabsDelegate) {
    
        $scope.selectedFilter = 0;
      
        if(!Utils.isUndefinedOrNull($rootScope.user)) {
          
          $ionicLoading.show({
                template: '<ion-spinner></ion-spinner> Loading...'
          });
          
          dataService.async('loans/user/' + $rootScope.user).then(function(d) { 
          
              if(d.status) {
                  $scope.loans = d.data;
                  $ionicLoading.hide();
              } else {
                  $ionicLoading.hide();
                  $rootScope.errorValue = "Error loading your requests";
                  $location.path("/error");
              }
          });
        } else {
              //Navigate to Home
              $ionicHistory.nextViewOptions({
                disableBack: true
              });
              $state.go("app.home"); 
        }
        
        $scope.returnItem = function(loan) {
        
            $rootScope.currentLoanRequestItem = loan;      
            $scope.data = {};

            var myPopup = $ionicPopup.show({
                template: '',
                title: 'Return Item',
                subTitle: 'Do you want to request the return for item ' + loan.item.name + "?",
                scope: $scope,
                buttons: [
                  { 
                    text: 'Cancel',
                    onTap: function(e) {
                        $ionicListDelegate.closeOptionButtons();                            
                    }
                  },
                  {
                    text: '<b>Request</b>',
                    type: 'button-positive',
                    onTap: function(e) {

                        $ionicLoading.show({
                                template: '<ion-spinner></ion-spinner> Loading...'
                        });
                        
                        var itemParsed = loan;
                        itemParsed.state='ClosePending';

                        $http({
                              method: 'PUT',
                              url: url_base_api + 'loans/' + itemParsed._id,
                              headers: {
                                 "Accept": "application/json;charset=utf-8",
                                 "Authorization" : "Bearer " + $rootScope.token
                             },
                             dataType:"json",
                             data: itemParsed
                          }).then(function(obj) {
                            if(obj.status==200) {
                                $ionicListDelegate.closeOptionButtons();                            
                                dataService.async('loans/user/' + $rootScope.user).then(function(d) { 
                                  if(d.status) {
                                      $scope.loans = d.data;
                                      $ionicLoading.hide();
                                  } else {
                                      $ionicLoading.hide();
                                      $rootScope.errorValue = "Error loading your requests";
                                      $location.path("/error");
                                  }
                              });
                                
                                return true;                            
                            } else {
                                $ionicLoading.hide();
                                $rootScope.withError = true;
                                $rootScope.errorMsg = "An error has occured";  
                            }
                          }).catch(function(err) {
                              $ionicLoading.hide();
                              $rootScope.withError = true;
                              $rootScope.errorMsg = err;

                          });  

                    }
                  }
                ]
              });
    }
        
      $scope.showAll = function() {
        $ionicTabsDelegate.select(0);
        $scope.selectedFilter = 0;
      }
      
      $scope.showPending = function() {
        $ionicTabsDelegate.select(1);
        $scope.selectedFilter = 1;
      }
      
      $scope.showOngoing = function() {
        $ionicTabsDelegate.select(2);
        $scope.selectedFilter = 2;
      }
      
      $scope.showClosed = function() {
        $ionicTabsDelegate.select(3);
        $scope.selectedFilter = 3;
      }
      
      
      $scope.filterLoans = function(item) {
       
          if($scope.selectedFilter==0) {
              return true;
          } else if($scope.selectedFilter==1) {
              return item.state=='Requested' || item.state=='ClosePending';
          } else if($scope.selectedFilter==2) {
              return item.state=='Ongoing';
          } else {
              return item.state=='Closed' || item.state=='Rejected';
          }
      }

})

.controller('LoanDetailCtrl', function($scope, $rootScope, $stateParams, dataService, $ionicPopup, $http, $state, $ionicHistory, Utils, $ionicLoading) { 

    $rootScope.showFilter = false;
    
    if(!Utils.isUndefinedOrNull($rootScope.user)) {
          
                $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner> Loading...'
                });    
                                  
                dataService.async('loans/' + $stateParams.loanId).then(function(d) { 

                    if(d.status) {
                                          
                        $scope.loan = d.data;
                        $ionicLoading.hide();

                    } else {                                          
                        console.log("Error loading items");                          
                        $ionicLoading.hide();
                    }

                });
            

        
      } 
      else {
          //Navigate to Home
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go("app.home");
      }
    
    $scope.returnItem = function(loan) {
        
        $rootScope.currentLoanRequestItem = loan;      
        $scope.data = {};
        
        var myPopup = $ionicPopup.show({
            template: '',
            title: 'Return Item',
            subTitle: 'Do you want to request the return for item ' + loan.item.name + "?",
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Request</b>',
                type: 'button-positive',
                onTap: function(e) {
                    
                    var itemParsed = loan;
                    itemParsed.state='ClosePending';

                    $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner> Loading...'
                    });   
                    
                    $http({
                          method: 'PUT',
                          url: url_base_api + 'loans/' + itemParsed._id,
                          headers: {
                             "Accept": "application/json;charset=utf-8",
                             "Authorization" : "Bearer " + $rootScope.token
                         },
                         dataType:"json",
                         data: itemParsed
                      }).then(function(obj) {
                        if(obj.status==200) {
                            $ionicLoading.hide();
                            $state.go('app.loans');
                            return true;                            
                        } else {
                            $ionicLoading.hide();
                            $rootScope.withError = true;
                            $rootScope.errorMsg = "An error has occured";  
                        }
                      }).catch(function(err) {
                          $ionicLoading.hide();
                          $rootScope.withError = true;
                          $rootScope.errorMsg = err;

                      });  
                    
                }
              }
            ]
          });
    }

})

.controller('RequestsCtrl', function($scope, $http, $rootScope, dataService, Utils, $ionicListDelegate, $ionicPopup, $state, $http, $ionicLoading, $ionicTabsDelegate) {
    
        $scope.selectedFilter = 0;
    
        $ionicLoading.show({
                template: '<ion-spinner></ion-spinner> Loading...'
        });
    
        dataService.async('loans/pending').then(function(d) { 

            $ionicLoading.hide();
            
            if(d.status) {
                $rootScope.pending_loans = d.data;   
            } else {
                console.log("Error loading pending loans");               
            }
        });

        $scope.approveRequest = function(request) {
        
            $rootScope.currentLoanRequestItem = request;      
            $scope.data = {};

            var myPopup = $ionicPopup.show({
                template: '',
                title: 'Approve Request',
                subTitle: 'Do you want to approve ' + request.user.firstname + '\'s request for item ' + request.item.name + "?",
                scope: $scope,
                buttons: [
                  { 
                    text: 'Cancel',
                    onTap: function(e) {
                        $ionicListDelegate.closeOptionButtons();                            
                    }
                  },
                  {
                    text: '<b>Approve</b>',
                    type: 'button-positive',
                    onTap: function(e) {

                        $ionicLoading.show({
                                template: '<ion-spinner></ion-spinner> Loading...'
                        });

                        if(request.state == 'Requested') {            
                            request.state='Ongoing';
                        } else {
                            request.state='Closed';
                        }

                        $http({
                              method: 'PUT',
                              url: url_base_api + 'loans/' + request._id,
                              headers: {
                                 "Accept": "application/json;charset=utf-8",
                                 "Authorization" : "Bearer " + $rootScope.token
                             },
                             dataType:"json",
                             data: request
                          }).then(function(obj) {
                            if(obj.status==200) {
                                $ionicListDelegate.closeOptionButtons();
                                dataService.async('loans/pending').then(function(d) { 
                                    $ionicLoading.hide();
                                    if(d.status) {
                                        $rootScope.pending_loans = d.data;   
                                    } else {
                                        console.log("Error loading pending loans");               
                                    }
                                });
                                return $scope.data.notes;                            
                            } else {
                                $ionicLoading.hide();
                                $rootScope.withError = true;
                                $rootScope.errorMsg = "An error has occured";  
                            }
                          }).catch(function(err) {
                              $ionicLoading.hide();
                              $rootScope.withError = true;
                              $rootScope.errorMsg = err;

                          });  

                    }
                  }
                ]
              });
        }
    
    $scope.rejectRequest = function(request) {
        
        $rootScope.currentLoanRequestItem = request;      
        $scope.data = {};
        
        var myPopup = $ionicPopup.show({
            template: '',
            title: 'Reject Request',
            subTitle: 'Do you want to reject ' + request.user.firstname + '\'s request for item ' + request.item.name + "?",
            scope: $scope,
            buttons: [
              { 
                text: 'Cancel',
                onTap: function(e) {
                    $ionicListDelegate.closeOptionButtons();                            
                }
              },
              {
                text: '<b>Reject</b>',
                type: 'button-positive',
                onTap: function(e) {
                    
                    if(request.state == 'ClosePending') {            
                        request.state='Ongoing';
                    } else {                
                        request.state='Rejected';
                    }
                    
                    $ionicLoading.show({
                                template: '<ion-spinner></ion-spinner> Loading...'
                    });


                    $http({
                          method: 'PUT',
                          url: url_base_api + 'loans/' + request._id,
                          headers: {
                             "Accept": "application/json;charset=utf-8",
                             "Authorization" : "Bearer " + $rootScope.token
                         },
                         dataType:"json",
                         data: request
                      }).then(function(obj) {
                        if(obj.status==200) {
                            $ionicListDelegate.closeOptionButtons();
                            dataService.async('loans/pending').then(function(d) {
                                $ionicLoading.hide();
                                if(d.status) {
                                    $rootScope.pending_loans = d.data;   
                                } else {
                                    console.log("Error loading pending loans");               
                                }
                            });
                            return $scope.data.notes;                            
                        } else {
                            $ionicLoading.hide();
                            $rootScope.withError = true;
                            $rootScope.errorMsg = "An error has occured";  
                        }
                      }).catch(function(err) {
                          $ionicLoading.hide();
                          $rootScope.withError = true;
                          $rootScope.errorMsg = err;

                      });  
                    
                }
              }
            ]
          });
    }

      $scope.showAll = function() {
        $ionicTabsDelegate.select(0);
        $scope.selectedFilter = 0;
      }
      
      $scope.showLoan = function() {
        $ionicTabsDelegate.select(1);
        $scope.selectedFilter = 1;
      }
      
      $scope.showReturn = function() {
        $ionicTabsDelegate.select(2);
        $scope.selectedFilter = 2;
      }
      
      
      $scope.filterRequests = function(item) {
       
          if($scope.selectedFilter==0) {
              return true;
          } else if($scope.selectedFilter==1) {
              return item.state=='Requested';
          } else if($scope.selectedFilter==2) {
              return  item.state=='ClosePending';
          }
      }
    
    })



.controller('RequestsDetailCtrl', function($scope, $rootScope, $stateParams, $ionicPopup, $http, $state, dataService, Utils, $ionicLoading) {
    
    $rootScope.showFilter = false;
    
    if(!Utils.isUndefinedOrNull($rootScope.user)) {
          
                $ionicLoading.show({
                        template: '<ion-spinner></ion-spinner> Loading...'
                });              
                                  
                dataService.async('loans/' + $stateParams.requestId).then(function(d) { 

                    if(d.status) {
                                          
                        $scope.request = d.data;
                        $ionicLoading.hide();

                    } else {                                          
                        console.log("Error loading items");                          
                        $ionicLoading.hide();
                    }

                });
            

        
    } else {
          //Navigate to Home
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go("app.home");
    }
    
    $scope.approveRequest = function(request) {
        
        $rootScope.currentLoanRequestItem = request;      
        $scope.data = {};
        
        var myPopup = $ionicPopup.show({
            template: '',
            title: 'Approve Request',
            subTitle: 'Do you want to approve ' + request.user.firstname + '\'s request for item ' + request.item.name + "?",
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Approve</b>',
                type: 'button-positive',
                onTap: function(e) {
                    
                    if(request.state == 'Requested') {            
                        request.state='Ongoing';
                    } else {
                        request.state='Closed';
                    }
                    
                    $ionicLoading.show({
                            template: '<ion-spinner></ion-spinner> Loading...'
                    });    

                    $http({
                          method: 'PUT',
                          url: url_base_api + 'loans/' + request._id,
                          headers: {
                             "Accept": "application/json;charset=utf-8",
                             "Authorization" : "Bearer " + $rootScope.token
                         },
                         dataType:"json",
                         data: request
                      }).then(function(obj) {
                        $ionicLoading.hide();
                        if(obj.status==200) {
                            $state.go('app.requests');
                            return $scope.data.notes;                            
                        } else {
                            $rootScope.withError = true;
                            $rootScope.errorMsg = "An error has occured";  
                        }
                      }).catch(function(err) {
                          $ionicLoading.hide();
                          $rootScope.withError = true;
                          $rootScope.errorMsg = err;

                      });  
                    
                }
              }
            ]
          });
    }
    
    $scope.rejectRequest = function(request) {
        
        $rootScope.currentLoanRequestItem = request;      
        $scope.data = {};
        
        var myPopup = $ionicPopup.show({
            template: '',
            title: 'Reject Request',
            subTitle: 'Do you want to reject ' + request.user.firstname + '\'s request for item ' + request.item.name + "?",
            scope: $scope,
            buttons: [
              { text: 'Cancel' },
              {
                text: '<b>Reject</b>',
                type: 'button-positive',
                onTap: function(e) {
                    
                    if(request.state == 'ClosePending') {            
                        request.state='Ongoing';
                    } else {                
                        request.state='Rejected';
                    }
                    
                    $ionicLoading.show({
                            template: '<ion-spinner></ion-spinner> Loading...'
                    });    

                    $http({
                          method: 'PUT',
                          url: url_base_api + 'loans/' + request._id,
                          headers: {
                             "Accept": "application/json;charset=utf-8",
                             "Authorization" : "Bearer " + $rootScope.token
                         },
                         dataType:"json",
                         data: request
                      }).then(function(obj) {
                        $ionicLoading.hide();
                        if(obj.status==200) {
                            $state.go('app.requests');
                            return $scope.data.notes;                            
                        } else {
                            $rootScope.withError = true;
                            $rootScope.errorMsg = "An error has occured";  
                        }
                      }).catch(function(err) {
                          $ionicLoading.hide();
                          $rootScope.withError = true;
                          $rootScope.errorMsg = err;

                      });  
                    
                }
              }
            ]
          });
    }
    
    
})

