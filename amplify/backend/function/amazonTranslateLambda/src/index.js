//const AWS = require('aws-sdk');
//const translate = new AWS.Translate({ apiVersion: '2017-07-01' }); // Fix API version (best practice)

const deepl = require('deepl-node');
let region = process.env.KEY;
console.log("new key " + region);
const translator = new deepl.Translator("43bcd89d-58a9-a65a-b484-5f23205afa99:fx");

exports.handler = (event, context, callback) => {
  let payload = JSON.parse(event.body);
  console.log("event: ", event);
  console.log("event: ", payload.terminologyNames);
  // body: '{"content":"hello","sourceLang":"en","targetLang":"en"}'

  let params = {
    SourceLanguageCode: payload.sourceLang,
    /* required */
    TargetLanguageCode: payload.targetLang,
    /* required */
    Text: payload.content,
    /* required */
    TerminologyNames: payload.terminologyNames
  };
  console.log("parameters: " + JSON.stringify(params));
  
  translator.translateText(payload.content, null, payload.targetLang).then((result) => {
	console.log('response ' + JSON.stringify(response));
	callback(null, {"statusCode": 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, "body": JSON.stringify((response))});
  }).catch((error) => {
    console.error(error);
    callback(null, {"statusCode": 500, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, "body": JSON.stringify((error))});
  });

  /*translate.translateText(
    params,
    function(error, response) {

      if (error) {
        console.log(error);
        callback(null, { "statusCode": 500, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, "body": JSON.stringify((error)) });
      }
      else {
        console.log('response ' + JSON.stringify(response));
        callback(null, { "statusCode": 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" }, "body": JSON.stringify((response)) });
      }
    }

  );*/
};
