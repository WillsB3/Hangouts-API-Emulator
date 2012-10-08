Hangup.js - A Google Hangouts API Emulator
=====================

#What is this?
An emulator for the Google+ Hangouts API to speed up the development process of writing Hangout apps.

This package allows you to use many parts of the Google+ Hangouts API offline to dramatically speed up the Hangout app development workflow.

Note: Not all API features are not supported yet. In the event that unsupported API functionality is used an exception will be thrown. This will not prevent your app from using these features in a real Google Hangout that uses the real Google Hangouts API.

#Features
- Partial implmentation of the Hangouts API
- Ability to emulate multiple participants with one machine via multiple browser windows.

#Usage
To test code changes during development **use the buttons on the developer bar instead of the browser refresh button**. 
- Pressing "Reload App" will, as far as your app is concerned, act just like the "Reload App" button in a real Google Hangout. That windows participant will be unchanged, and the Shared state of the app will remain in tact.
- Pressing "Reset app status" will clear the app status and reload the app. This behaviour differs from the button of the same name in a real Google Hangout, which only clears the shared state and does not reload the app.

As far as workflow is concerned, usually the steps are:

1. Make your code changes in your code editor
2. Switch to your browser
3. Press "Reset app status" in the first browser window you have the app running in
4. If you have other windows open with the app also loaded in, then press the "Reload app" button in each of these remaining windows.


#Browser Support
Since Hangup.js uses HTML5 features such as LocalStorage and SessionStorage IE is unsupported. The only tested browser is Google Chrome. Better browser support will hopefully happen in the future.

#Hangout API Version Support
API Version | Hangup.js Status
----------- | -----------
1.1 | Supported
1.2 | Untested  

#Currently supported API Features

## Supported Events
###gapi.hangout
API Feature  | Supported
:----------- | :-----------
onApiReady | **Yes**
onAppVisible | **Yes**
onEnabledParticipantsChanged | No
onParticipantsAdded | No
onParticipantsChanged | No
onParticipantsDisabled | No
onParticipantsEnabled | No
onParticipantsRemoved | No
onPreferredLocaleChanged | No
onPublicChanged | No
onTopicChanged | No

###gapi.hangout.av
No support yet

###gapi.hangout.av.effects
No support yet

###gapi.hangout.data
API Feature  | Supported
:----------- | :-----------
onMessageReceived | **Yes** 
onStateChanged | **Yes**

###gapi.hangout.layout
API Feature  | Supported
:----------- | :-----------
onChatPaneVisible | No 
onHasNotice | No

###gapi.hangout.onair
No support yet

## Supported Functions
###gapi.hangout
API Feature  | Supported
:----------- | :-----------
getEnabledParticipants | No
getHangoutUrl | No
getHangoutId | No
getLocale | No
getLocalParticipantLocale | No
getPreferredLocale | No
getStartData | No
getParticipantById | **Yes**
getParticipantId | **Yes**
getLocalParticipant | No
getLocalParticipantId | No
getParticipants | **Yes**
getTopic | No
hideApp | **Yes**
isApiReady | No
isAppVisible | **Yes**
isPublic | No

###gapi.hangout.av
No support yet

###gapi.hangout.av.effects
No support yet

###gapi.hangout.data
API Feature  | Supported
:----------- | :-----------
clearValue | **Yes**
getKeys | **Yes**
getValue | **Yes**
getState | **Yes**
getStateMetadata | No
setValue | **Yes**
submitDelta | **Yes**
sendMessage | **Yes**

###gapi.hangout.layout
API Feature  | Supported
:----------- | :-----------
createParticipantVideoFeed | No
dismissNotice | **Yes**
displayNotice | **Yes**
getDefaultVideoFeed | No
getVideoCanvas | No
hasNotice | **Yes**
isChatPaneVisible | No
setChatPaneVisible | No 

###gapi.hangout.data
No support yet

###gapi.hangout.onair
No support yet

#Bugs
If you believe you have found a bug in Hangup.js then please create an issue on the projects [GitHub issues page](https://github.com/WillsB3/Hangouts-API-Emulator/issues).

#Contributing
If you find an API feature which is not yet implemented in Hangup.js and are able to provide an implementation, then please feel free to file a pull request. 

We need help with:

- Improving the API coverage
- Improving browser support
- Implementing unit tests
- Bugfixes

