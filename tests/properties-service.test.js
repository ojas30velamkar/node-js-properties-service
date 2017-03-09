var assert = require('chai').assert;
var expect = require('chai').expect;
const rewire = require('rewire');
var axios = require('axios');
var MockAdapter = require('axios-mock-adapter');
var sinon = require('sinon');

var service = rewire('./../service/properties-service')
const {Property} = require('node-js-properties-model');

var pageSize = 100;
var url = `http://localhost:3001/api/v1/property_listings.js?api_key=key&country=England&postcode=BR2&page_size=${pageSize}&page_number=`
//var url = `http://api.zoopla.co.uk/api/v1/property_listings.json?area=Oxford&api_key=${apiKey}&page_size=${pageSize}&page_number=`;


// This sets the mock adapter on the default instance
var mock = new MockAdapter(axios);

mock.onGet(url+'1').reply(200, { "result_count": 300,
                                 "longitude": 50,
                                 "latitude": 12,
                                 "listing": [
                                              {
                                                "listing_id": "111111",
                                                "price": 111
                                              }
                                            ]
                                          })
    .onGet(url+'2').reply(200, { "result_count": 300,
                                     "listing": [
                                                  {
                                                    "listing_id": "222222",
                                                    "price": 222
                                                  }
                                                ]
                                              })
    .onGet(url+'3').reply(200, { "result_count": 300,
                                     "listing": [
                                                  {
                                                    "listing_id": "33333",
                                                    "price": 3333
                                                  }
                                                ]
                                              });

beforeEach((done) => {
  Property.remove({ listingId: { $in: ['111111','222222','33333', 'testAddPropery'] } }).then(() => {
    return;
  }).then(() => done());
});

describe('Properties Service', () => {

  service.__set__('axios', axios);
  it('Fetches Property Listing from Zoopla ', (done) => {
    service.getZooplaPropertyListings()
      .then((data) => {
        assert.equal(data[0].listingId, "111111");
        assert.equal(data[0].price,111);
        done();
      }).catch((e) => done(e));
  });

  it('Fetches Property Listing Meta', (done) => {
    service.fetchZooplaPropertiesMeta(url)
      .then((data) => {
        assert.equal(data.pageCount, 3);
        assert.equal(data.latitude, 12);
        assert.equal(data.longitude, 50);
        done();
      }).catch((e) => done(e));
  });

  it('Imports all zoopla data into db', (done) => {
    service.zooplaImport()
      .then((data) => {
        assert.equal(data, "data exported");

        //Check db
        Property.find({ listingId: { $in: ['111111','222222','33333'] } })
          .then((data) => {
            assert.equal(data.length, 3);
        });
        done();
      }).catch((e) => done(e));
  });

  it('Should add a property to mongodb', (done) => {
    var propertyData = {
      "listingId": "testAddPropery",
      "price": 999
    };
    service.addProperty(propertyData)
      .then((data) => {
          assert.equal(data.listingId, "testAddPropery");
          Property.find({ listingId: { $in: ['testAddPropery'] } })
            .then((data) => {
              assert.equal(data.length, 1);
          });
          done();
      }).catch((e) => done(e));
  });

});
