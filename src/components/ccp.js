import React, { useEffect, useState } from 'react';
import { Grid } from 'semantic-ui-react';
import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';
import Chatroom from './chatroom';
import translate from './translateAPI';
import { addChat, setLanguageTranslate, clearChat, useGlobalState, setCurrentContactId } from '../store/state';

Amplify.configure(awsconfig);


const Ccp = () => {
    const [languageTranslate] = useGlobalState('languageTranslate');
    var localLanguageTranslate = [];
    const [Chats] = useGlobalState('Chats');
    const [lang, setLang] = useState("");
    const [currentContactId] = useGlobalState('currentContactId');
    const [languageOptions] = useGlobalState('languageOptions');
    const [agentChatSessionState, setAgentChatSessionState] = useState([]);
    const [setRefreshChild] = useState([]);

    

    // *******
    // Subscribe to the chat session
    // *******
	var transcript;
    function getEvents(contact, agentChatSession) {
        contact.getAgentConnection().getMediaController().then(controller => {
            controller.onMessage(messageData => {
                if (messageData.chatDetails.participantId === messageData.data.ParticipantId) {
                    console.log(`CDEBUG ===> Agent ${messageData.data.DisplayName} Says`,
                        messageData.data.Content)
                }
                else {
					if(messageData.data.Content !== undefined) {
						console.log(`CDEBUG ===> Customer ${messageData.data.DisplayName} Says`,messageData.data.Content);
						processChatText(messageData.data.Content, messageData.data.Type, messageData.data.ContactId );
						controller.getTranscript({MaxResults: 9999}).then(function (result) {
							transcript = result.data["Transcript"];
						});
					}
                }
            })
        })
    }
    // *******
    // Processing the incoming chat from the Customer
    // *******
    async function processChatText(content, type, contactId) {
         // Update (or Add if new contactId) the store with the the language code
        function upsert(array, item) {
        	const i = array.findIndex(_item => _item.contactId === item.contactId);
            if (i > -1) array[i] = item;
        	else array.push(item);
        }
                
        // Translate the customer message into German.
		let translation = await translate(content, 'de');
		let translatedMessage = translation.text;
		let textLanguage = translation.detectedSourceLang;
		//Update the Language of the Client after every message
		if(textLanguage !== '') {
			console.log("Detected Language: " + textLanguage);
			upsert(languageTranslate, {contactId: contactId, lang: textLanguage})
			setLanguageTranslate(languageTranslate);
		}

        console.log(`CDEBUG ===>  Original Message: ` + content + `\n Translated Message: ` + translatedMessage);
        // create the new message to add to Chats.
        let data2 = {
            contactId: contactId,
            username: 'customer',
            content: <p>{content}</p>,
            translatedMessage: <p>{translatedMessage}</p>
        };
        // Add the new message to the store
        addChat(prevMsg => [...prevMsg, data2]);
    }

    // *******
    // Subscribing to CCP events. See : https://github.com/aws/amazon-connect-streams/blob/master/Documentation.md
    // *******
    function subscribeConnectEvents() {
        window.connect.core.onViewContact(function(event) {
            var contactId = event.contactId;
            console.log("CDEBUG ===> onViewContact", contactId)
            setCurrentContactId(contactId);    
          });

        console.log("CDEBUG ===> subscribeConnectEvents");

        // If this is a chat session
        if (window.connect.ChatSession) {
            console.log("CDEBUG ===> Subscribing to Connect Contact Events for chats");
            window.connect.contact(contact => {

                // This is invoked when CCP is ringing
				contact.onConnecting(() => {
					console.log("CDEBUG ===> onConnecting() >> contactId: ", contact.contactId);
					let contactAttributes = contact.getAttributes();
					console.log("CDEBUG ===> contactAttributes: ", JSON.stringify(contactAttributes));
					let contactQueue = contact.getQueue();
					console.log("CDEBUG ===> contactQueue: ", contactQueue);
					//Get customer data
					const email = contactAttributes.email.value;
					const contactID = contactAttributes.contactID.value.replaceAll('-', '').toUpperCase();
					var previousTranscript = contactAttributes.previousTranscript.value.replaceAll("\\n", "\n");
					const ticketID = contactAttributes.ticketID.value;
					const advantageCard = contactAttributes.advantageCard.value;
					const bot = contactAttributes.bot.value;
					if(previousTranscript != "") {
						previousTranscript = "Previous Bot Chat:\n" + previousTranscript + "\n";
					}
					
					//Send payload without transcript to open customer in C4C after incoming Chat was ACCEPTED
					const parentPayload = "<?xml version='1.0' encoding='utf-8' ?><payload><Type>CHAT</Type><CID>BCM1234</CID><EventType>INBOUND</EventType><Action>ACCEPT</Action><Email>" + email + "</Email><Custom_1>" + ticketID + "</Custom_1><Custom_2>" + email + "</Custom_2><Custom_3>" + advantageCard + "</Custom_3><TicketID>" + ticketID + "</TicketID><ExternalReferenceID>" + contactID + "</ExternalReferenceID></payload>";
					window.parent.postMessage(parentPayload, "*");
				});

                // This is invoked when the chat is accepted
                contact.onAccepted(async() => {
                    console.log("CDEBUG ===> onAccepted: ", contact);
                    const cnn = contact.getConnections().find(cnn => cnn.getType() === window.connect.ConnectionType.AGENT);
                    const agentChatSession = await cnn.getMediaController();
                    setCurrentContactId(contact.contactId)
                    console.log("CDEBUG ===> agentChatSession ", agentChatSession)
                    // Save the session to props, this is required to send messages within the chatroom.js
                    setAgentChatSessionState(agentChatSessionState => [...agentChatSessionState, {[contact.contactId] : agentChatSession}])
                
                    // Get the language from the attributes, if the value is valid then add to the store
                    localLanguageTranslate = contact.getAttributes().x_lang
					if(localLanguageTranslate && localLanguageTranslate.value) {
						if(Object.keys(languageOptions).find(key => languageOptions[key] === localLanguageTranslate.value) !== undefined){
							console.log("CDEBUG ===> Setting lang code from attribites:", localLanguageTranslate.value)
							languageTranslate.push({contactId: contact.contactId, lang: localLanguageTranslate.value})
							setLanguageTranslate(languageTranslate);
							setRefreshChild('updated') // Workaround to force a refresh of the chatroom UI to show the updated language based on contact attribute.
						}
						console.log("CDEBUG ===> onAccepted, languageTranslate ", languageTranslate)
					}
                });

                // This is invoked when the customer and agent are connected
                contact.onConnected(async() => {
                    console.log("CDEBUG ===> onConnected() >> contactId: ", contact.contactId);
                    const cnn = contact.getConnections().find(cnn => cnn.getType() === window.connect.ConnectionType.AGENT);
                    const agentChatSession = await cnn.getMediaController();
                    getEvents(contact, agentChatSession);
                });

                // This is invoked when new agent data is available
                contact.onRefresh(() => {
                    console.log("CDEBUG ===> onRefresh() >> contactId: ", contact.contactId);
                });

                // This is invoked when the agent moves to ACW
				contact.onEnded(() => {
					console.log("CDEBUG ===> onEnded() >> contactId: ", contact.contactId);
					//When the chat has ended, a new chat will be send to the C4C with the whole transcript of the chat
					let contactAttributes = contact.getAttributes();
					transcript = transcript.map(function(msg) {
						const displayName = msg.DisplayName !== "Customer" ? msg.DisplayName : contactAttributes.name.value;
						if (msg.Type == "MESSAGE") {
							return msg = displayName + ": " + msg.Content;
						} else if (msg.Type == "ATTACHMENT") {
							try {
								return msg = displayName + ": " + msg.Attachments.map(a => a.AttachmentName).join(", ");
							} catch(error) {
								return msg = displayName + ": " + "Send File";
							}
						}
					}).join("\n");
					
					const email = contactAttributes.email.value;
					const contactID = contactAttributes.contactID.value.replaceAll('-', '').toUpperCase();
					const parentPayload = "<?xml version='1.0' encoding='utf-8' ?><payload><Type>CHAT</Type><CID>BCM1234</CID><Action>END</Action><Email>" + email + "</Email><ExternalReferenceID>" + contactID + "</ExternalReferenceID><EventType>UPDATEACTIVITY</EventType><Transcript>" + transcript + "</Transcript></payload>";
					window.parent.postMessage(parentPayload, "*");
				});
                
                // This is invoked when the agent moves out of ACW to a different state
                contact.onDestroy(() => {
                    console.log("CDEBUG ===> onDestroy() >> contactId: ", contact.contactId);
                    // TODO need to remove the previous chats from the store
                    //clearChat()
                    setCurrentContactId('')
                });
            });

            /* 
            **** Subscribe to the agent API **** 
            See : https://github.com/aws/amazon-connect-streams/blob/master/Documentation.md
            */

            console.log("CDEBUG ===> Subscribing to Connect Agent Events");
            window.connect.agent((agent) => {
                agent.onStateChange((agentStateChange) => {
                    // On agent state change, update the React state.
                    let state = agentStateChange.newState;
                    console.log("CDEBUG ===> New State: ", state);

                });

            });
        }
        else {
            console.log("CDEBUG ===> waiting 3s");
            setTimeout(function() { subscribeConnectEvents(); }, 3000);
        }
    };


    // ***** 
    // Loading CCP
    // *****
	useEffect(() => {
		const connectUrl = process.env.REACT_APP_CONNECT_INSTANCE_URL;
		window.connect.agentApp.initApp(
			"ccp",
			"ccp-container",
			connectUrl + "/connect/ccp-v2/", 
			{
				ccpParams: {
					region: process.env.REACT_APP_CONNECT_REGION,
					pageOptions: {
						enableAudioDeviceSettings: true,
						enablePhoneTypeSettings: true
					},
					loginPopup: true,
					loginPopupAutoClose: true,
					loginOptions: {
						autoClose: true,
						height: 578,
						width: 433,
						top: 0,
						left: 0
					},
					softphone: {
						allowFramedSoftphone: true,
						disableRingtone: false,
						//ringtoneUrl: "./ringtone.mp3"
					},
					featurePermissions: {
						"ATTACHMENTS": true,
					}
				}
			}
			);
			subscribeConnectEvents();
	}, []);


    return (
        <main>
          <Grid columns='equal' stackable padded>
          <Grid.Row>
            {/* CCP window will load here */}
            <div id="ccp-container"></div>
            {/* Translate window will laod here. We pass the agent state to be able to use this to push messages to CCP */}
            <div id="chatroom" ><Chatroom session={agentChatSessionState}/> </div> 
            </Grid.Row>
          </Grid>
        </main>
    );
};

export default Ccp;
