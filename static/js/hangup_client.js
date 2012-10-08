/*
 * Offline Google Hangout API Emulator
 * By Wills Bithrey
 * Version 1.0 - June 2012.
 * MIT LICENSE
 */

/////////////////////////////////////////////
// Custom exceptions
/////////////////////////////////////////////
function GenericHangoutException(message) {
	this.message = message;

	this.toString = function() {
		return this.message;
	};
}

function FeatureNotImplementedException(feature) {
	console.error(feature + ' has not been implemented yet');
}


/////////////////////////////////////////////
// Setup Hangout Host JS.
/////////////////////////////////////////////
function gapi() {
	var gapi = this;
	var self = this;

	/////////////////////////////////////////////
	// Public variables
	/////////////////////////////////////////////
	this.isEmulated = true;

	/////////////////////////////////////////////
	// Public facing API Implementation
	/////////////////////////////////////////////

	this.hangout = {
		/////////////////////////////////////////////
		// gapi.hangout Functions
		/////////////////////////////////////////////

		getEnabledParticipants: function() {
			/*	Gets the participants who have enabled the app. */
			return window.parent.gapi.hangout.getEnabledParticipants();
		},

		getHangoutUrl: function() {
			/*	Gets the URL for the hangout. Example URL: 
				'https://hangoutsapi.talkgadget.google.com/hangouts/1b8d9e10742f576bc994e18866ea'
			*/

			return window.parent.gapi.hangout.getHangoutUrl();
		},

		getHangoutId: function() {
			/*	Gets an identifier for the hangout guaranteed to be unique for the hangout's duration.
				The API makes no other guarantees about this identifier. Example of hangout id:
				'muvc-private-chat-99999a93-6273-390d-894a-473226328d79@groupchat.google.com' 
			*/

			return window.parent.gapi.hangout.getHangoutId();
		},

		getLocale: function() {
			/*	Gets the locale for the participant in the hangout.
				Example: 'en-US' 
			*/

			return window.parent.gapi.hangout.getLocale();
		},

		getStartData: function() {
			/*	Gets the starting data for the current active app. This is the data passed in 
				by the gd URL parameter (also available with gadgets.views.getParams). 
				Returns null if no start data has been specified. 
			*/

			return window.parent.gapi.hangout.getStartData();
		},

		getParticipantById: function(participantId) {
			/*	Gets the participant with the given id. Returns null if no participant exists with
				the given id.
			*/

			return window.parent.gapi.hangout.getParticipantById(participantId);
		},

		getParticipantId: function() {
			/*	Gets the id of the local participant. A user is assigned a new id each time 
				they join a hangout. 
				Example: 'hangout65A4C551_ephemeral.id.google.com^354e9d1ed0' 
			*/

			return window.parent.gapi.hangout.getParticipantId();
		},

		getParticipants: function() {
			/*	Gets the participants in the hangout. Note that the list of participants reflects 
				the current state on the hangouts server. There may be a small window of time where
				the local participant (returned from getParticipantId()) is not in the returned array.
			*/

			return window.parent.gapi.hangout.getParticipants();
		},

		hideApp: function() {
			/*	Hide the app and show the video feed in the main hangout window. The app will continue
				to run while it is hidden.
				See also: gapi.hangout.onAppVisible
			*/

			return window.parent.gapi.hangout.hideApp();
		},

		isApiReady: function() {
			/*	Returns true if the gapi.hangout API is initialized; false otherwise. Before the API is 
				initialized, data values may have unexpected values.
			*/
			
			return window.parent.gapi.hangout.isApiReady();
		},

		isAppVisible: function() {
			/*	Returns true if the app is visible in the main hangout window, false otherwise.	*/
			
			return window.parent.gapi.hangout.isAppVisible();
		},

		isPublic: function() {
			/* Returns true if the hangout is open to the public false otherwise. */
			
			return window.parent.gapi.hangout.isPublic();
		},

		/////////////////////////////////////////////
		// gapi.hangout Events
		/////////////////////////////////////////////

		onApiReady: {
			add: function(callback) {
				/*	Adds a callback to be called when the gapi.hangout API becomes ready to use. 
					If the API is already initialized, the callback will be called at the next 
					event dispatch. 
				*/

				return window.parent.gapi.hangout.onApiReady.add(callback);
			},

			remove: function(callback) {
				/*	Removes a callback previously added by onApiReady.add. */

				return window.parent.gapi.hangout.onApiReady.remove(callback);
			}
		},

		onAppVisible: {
			add: function(callback) {
				/*	Adds a callback to be called when the app is shown or hidden. The argument
					to the callback is an event that holds the state that indicates whether 
					the app is visible or not. See also: gapi.hangout.hideApp
				*/

				return window.parent.gapi.hangout.onAppVisible.add(callback);
			},

			remove: function(callback) {
				/* Removes a callback previously added by onAppVisible.add. */

				return window.parent.gapi.hangout.onAppVisible.remove(callback);
			}
		},

		onEnabledParticipantsChanged: {
			add: function(callback) {
				/*	Adds a callback to be called whenever the set of "participants with the app
					enabled" changes. The argument to the callback is an event that holds all 
					participants who have enabled the app since the last time the event fired.
				*/

				return window.parent.gapi.hangout.onEnabledParticipantsChanged.add(callback);
			},

			remove: function(callback) {
				/* Removes a callback previously added by onEnabledParticipantsChanged.add. */

				return window.parent.gapi.hangout.onEnabledParticipantsChanged.remove(callback);
			}
		},

		onParticipantsAdded: {
			add: function(callback) {
				/*	Adds a callback to be called whenever participants join the hangout. The 
					argument to the callback is an event that holds the particpants who have
					joined since the last time the event fired.
				*/

				return window.parent.gapi.hangout.onParticipantsAdded.add(callback);
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsAdded.add. */

				return window.parent.gapi.hangout.onParticipantsAdded.remove(callback);
			}
		},

		onParticipantsChanged: {
			add: function(callback) {
				/*	Adds callback to be called whenever there is any change in the participants
					in the hangout. The argument to the callback is an event that holds holds
					the participants currently in the hangout.
				*/

				return window.parent.gapi.hangout.onParticipantsChanged.add(callback);
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsChanged.add. */

				return window.parent.gapi.hangout.onParticipantsChanged.remove(callback);
			}
		},

		onParticipantsDisabled: {
			add: function(callback) {
				/*	Adds a callback to be called whenever participants disable this app.
					The argument to the callback is an event that holds the participants
					who have disabled the app since the last time the event fired.
				*/

				return window.parent.gapi.hangout.onParticipantsDisabled.add(callback);
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsDisabled.add. */

				return window.parent.gapi.hangout.onParticipantsDisabled.remove(callback);
			}
		},

		onParticipantsEnabled: {
			add: function(callback) {
				/*	Adds a callback to be called whenever a participant in the hangout
					enables this app. The argument to the callback is an event that
					holds the set of participants who have enabled the app since the
					last time the event fired.
				*/

				return window.parent.gapi.hangout.onParticipantsEnabled.add(callback);
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsEnabled.add. */

				return window.parent.gapi.hangout.onParticipantsEnabled.remove(callback);
			}
		},

		onParticipantsRemoved: {
			add: function(callback) {
				/*	Adds a callback to be called whenever participants leave the hangout.
					The argument to the callback is an event that holds the participants
					who have left since the last time the event fired.
				*/

				return window.parent.gapi.hangout.onParticipantsRemoved.add(callback);
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsRemoved.add. */

				return window.parent.gapi.hangout.onParticipantsRemoved.remove(callback);
			}
		},

		onPublicChanged: {
			add: function(callback) {
				/*	Adds a callback to be called when the hangout becomes public. 
					A hangout can change only from private to public.
				*/

				return window.parent.gapi.hangout.onPublicChanged.add(callback);
			},

			remove: function(callback) {
				/* Removes a callback previously added by onPublicChanged.add. */

				return window.parent.gapi.hangout.onPublicChanged.remove(callback);
			}
		},

		av: {
			// Not implemented.	
		},

		data: {

			/////////////////////////////////////////////
			// gapi.hangout.data Functions
			/////////////////////////////////////////////

			clearValue: function(key) {
				/*	Clears a single key/value pair.
					See also: gapi.hangout.data.onStateChanged 
				*/

				return window.parent.gapi.hangout.data.clearValue(key);
			},

			getKeys: function() {
				/*	Gets the keys in the shared state object, an array of strings. */

				return window.parent.gapi.hangout.data.getKeys();
			},

			getValue: function(key) {
				/*	Gets the value for a given key. */

				return window.parent.gapi.hangout.data.getValue(key);
			},

			getState: function() {
				/*	Gets the shared state object, a set of name/value pairs. */

				return window.parent.gapi.hangout.data.getState();
			},

			getStateMetadata: function() {
				/*	Gets the state metadata object, which contains the same key/value 
					data as the shared state object retrieved via getState but augmented
					with additional information. Each metadata entry includes:
					-	key: the key being added.
					-	value: the new value being set.
					-	timestamp: The server time that the key/value was most recently updated.
					-	timediff: The difference in time on the server between the current time
						and the time the key/value was most recently updated.
				*/

				return window.parent.gapi.hangout.data.getStateMetadata();
			},

			setValue: function(key, value) {
				/*	Sets a single key value pair.
					See also: gapi.hangout.data.onStateChanged
 				*/

				return window.parent.gapi.hangout.data.setValue(key, value);
			},

			sendMessage: function(message) {
				/*	Sends a message to the other app participants. A message is simply a string
					defined by the app. Messages are not retained or stored, and should have 
					lower latency than objects stored via submitDelta. This is a best-effort 
					delivery system, and messages might be lost, so this method should only
					be used to send things that can be dropped (e.g. sending mouse coordinates 
					from a user).
					See also: gapi.hangout.data.onMessageReceived
 				*/

				return window.parent.gapi.hangout.data.sendMessage(message);
			},

			submitDelta: function(opt_updates, opt_removes) {
				/*	Submits a request to update the value of the shared state object.
					See also: gapi.hangout.data.onStateChanged
				*/

				return window.parent.gapi.hangout.data.submitDelta(opt_updates, opt_removes);
			},

			/////////////////////////////////////////////
			// gapi.hangout.data Events
			/////////////////////////////////////////////

			onMessageReceived: {
				add: function(callback) {
					/*	Adds a callback to be called when a message is received. The argument 
						to the callback is an object containing the ID for the sender and the message.
						See also: gapi.hangout.data.sendMessage
					*/
					return window.parent.gapi.hangout.data.onMessageReceived.add(callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onMessageReceived.add. */

					return window.parent.gapi.hangout.data.onMessageReceived.remove(callback);
				}
			},

			onStateChanged: {
				add: function(callback) {
					/*	Adds a callback to be called when a new version of the shared state object 
						is received from the server. The first parameter of the callback contains 
						an array of values added to the shared state object. Each added value 
						includes the following members:
						-	key: the key being added.
						-	value: the new value being set.
						-	timestamp: The server time that the key/value was most recently updated.
						-	timediff: The difference in time on the server between the current time 
							and the time the key/value was most recently updated.

						The second parameter to the callback contains an array of key names that have 
						been removed from the shared state object. The third paramater to the callback
						contains the current value of the shared state object. The fourth parameter to
						the callback contains the current value of the metadata for the shared state object.
						
						Note that the callback will be called for changes in the shared state which result
						from submitDelta calls made from this participant's app.

						See also: gapi.hangout.data.clearValue, gapi.hangout.data.setValue, gapi.hangout.data.submitDelta
					*/

					return window.parent.gapi.hangout.data.onStateChanged.add(callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onStateChanged.add. */

					return window.parent.gapi.hangout.data.onStateChanged.remove(callback);
				}
			}
		},

		layout: {
			/////////////////////////////////////////////
			// gapi.hangout.layout Functions
			/////////////////////////////////////////////

			DefaultVideoFeed: {
				onDisplayedParticipantChanged: {
					add: function(callback) {
						/*	Adds a callback to be called when the displayed participant changes.
							The argument to the callback is an event that holds the id of the 
							new displayed participant.
							
							Note that these events will fire even when the canvas is not showing
							the DefaultVideoFeed.
						*/

						return window.parent.gapi.hangout.layout.DefaultVideoFeed.onDisplayedParticipantChanged.add(callback);
					}, 

					remove: function() {
						/*	Removes a callback added by onDisplayedParticipantChanged.add. */

						return window.parent.gapi.hangout.layout.DefaultVideoFeed.onDisplayedParticipantChanged.remove(callback);
					}
				}
			},

			createParticipantVideoFeed: function() {
				/*	Creates a video feed that displays only a given participant. */

				return window.parent.gapi.hangout.layout.createParticipantVideoFeed();
			},

			displayNotice: function(message, opt_permanent) {
				/*	Displays a notice at the top of the hangout window. */

				return window.parent.gapi.hangout.layout.displayNotice(message, opt_permanent);
			},

			dismissNotice: function() {
				/*	Dismisses the currently displayed notice. */

				return window.parent.gapi.hangout.layout.dismissNotice();
			},

			hasNotice: function() {
				/*	Returns true if a notice is currently being displayed, false otherwise. */

				return window.parent.gapi.hangout.layout.hasNotice();
			},

			getDefaultVideoFeed: function() {
				/*	Returns the DefaultVideoFeed. */

				return window.parent.gapi.hangout.layout.getDefaultVideoFeed();
			},

			getVideoCanvas: function() {
				/*	Returns the VideoCanvas, initially set to the default video feed. */

				return window.parent.gapi.hangout.layout.getVideoCanvas();
			},

			isChatPaneVisible: function() {
				/*	Returns true if a chat pane is visible, false otherwise. */

				return window.parent.gapi.hangout.layout.isChatPaneVisible();
			},

			setChatPaneVisible: function(visible) {
				/*	Shows or hides the chat pane.
					See also: gapi.hangout.layout.onChatPaneVisible
				*/

				return window.parent.gapi.hangout.layout.setChatPaneVisible(visible);
			},

			/////////////////////////////////////////////
			// gapi.hangout.layout Events
			/////////////////////////////////////////////

			onChatPaneVisible: {
				add: function(callback) {
					/*	Adds a callback to be called whenever the chat pane is shown or hidden. */

					return window.parent.gapi.hangout.layout.onChatPaneVisible.add(callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onChatPaneVisible.add. */

					return window.parent.gapi.hangout.layout.onChatPaneVisible.remove(callback);
				}
			},

			onHasNotice: {
				add: function(callback) {
					/*	Adds a callback to be called whenever a notice is either displayed or dismissed.
						The argument to the callback is an event that is true if a notice is 
						currently displayed. 
					*/

					return window.parent.gapi.hangout.layout.onHasNotice.add(callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onHasNotice.add. */

					return window.parent.gapi.hangout.layout.onHasNotice.remove(callback);
				}
			}
		},

		onair: {
			/////////////////////////////////////////////
			// gapi.hangout.onair Functions
			/////////////////////////////////////////////

			isOnAirHangout: function() {
				/*	Returns true if the hangout is a Hangout On Air, false otherwise. 
					Note that this does not indicate that the hangout is currently 
					broadcasting — see isBroadcasting for that. 
				*/

				return window.parent.gapi.hangout.onair.isOnAirHangout();
			},

			isBroadcasting: function() {
				/*	Returns true if the hangout is a Hangout On Air which is currently 
					broadcasting, false otherwise. 
				*/

				return window.parent.gapi.hangout.onair.isBroadcasting();
			},

			/////////////////////////////////////////////
			// gapi.hangout.onair Events
			/////////////////////////////////////////////

			onBroadcastingChanged: {
				add: function(callback) {
					/*	Adds a callback to be called when the hangout starts or stops broadcasting.	*/

					return window.parent.gapi.hangout.onair.onBroadcastingChanged.add(callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onBroadcastingChanged.add. */

					return window.parent.gapi.hangout.onair.onBroadcastingChanged.remove(callback);
				}
			}
		}
	}
}

/////////////////////////////////////////////
// Mimic gadgets.views.getParams() for 
// passing data to the hangout
/////////////////////////////////////////////
function gadgets() {

	// Get querystring value by parameter name.
	// From http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
	var getParameterByName = function(name) {
		var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.parent.location.search);
		return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
	}

	var getHangoutParameter = function(param) {
		var value = getParameterByName(param);
		// Need to return undefined if no data was passed like
		// the real API
		return (value !== null) ? value : undefined;
	}

	return {
		views: {
			getParams: function() {
				return {
					"appData": getHangoutParameter('gd')
				};
			}
		}
	}
}

/////////////////////////////////////////////
// Create an instance of the API client
/////////////////////////////////////////////
window.gapi = new gapi();
window.gadgets = new gadgets();