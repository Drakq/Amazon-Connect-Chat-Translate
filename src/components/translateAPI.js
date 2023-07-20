import { API } from 'aws-amplify';

async function translate(content, targetLang) {
	return API.post("amazonTranslateAPI", "/translate", {"content": content, "targetLanguage": targetLang});
}

export default translate