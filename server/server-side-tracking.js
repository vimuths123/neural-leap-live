const request = require('request');
const requestIp = require('request-ip');
const crypto = require('crypto');
const cookie = require('cookie');

exports.handler = async (event, context) => {

  // Set up the API endpoint and access token
  const apiUrl = `https://graph.facebook.com/v12.0/${process.env.FACEBOOK_PIXEL_ID}/events`;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  // Define the event data
  const current_timestamp = Math.floor(new Date() / 1000);
  const clientIp = requestIp.getClientIp(event);
  const data = JSON.parse(event.body);

  //Try to send additional data to Facebook
  let cookies = null;
  if (event.headers.cookie) {
    cookies = cookie.parse(event.headers.cookie);
  }

  let email = null;
  if (cookies) {
    if (cookies.emailHash) {
      email = hash(cookies.emailHash);
    }
  }

  let phoneNumber = null;
  if (cookies) {
    if (cookies.phoneNumberHash) {
      phoneNumber = hash(cookies.phoneNumberHash);
    }
  }

  // Function to hash values using SHA256 algorithm
  function hash(value) {
    const hash = crypto.createHash('sha256');
    hash.update(value);
    return hash.digest('hex');
  }

  const eventData = {
    data: [
      {
        event_id: data.eventId,
        event_name: data.eventName,
        event_time: current_timestamp,
        user_data: {
          em: email,
          ph: phoneNumber,
          client_ip_address: clientIp
        },
        event_source_url: data.eventUrl
      }
    ],
    test_event_code: 'TEST77414'
  };

  // Set up the HTTP request options
  const options = {
    url: apiUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(eventData)
  };

  // Send the HTTP request
  /*request(options, (error, response, body) => {
    if (error) {
      console.error(error);
    } else {
      console.log(body);
    }
  });*/

  // Send the HTTP request
  request(options, (error, response, body) => {
    if (error) {
      console.error(error);
    } else if (response.statusCode !== 200) {
      console.error(`Unexpected status code: ${response.statusCode}`);
    } else {
      try {
        const data = JSON.parse(body);
        console.log(data);
      } catch (err) {
        console.error(err);
      }
    }
  });

};

//1. Test to make sure the code above works
//2. Test sending the phone number and email in the request as well
//3. If the above works then account for if the phone number and email is null or if it has a value