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
    
    if(availability.length){
      const numberOfPairs = availability[0]['availability'];
      const size = availability[0]['size'];
      sendSms(`your Boks are available in size ${size}, they have ${numberOfPairs} pairs in stock! Bok Boyz <3`);
    }else{
      sendSms('no Boks are available! Bok Boyz </3');
    }

    res.json({availability});
}

scrapeAccount = async (req, res) => {
    const endpoint = 'https://www.reebok.ca/api/products/tf/63978/availability?sitePath=en';
    const boks = await fetchData(endpoint);

    const conditions = {
        availability_status: 'IN_STOCK',
        size: '9'
    };

    const results = boks.filter(shoe =>{
        for (let key in conditions) {
            if (shoe[key] === undefined || shoe[key] != conditions[key])
              return false;
            }
            return true;
    });

    return results;
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