const request = require('request');
var axios = require('axios');
const {ObjectID} = require('mongodb');

const {Property} = require('node-js-properties-model');

var apiKey = '7tgaraqef8z47akf5csfcaed';
var pageSize = 100;

var url = `http://localhost:3001/api/v1/property_listings.js?api_key=key&country=England&postcode=BR2&page_size=${pageSize}&page_number=`
//var url = `http://api.zoopla.co.uk/api/v1/property_listings.json?area=Oxford&api_key=${apiKey}&page_size=${pageSize}&page_number=`;

var getZooplaPropertyListings = () => {
  return axios.get(url+'1')
    .then((response) => {
      var propertyList = []
      response.data.listing.forEach((response) => {
        propertyList.push(new Property({
          listingId: response.listing_id,
          price: response.price
        }));
      });
      return propertyList;
  }).catch ((e) => {
      console.log("Error", e);
  });
};

var zooplaImportPageOne = () => {
  return axios.get(url+'1')
    .then((response) => {
      const promises = response.data.listing.map((response) => {
        var property = new Property({
          listingId: response.listing_id,
          price: response.price
        });
        console.log(`--> Before saving Listing id: ${property.listingId} and Price: ${property.price}`);
        property.save().then (() => {}, (e) => {
          console.log('Error in saving data', e);
        });
      });
      return Promise.all(promises).then(()=> {
        return "data exported";
      });
    }).catch((e) => {
      console.log("Error", e);
    });
};

var zooplaImport = () => {
  return fetchZooplaPropertiesMeta(url)
    .then((result) => {
      //console.log('pageSize', result);
      return fetchAllZooplaProperties(url, result);
    })
    .then((propertyList) => {
        //console.log('saving propertyList to db');
        const promises = propertyList.map((property) => {
            return property.save().then(() => {});
        });
        //console.log('promises', promises);
        return Promise.all(promises).then(() => {
          return "data exported";
        });
    });
};

var fetchZooplaProperties = (url) => {
  return axios.get(url)
    .then((response) => {
      return response;
    });
};

var fetchZooplaPropertiesMeta = (url) => {
    return fetchZooplaProperties(url+'1')
      .then((response) => {
        dataSize = response.data.result_count;
        return(Math.ceil(dataSize/pageSize));
      });
}

var fetchAllZooplaProperties = (url, pageCount) => {
  var propertyListArray = [];
  var promises = [];
  var propertyArray = [];
  var i=1;
  while(i<=pageCount) {
    promises.push(fetchZooplaProperties(url+i)
      .then((response) => {
        propertyListArray.push(response.data.listing);
      })
    );
    i++;
  }
  //console.log('promises after zoopla get calls',promises);
  return Promise.all(promises).then(() => {
    propertyListArray.forEach((propertyList) => {
      propertyList.forEach((response) => {
        var property = new Property({
          listingId: response.listing_id,
          price: response.price
        });
        propertyArray.push(property);
      });
    });
    return propertyArray;
  });
};

var getAllPropertyListing = () => {
    return Property.find().then((properties) => {
      return properties;
    }).catch((e) => {
      console.log('Error in fetching listings',e);
      return;
    });
};

var getPropertyListing = (id) => {
  if(!ObjectID.isValid(id)) {
    return;
  }
  return Property.findById(id).then((property) => {
    if(!property) {
      return;
    }
    return property;
  });
};

var addProperty = (propertyData) => {
  var property = new Property(propertyData);
  return property.save().then(() => {
    return property;
  }, (e) => {
    console.log('Error in saving data', e);
  });
};

var updateProperty = (id, propertyData) => {
  if(!ObjectID.isValid(id)) {
    return;
  } else {
    return Property.findByIdAndUpdate(id, {$set: propertyData}, {new: true}).then((propertyData) => {
      if (!propertyData) {
        return;
      }
      return propertyData;
    });
  }
};

var deleteProperty = (id) => {
  if(!ObjectID.isValid(id)) {
    return;
  } else {
    return Property.findByIdAndRemove({'_id' : id}).then((result) => {
      if (!result) {
        return;
      }
      return result;
    });
  }
};

module.exports = {
  fetchZooplaPropertiesMeta,
  zooplaImportPageOne,
  deleteProperty,
  updateProperty,
  addProperty,
  getAllPropertyListing,
  getPropertyListing,
  getZooplaPropertyListings,
  zooplaImport
};
