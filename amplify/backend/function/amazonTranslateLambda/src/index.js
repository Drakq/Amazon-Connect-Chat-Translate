const deepl = require('deepl-node');
const translator = new deepl.Translator(process.env.DEEPL_KEY);

exports.handler = (event, context, callback) => {
	translator.translateText(event.content, null, event.targetLanguage).then((response) => {
		console.log('response ' + JSON.stringify(response));
		callback(null, {"statusCode": 200, headers: {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*"}, "body": JSON.stringify(response)});
	}).catch((error) => {
		console.error(error);
		callback(null, {"statusCode": 500, headers: {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*"}, "body": JSON.stringify(error)});
	});
};