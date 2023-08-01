const deepl = require('deepl-node');
const translator = new deepl.Translator(process.env.DEEPL_KEY);

exports.handler = (body, context, callback) => {
	translator.translateText(body.content, null, body.targetLanguage).then(response => {
		console.log('Response: ' + JSON.stringify(response));
		callback(null, {"statusCode": 200, headers: {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*"}, "body": JSON.stringify(response)});
	}).catch(error => {
		console.error(error);
		callback(null, {"statusCode": 500, headers: {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*"}, "body": JSON.stringify(error)});
	});
};