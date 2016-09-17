# IMT Mobile App

This Mobile App has been developed with Ionic as a Capstone Project for Coursera's Full Stack Development Certification Track.

It works in conjuction with a [REST API](https://github.com/danielgj/imt-rest-api) connected to a Mongo DB Database. An [Web app](https://github.com/danielgj/imt-web-interface) is also provided.


## Functionallity

* Every mobile app development company handles many devices for development and testing purposes.
* When development teams grow, managing which devices are in used and who has loan a particular device gets more and more difficult.
* Inventory Management Tool (IMT) will allow inventory and loans management giving real time information on which devices are free or in use and will support searching for available devices based on its characteristics.
* IMT will implement a workflow for the loan process that determine the approvals needed to request or to finish a loan of one particular item.

## Configuration

For the app to work, API URL must be set in file www/js/services.js:

`.service('configService',function() {
        var config = {};
        config.url_base_api = *'your_api_url_here'*;        
        return config;
})`
