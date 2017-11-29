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

    $('#list-holder').hide();
    $('#error').hide();

    var self = this;

    // Criar um array de locais
    this.placeList = ko.observableArray([]);
    self.visible = ko.observableArray();

    // Inicia a infoWindow
    var infowindow = new google.maps.InfoWindow({
        maxWidth: 200,
    });

    var marker;

    //Seu ID de cliente da api do Foursquare
    var clientIdFoursquare = '';

    //Sua chave da api do Foursquare
    var clientSecretFoursquare = '';

    //Busca as localizações de bares na cidade de Pato Branco - PR na api do Foursquare
    $.ajax({
        url: 'https://api.foursquare.com/v2/venues/search?near=pato+branco&categoryId=4d4b7105d754a06376d81259&client_id=' + clientIdFoursquare + '&client_secret=' + clientSecretFoursquare + '&v=20171116',
        dataType: "json",
        success: function (data) {
            // Criar um objeto para cada item da lista
            data.response.venues.forEach(function (placeItem) {
                self.placeList.push(new Place(placeItem));
            });

            self.addMarkers();
        },

        //Mostra a mensagem de erro caso não consiga acessar a api
        error: function (e) {
            $('#error').show();
        }
    });

    //Adiciona os marcadores das localizações fornecidas pelo Foursquare
    self.addMarkers = function () {
        self.placeList().forEach(function (placeItem) {

            marker = new google.maps.Marker({
                position: new google.maps.LatLng(placeItem.lat(), placeItem.lng()),
                map: map,
                animation: google.maps.Animation.DROP
            });
            placeItem.marker = marker;

            //Monta o conteudo da InfoWindow
            var contentString = '<div id="iWindow"><h3>' + placeItem.name() + '</h3>'
                                + '<h4>- ' + placeItem.category() + '</h4>'
                                + '<p><label>Endereço: </label>' + placeItem.address() + '</p>'
                                + '<p><a target="_blank" href=https://www.google.com/maps/dir/Current+Location/' +
                                    placeItem.lat() + ',' + placeItem.lng() + '>Rotas</a></p></div>';

            //Configura animação e conteudo da InfoWindow
            google.maps.event.addListener(placeItem.marker, 'click', function () {
                infowindow.open(map, this);
                placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function () {
                    placeItem.marker.setAnimation(null);
                }, 500);
                infowindow.setContent(contentString);
                map.setCenter(placeItem.marker.getPosition());
            });

            //Adiciona o ponto no mapa
            google.maps.event.addListener(marker, 'click', function () {
                infowindow.open(map, this);
                placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function () {
                    placeItem.marker.setAnimation(null);
                }, 500);
            });
        });

        self.placeList().forEach(function (place) {
            self.visible.push(place);
        });
    }

    self.showInfo = function (placeItem) {
        google.maps.event.trigger(placeItem.marker, 'click');
    };

    self.toggleNav = ko.observable(false);
    this.navStatus = ko.pureComputed (function () {
        return self.toggleNav() === false ? 'nav' : 'navClosed';
        }, this);

    self.userInput = ko.observable('');

    //Filtra os itens da listagem de acordo com a pesquisa
    self.filterMarkers = function () {
        var searchInput = self.userInput().toLowerCase();

        //Mostra ou esconde a lista de localidades
        if (searchInput == '') {
            $('#list-holder').hide();
        } else {
            $('#list-holder').show();
        }

        //Esconde todas as marcações do mapa
        self.visible.removeAll();
        self.placeList().forEach(function (place) {
            place.marker.setVisible(false);
            if (place.name().toLowerCase().indexOf(searchInput) !== -1) {
                self.visible.push(place);
            }
        });

        //Adiciona somente as marcações que foram encontradas pela pesquisa
        self.visible().forEach(function (place) {
            place.marker.setVisible(true);
        });
    };

};
