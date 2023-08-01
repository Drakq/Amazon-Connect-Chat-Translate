import { API } from 'aws-amplify';

async function translate(content, targetLanguage) {
	return API.post("amazonTranslateAPI", "/translate", {body: {'content': content,'targetLanguage': targetLanguage}});
}

export default translate