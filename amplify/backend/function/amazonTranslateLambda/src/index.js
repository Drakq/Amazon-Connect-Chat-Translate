const deepl = require('deepl-node');
const translator = new deepl.Translator(process.env.DEEPL_KEY);

exports.handler = (event, context, callback) => {
	let body = JSON.parse(event.body);
	
	translator.translateText(body.content, null, body.targetLanguage).then(response => {
		console.log('Response ' + response);
		callback(null, {"statusCode": 200, headers: {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*"}, "body": response});
	}).catch((error) => {
		console.error(error);
		callback(null, {"statusCode": 500, headers: {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*"}, "body": error});
	});
};