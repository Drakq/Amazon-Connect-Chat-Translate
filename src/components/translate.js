//import Predictions from '@aws-amplify/predictions';
import * as deepl from "deepl-node"

async function ProcessChatText(content, sourceLang, tagretLang) {
    /*let transcriptMessage = await Predictions.convert({
        translateText: {
            source: {
                text: content,
                language: sourceLang, // defaults configured on aws-exports.js
                // supported languages https://docs.aws.amazon.com/translate/latest/dg/how-it-works.html#how-it-works-language-codes
            },
            targetLanguage: tagretLang
        }
    });
    return transcriptMessage.text*/

	console.log("translate key " + process.env.REACT_APP_DEEPL_KEY);
	const translator = new deepl.Translator("43bcd89d-58a9-a65a-b484-5f23205afa99:fx");
	const translation = await translator.translateText(content, null, tagretLang);
	return translation.text;
}
export default ProcessChatText
