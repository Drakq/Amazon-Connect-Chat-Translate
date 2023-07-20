import * as deepl from "deepl-node"
import * as url from "url";
url.URLSearchParams = URLSearchParams;

async function ProcessChatText(content, targetLanguage) {
	const translator = new deepl.Translator(process.env.REACT_APP_DEEPL_KEY);
	return await translator.translateText(content, null, targetLanguage);
}
export default ProcessChatText
