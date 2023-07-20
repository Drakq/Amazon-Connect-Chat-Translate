//import Predictions from '@aws-amplify/predictions';
import * as deepl from "deepl-node";

async function DetectChatText(content) {
    /*let detectLang = Predictions.interpret({
        text: {
            source: {
                text: content,
            },
            type: "ALL"
        }
    })
    return detectLang*/
	console.log("detect key " + process.env.REACT_APP_DEEPL_KEY);
	const translator = new deepl.Translator("43bcd89d-58a9-a65a-b484-5f23205afa99:fx");
	const translation = await translator.translateText(content, null, "de");
	return translation.detectedSourceLang;
}

export default DetectChatText
