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
    const endpoint = 'https://www.reebok.ca/api/products/tf/63978/availability?sitePath=en';
    const boks = await fetchData(endpoint);

    const conditions = {
      availability_status: 'IN_STOCK',
      size: ['8', '8.5', '9']
  };
  
  /*
  remember below we look through ALL keys in conditions, so they can pass the sizing condition
  but fail to match the 'availability_status' condtion, in the end we still are only left
  with items in the array that were in the size array on conditions object AND are available
  */

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