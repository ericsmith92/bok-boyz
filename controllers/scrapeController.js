const axios = require('axios');
const Nexmo = require('nexmo');
const dotenv = require('dotenv');

//import environmental variables from our variables.env file
dotenv.config();

// Init Nexmo
const nexmo = new Nexmo({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET
}, { debug: true });

exports.checkStock = async (req, res, next) => {
    
    const availability = await scrapeAccount();
    let numberOfPairs = 0;
    const size = [];

    if(availability.length){
      if(availability.length >= 2){
        availability.forEach(shoe => {
          size.push(shoe.size);
          numberOfPairs += parseInt(shoe.availability);
        });
        sendSms(`your Boks are available in sizes ${size.join(',')}, they have ${numberOfPairs} pairs in stock! Bok Boyz <3`);
      }else{
        numberOfPairs = availability[0]['availability'];
        sendSms(`your Boks are available in size ${availability[0]['size']}, they have ${numberOfPairs} pairs in stock! Bok Boyz <3`);
      }
    }else{
      sendSms('no Boks are available! Bok Boyz </3');
    }

    res.json({availability});
}

scrapeAccount = async (req, res) => {
    //black pair
    //https://www.reebok.ca/api/products/tf/67107/availability?sitePath=en
    //const endpoint = 'https://www.reebok.ca/api/products/tf/63978/availability?sitePath=en';
    const blackPair = 'https://www.reebok.ca/api/products/tf/67107/availability?sitePath=en';
    const whitePair = 'https://www.reebok.ca/api/products/tf/63978/availability?sitePath=en';
    const endpoints = [blackPair, whitePair];

    //const boks = await fetchData(endpoint);
    Promise.all(endpoints.map(endpoint => { 
      return fetchData(endpoint);
    }))
    .then(data => {
      const boks = data[0].concat(data[1]);
   
      const conditions = {
        availability_status: 'IN_STOCK',
        size: ['7', '8', '8.5', '9']
      };

      const results = boks.filter(shoe =>{
        for (let key in conditions) {
            if(key === 'size' && conditions[key].includes(shoe[key])){
                return true;
            }else if (shoe[key] === undefined || shoe[key] != conditions[key]) {
                return false;
            }
        }
        return true;
      });

      //TODO: how do I get my results out of here?!?!
      console.log(results);
    })
    .catch(e => {console.log(e)});
    
    

    return;
}

const fetchData = async (endpoint) => {
    const res = await axios.get(endpoint);
    const data = res.data.variation_list;
    return data;
}

const sendSms = (msg) => {
    
    nexmo.message.sendSms(
      process.env.TEMP_PHONE_NUM, process.env.PHONE_NUM, msg, { type: 'unicode' },
        (err, responseData) => {
          if(err) {
            console.log(err);
          } else {
            const { messages } = responseData;
            const { ['message-id']: id, ['to']: number, ['error-text']: error  } = messages[0];
            console.dir(responseData);
          }
        }
      );
}