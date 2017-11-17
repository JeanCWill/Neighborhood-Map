// var places = [
//     {
//         name: 'Baba Arguiles e Lounge',
//         lat: -26.222833,
//         long: -52.672056,
//         fb: 'BabaArguilesLounge'
//     },{
//         name: 'Boteco Cana Benta',
//         lat: -26.222823,
//         long: -52.671262,
//         fb: 'botecocanabenta'
//     },{
//         name: 'DOCK',
//         lat: -26.221347,
//         long: -52.672109,
//         fb: 'dockcontainer'
//     },{
//         name: 'Avenida Bombar',
//         lat: -26.218970,
//         long: -52.672973,
//         fb: 'AvenidaBombar'
//     },{
//         name: 'Planta Rock / Liberdade',
//         lat: -26.231105,
//         long: -52.661938,
//         fb: 'plantarockliberdade'
//     },{
//         name: 'Benedito Bar & Trattoria',
//         lat: -26.219796,
//         long: -52.672624,
//         fb: 'beneditotrattoria'
//     },{
//         name: 'Mecânica Meat\'n Beer',
//         lat: -26.220442,
//         long: -52.671177,
//         fb: 'mecanicameatnbeer'
//     },{
//         name: 'ClanDestino\'s Pub',
//         lat: -26.223397,
//         long: -52.672743,
//         fb: 'ClanDestinosPub'
//     },{
//         name: 'Bodeguero',
//         lat: -26.223784,
//         long: -52.671243,
//         fb: 'soubodeguero'
//     },{
//         name: 'Snooker Pub',
//         lat: -26.223958,
//         long: -52.671501,
//         fb: 'pancitosnooker'
//     },{
//         name: 'Lanchonete Sabiá',
//         lat: -26.218033,
//         long: -52.673403,
//         fb: 'lanchonetesabia'
//     }
// ];

var Place = function (data) {
    "use strict";
    this.id = ko.observable(data.id)
    this.name = ko.observable(data.name);
    this.lat = ko.observable(data.location.lat);
    this.lng = ko.observable(data.location.lng);
    this.address = ko.observable(data.location.address);
    this.category = ko.observable(data.categories[0].name);
    this.marker = ko.observable();
};

var map;
function initMap() {

    map = new google.maps.Map(document.getElementById("map"), {
        center: {lat:-26.226946, lng: -52.672358},
        zoom: 14
    });

    // Inicia o ViewModel
    ko.applyBindings(new ViewModel());
}

// Alerta o usuário se o Google não estiver funcionando
function googleError() {
    "use strict";
    document.getElementById('error').innerHTML = "<h2>Google Maps is not loading. Please try refreshing the page later.</h2>";
}

// ViewModel
var ViewModel = function () {
    "use strict";

    var self = this;

    // Criar um array de locais
    this.placeList = ko.observableArray([]);

    // Inicia a infoWindow
    var infowindow = new google.maps.InfoWindow({
        maxWidth: 200,
    });

    var marker;

    $.ajax({
        url: 'https://api.foursquare.com/v2/venues/search?near=pato+branco&categoryId=4d4b7105d754a06376d81259&client_id=N0TRERV452GJLTTPQIWNXXZR42XLIZPHVSFHAWO4JG2SJXSL&client_secret=SOPK5ATI2HIMCDKAYDASFZQXSUEDRH3W41GPDMJBDSEHVZDS&v=20171116',
        dataType: "json",
        success: function (data) {
            // Criar um objeto para cada item da lista
            data.response.venues.forEach(function (placeItem) {
                self.placeList.push(new Place(placeItem));
            });

            self.addMarkers();
        },

        error: function (e) {
            infowindow.setContent('<h5>Foursquare data is unavailable. Please try refreshing later.</h5>');
            document.getElementById("error").innerHTML = "<h4>Foursquare data is unavailable. Please try refreshing later.</h4>";
        }
    });

    console.log(self.placeList());
    self.addMarkers = function () {
        self.placeList().forEach(function (placeItem) {

            marker = new google.maps.Marker({
                position: new google.maps.LatLng(placeItem.lat(), placeItem.lng()),
                map: map,
                animation: google.maps.Animation.DROP
            });
            placeItem.marker = marker;

            var contentString = '<div id="iWindow"><h3>' + placeItem.name() + '</h3>'
                                + '<h4>- ' + placeItem.category() + '</h4>'
                                + '<p><label>Endereço: </label>' + placeItem.address() + '</p>'
                                + '<p><a target="_blank" href=https://www.google.com/maps/dir/Current+Location/' +
                                    placeItem.lat() + ',' + placeItem.lng() + '>Rotas</a></p></div>';

            google.maps.event.addListener(placeItem.marker, 'click', function () {
                infowindow.open(map, this);
                placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function () {
                    placeItem.marker.setAnimation(null);
                }, 500);
                infowindow.setContent(contentString);
                map.setCenter(placeItem.marker.getPosition());
            });

            google.maps.event.addListener(marker, 'click', function () {
                infowindow.open(map, this);
                placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function () {
                    placeItem.marker.setAnimation(null);
                }, 500);
            });
        });
    }

    self.showInfo = function (placeItem) {
        google.maps.event.trigger(placeItem.marker, 'click');
        self.hideElements();
    };

    self.toggleNav = ko.observable(false);
    this.navStatus = ko.pureComputed (function () {
        return self.toggleNav() === false ? 'nav' : 'navClosed';
        }, this);

    self.hideElements = function (toggleNav) {
        self.toggleNav(true);
        return true;
    };

    self.showElements = function (toggleNav) {
        self.toggleNav(false);
        return true;
    };

    self.visible = ko.observableArray();

    self.placeList().forEach(function (place) {
        self.visible.push(place);
    });

    self.userInput = ko.observable('');

    self.filterMarkers = function () {
        var searchInput = self.userInput().toLowerCase();
        self.visible.removeAll();
        self.placeList().forEach(function (place) {
            place.marker.setVisible(false);
            if (place.name().toLowerCase().indexOf(searchInput) !== -1) {
                self.visible.push(place);
            }
        });
        self.visible().forEach(function (place) {
            place.marker.setVisible(true);
        });
    };

};
