angular.module('smtApp.services', [])
    
.service('configService',function() {
        var config = {};
    
        config.url_base_api = 'your_api_url_here';        
        return config;
})

.service('dataService', ['$rootScope', '$http', 'configService', function($rootScope, $http, configService){
        
        return {
            async: function(object_url) {
            
                return $http({
                  method: 'GET',
                  url: configService.url_base_api + object_url,
                  headers: {
                        "Accept": "application/json;charset=utf-8",
                        "Authorization": "bearer " + $rootScope.token
                  },
                  dataType:"json"
            }).then(function(obj) {                
                return {
                        'status': true,
                        'data': obj.data                                           
                       };
            }).catch(function(err) {                
                    return {
                        'status': false,
                        'data': err
                    };                                
            });
          }
        }
        
}])


.factory('Utils', function() {
  var service = {
     isUndefinedOrNull: function(obj) {
         return !angular.isDefined(obj) || obj===null;
     }
  }

  return service;
});
