var schedule = require('node-schedule');
const service = require('./../service/properties-service');

var j = schedule.scheduleJob('*/5 * * * * *', function(){
  console.log('Importing propertyData from Zoopla at ', new Date());
  service.zooplaImport().then((result) => {
    console.log(result);
  }).catch((e) => {
    console.log('Error',e);
  });
});
