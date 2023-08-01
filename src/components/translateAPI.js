import { API } from 'aws-amplify';

async function translate(content, targetLanguage) {
	return API.post("amazonTranslateAPI", "/translate", {'content': content,'targetLanguage': targetLanguage});
}

export default translate