const axios = require('axios');
const Nexmo = require('nexmo');
const dotenv = require('dotenv');

//import environmental variables from our variables.env file
dotenv.config();

exports.checkStock = async (req, res, next) => {
    
    const availability = await getBoks();
    let numberOfPairs = 0;
    const sizes = [];

    if(availability.length){
      if(availability.length >= 2){
        availability.forEach(shoe => {
          sizes.push(shoe.size);
          numberOfPairs += parseInt(shoe.availability);
        });
        sendSms(`your Boks are available in sizes ${sizes.join(',')}, they have ${numberOfPairs} pairs in stock! Bok Boyz <3`);
      }else{
        numberOfPairs = availability[0]['availability'];
        sendSms(`your Boks are available in size ${availability[0]['size']}, they have ${numberOfPairs} pairs in stock! Bok Boyz <3`);
      }
    }else{
      sendSms('no Boks are available! Bok Boyz </3');
    }

    res.json({availability});
}

getBoks = async (req, res) => {
    const blackPair = 'https://www.reebok.ca/api/products/tf/67107/availability?sitePath=en';
    const whitePair = 'https://www.reebok.ca/api/products/tf/63978/availability?sitePath=en';
    const endpoints = [blackPair, whitePair];

    const boks = await Promise.all(endpoints.map(endpoint => { 
      return fetchData(endpoint);
    }))
    .then(data => {
      const allShoeData = data[0].concat(data[1]);
   
      const conditions = {
        availability_status: 'IN_STOCK',
        size: ['6.5', '7', '8', '8.5', '9']
      };

      const results = allShoeData.filter(shoe =>{
        for (let key in conditions) {
            if(key === 'size' && conditions[key].includes(shoe[key])){
                return true;
            }else if (shoe[key] === undefined || shoe[key] != conditions[key]) {
                return false;
            }
        }
        return true;
      });

      return results;
    })
    .catch(e => console.log(e));
    
    return boks;
}

const fetchData = async (endpoint) => {
    const res = await axios.get(endpoint);
    const data = res.data.variation_list;
    return data;
}

const sendSms = (msg) => {
    
    //init Nexmo
    const nexmo = new Nexmo({
      apiKey: process.env.API_KEY,
      apiSecret: process.env.API_SECRET
    }, { debug: true });

    const sendTelNum = process.env.SEND_PHONE_NUM;
    const toTelNum = process.env.PHONE_NUM;
    
    nexmo.message.sendSms(
      sendTelNum, toTelNum, msg, { type: 'unicode' },
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