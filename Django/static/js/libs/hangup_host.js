/*
 * Non-clamped setInterval
 * By Devon Govett (idea from sink.js)
 * MIT LICENSE
 * Obtained from https://gist.github.com/1572489
 */

(function() {
	var BlobBuilder = this.BlobBuilder || this.MozBlobBuilder || this.WebKitBlobBuilder,
		URL = this.URL || this.webkitURL,
		Worker = this.Worker;
	
	this.createTimer = function(fn, interval) {
		if (!BlobBuilder || !URL || !Worker)
			return setInterval(fn, interval);

		var bb = new BlobBuilder;
		bb.append("setInterval(function() { postMessage('ping'); }, " + interval + ");");
		var url = URL.createObjectURL(bb.getBlob());
		
		var worker = new Worker(url);
		worker.onmessage = fn;
		worker.url = url;
		
		return worker;
	}

	this.destroyTimer = function(timer) {
		if (timer.terminate) {
			timer.terminate();
			URL.revokeObjectURL(timer.url);
		}
		else {
			clearInterval(timer);
		}
	}
})();

/*
 * Get paramater by name
 * http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript
 */

function getParameterByName(name) {
	var queryString
	var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
	return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

/////////////////////////////////////////////
// Custom exceptions
/////////////////////////////////////////////
function FeatureNotImplementedException(feature) {
	console.error(feature + ' has not been implemented yet');
}

/////////////////////////////////////////////
// Setup Hangout Host JS.
/////////////////////////////////////////////
function gapi(options) {

	/////////////////////////////////////////////
	// Private Properties
	/////////////////////////////////////////////
	var self = this;
	var defaults = {
		appId: null,
		eventDebugMode: false,
		staticUrl: '/static/',
	};

	var options = _.extend({}, defaults, options);

	var dismissNoticeTimer = null;
	var stateCheckerTimer = null;

	// We need to keep a copy of the last state the current instance of the app. Here we
	// Setup the initial state of the shared state object
	var globalMessageList = null;
	var lastCheckedTime = null;
	
	var lastLocalState = null;
	var localParticipant = null;
	var localParticipantList = null;

	var refreshInterval = 1000;
	var startTime = null;
	var localUiState = {
		isAppVisible: options.appId === getParameterByName('gid'),
		isChatPaneVisible: false
	};
	var sounds = {
		ping: new Audio(options.staticUrl + "/mp3/hangout_alert.mp3")
	};

	/////////////////////////////////////////////
	// Private Getters
	/////////////////////////////////////////////
	var getHostState = function() {
		return JSON.parse(localStorage.getItem('gapi_host_sharedState'));
	};

	var getLocalParticipant = function() {
		return JSON.parse(sessionStorage.getItem('gapi_participant'));
	};

	var getLocalMessageList = function() {
		return JSON.parse(sessionStorage.getItem('gapi_local_messages'));
	};

	var getSharedMessageList = function() {
		return JSON.parse(localStorage.getItem('gapi_shared_messages'));
	};

	var getParticipantList = function(asString) {
		if (_.isUndefined(asString)) {
			asString = false;
		}

		var participants = localStorage.getItem('gapi_participants');

		if (asString) {
			return participants;
		} else {
			return JSON.parse(participants);
		}
	};

	var getSharedState = function() {
		return JSON.parse(localStorage.getItem('gapi_sharedState'));
	};

	/////////////////////////////////////////////
	// Private Setters
	/////////////////////////////////////////////
	var setHostState = function(newState) {
		localStorage.setItem('gapi_host_sharedState', JSON.stringify(newState));
		return;
	};

	var setLocalParticipant = function(participant) {
		sessionStorage.setItem('gapi_participant', JSON.stringify(participant));
		return;
	};

	var setLocalMessageList = function(newMessageList) {
		sessionStorage.setItem('gapi_local_messages', JSON.stringify(newMessageList));
		return;
	};

	var setSharedMessageList = function(newMessageList) {
		localStorage.setItem('gapi_shared_messages', JSON.stringify(newMessageList));
		return;
	};

	var setParticipantList = function(participantList) {
		localStorage.setItem('gapi_participants', JSON.stringify(participantList));
		return;
	};

	var setSharedState = function(newState) {
		localStorage.setItem('gapi_sharedState', JSON.stringify(newState));
		return;
	};

	var updateSharedState = function(newState) {
		if (!_.isObject(newState)) {
			if (window.console && window.console.error) {
				log('Shared state has been corrupted and cannot be saved. This could possibly be caused by a state reset/refresh', 'error');
				stopStateChecking();
			}
		} else {
			lastLocalState = newState;
			setSharedState(newState);
		}
	};

	/////////////////////////////////////////////
	// Private Helper functions
	/////////////////////////////////////////////
	var addStateItem = function(item) {
		var currentState = getHostState();
		
		// Add the timestamp of the event so we can check it later
		item._timestamp = new Date().getTime();

		currentState.push(item);
		
		// Save the shared state
		setHostState(currentState);

		return;
	};

	var checkBrowserSupport = function() {
		// Based on Modernizrs LS & SS tests
		// http://modernizr.com/
		var supports_ls;
		var supports_ss;
		var mod = 'modernizr';

		// Check for localStorage support
		try {
			localStorage.setItem(mod, mod);
			localStorage.removeItem(mod);
			supports_ls = true;
		} catch(e) {
			supports_ls = false;
			throw "Your browser does not support LocalStorage - You need a browser which supports both localStorage and sessionStorage to use hangup.js";
		}

		// Check for sessionStorage support
		try {
			sessionStorage.setItem(mod, mod);
			sessionStorage.removeItem(mod);
			supports_ss = true;
		} catch(e) {
			supports_ss = false;
			throw "Your browser does not support SessionStorage - You need a browser which supports both localStorage and sessionStorage to use hangup.js";
		}

		return;
	};

	var checkParticipants = function() {
		var newParticipantListJSON = getParticipantList();
		var newParticipantListString = JSON.stringify(newParticipantListJSON);
		var eventsToTrigger = {
			onParticipantsAdded: false,
			onParticipantsChanged: false,
			onParticipantsRemoved: false
		};

		// Check if any users left or joined the Hangout
		if (JSON.stringify(localParticipantList) === newParticipantListString) {
			// Nothing changed, No users joined or left, and no user properties changed
		} else {
			// Either the number of participants changed, or one of the users properties changed
			
			if (localParticipantList.length === newParticipantListJSON.length) {
				log('Some participant(s) properties changed');
				// If the number of participants didn't change but some propery of a user did,
				// Trigger an onParticipantsChanged event

				// Flag that we need to trigger an onParticipantsChanged Event.
				eventsToTrigger.onParticipantsChanged = true;

			} else {
				// If the number of participants changed then find the newly joined / left participant(s) 
				// and trigger the appropriate event

				if (localParticipantList.length < newParticipantListJSON.length) {
					// If a participant joined - find who joined and trigger a ParticipantsAddedEvent
					log('Some joined the Hangout [' + newParticipantListJSON.length + ']');
					var newlyAddedParticipants = _.filter(newParticipantListJSON, function(currentParticipant) {

						var isNewParticipant = true;

						// For each participant in the old participant list check if they are
						// in the new participant list
						_.each(localParticipantList, function(previousParticipant) {
							if (currentParticipant.id === previousParticipant.id) {
								isNewParticipant = false;
							}
						});		

						return isNewParticipant;
					});

					if (!_.isUndefined(newlyAddedParticipants)) {
						// If some participants joined, trigger an onParticipantsAdded event
						
						// Update the local copy of the participant list with the new changes
						localParticipantList = newParticipantListJSON;

						// Flag that we need to trigger an onParticipantsAdded Event
						eventsToTrigger.onParticipantsAdded = true;
						eventsToTrigger.onParticipantsChanged = true;

					} else {
						log('It looks like someone joined hte hangout but we couldn\'t determine who it was!', 'error');
					}
				} else {
					// If a participant left
					console.log('Some left the Hangout [' + newParticipantListJSON.length + ']');
					var newlyLeftParticipants = _.filter(localParticipantList, function(previousParticipant) {
						var isRemovedParticipant = true;

						// For each participant in the new participant list check if they were
						// in the previous participant list
						_.each(newParticipantListJSON, function(currentParticipant) {
							if (currentParticipant.id === previousParticipant.id) {
								isRemovedParticipant = false;
							}
						});

						return isRemovedParticipant;
					});

					if (!_.isUndefined(newlyLeftParticipants)) {
						// If some participants left, trigger an onParticipantsRemoved

						// Flag that we need to trigger an onParticipantsRemoved Event\
						eventsToTrigger.onParticipantsRemoved = true;
						eventsToTrigger.onParticipantsChanged = true;

					} else {
						log('It looks like someone left hte hangout but we couldn\'t determine who it was!', 'error');
					}
				}
			}

			// Update the local copy of the participant list with the new changes
			localParticipantList = newParticipantListJSON;

			// Trigger any necessary events
			_.each(eventsToTrigger, function(trigger, eventName) {
				if (trigger) {
					var triggerData = {};

					if (eventName === 'onParticipantsChanged') {
						triggerData = { participants: newParticipantListJSON };
					} else if (eventName === 'onParticipantsAdded') {
						triggerData = { addedParticipants: newlyAddedParticipants };
					} else if (eventName === 'onParticipantsRemoved') {
						triggerData = { removedParticipants: newlyLeftParticipants } ;
					} else {
						log('[checkParticipants] Unknown event name', 'error');
					}

					// Trigger the event
					self.trigger('gapi.hangout.' + eventName, triggerData);
				}
			});
		}
		// TODO: Remove this 
		$('#participant-count').text(newParticipantListJSON.length);
	};

	var checkHostChanges = function() {
		/////////////////////////////////////////////
		// Check host UI state for changes
		/////////////////////////////////////////////

		var hostState = getHostState();

		if (hostState === null) {
			setHostState([]);
		}
		else {
			for (var itemIndex = hostState.length; itemIndex > 0; itemIndex--) {
				var item = hostState[itemIndex - 1];

				// If the event occured after the page was loaded, and since the last checked time
				if (item._timestamp > startTime && item._timestamp > lastCheckedTime) {

					if (item._type === 'displayNotice') {
						ui.displayNotice(item.message, item.opt_permanent);
					}
					if (item._type === 'dismissNotice') {
						ui.dismissNotice();
					}
				}
				else {
					break;
				}
			}
		}

		return;
	};

	var clearSharedState = function() {
		setSharedState({});
	};

	var computeSharedStateDifference = function(oldState, newState) {
		var changed = [];
		var removed = [];
		var prop;

		if (!_.isObject(oldState) || !_.isObject(newState)) {
			stopStateChecking();
			throw "Error: Cannot read the shared state object";
		}

		for (prop in oldState) {
			if(!(prop in newState)) {

				// If the property existed in the old state but doesn't in the
				// new, then it was removed
				removed.push(prop);
			} else {
				
				// If the property exists in both states, compare them
				if (oldState[prop] !== newState[prop]) {
					changed.push({
						"key": prop,
						"value": newState[prop],
						"timestamp": "",
						"timediff": ""
					});
				}
			}
		}
		
		// Check for properties in the newState but not in the oldState
		for (prop in newState) {
			if (!(prop in oldState)) {
				changed.push({
					"key": prop,
					"value": newState[prop],
					"timestamp": "",
					"timediff": ""
				});
			}
		}

		return {
			'changed': changed,
			'removed': removed
		}
	};

	var checkSharedStateChanges = function() {
		
		var latestSharedState = hangout.data.getState();
		var diff = computeSharedStateDifference(lastLocalState, latestSharedState);

		// There were no changes in the sate
		if (diff.changed.length === 0 && diff.removed.length === 0) {
			// console.log('Nothings changed');
		} else {
			// console.log('Changes!');
			// Something changed the state
			lastLocalState = latestSharedState;

			// Trigger a state changed event
			self.trigger('gapi.hangout.data.onStateChanged', { 'addedKeys': diff.changed, 'metadata': {}, 'removedKeys': diff.removed, 'state': latestSharedState });
		}
	};

	var checkForMessages = function() {
		// Check for new messages
		var sharedMessageList = getSharedMessageList();
		var localMessageList = getLocalMessageList();

		for (var messageIndex = sharedMessageList.length - 1; messageIndex >= 0; messageIndex--) {
			var message =  sharedMessageList[messageIndex];
			
			// If the message isnt in the local list
			if (localMessageList.length === 0 || message._timestamp > localMessageList[localMessageList.length - 1]._timestamp) {
				
				localMessageList.push(message);
				setLocalMessageList(localMessageList);

				// Trigger the onMessageReceived event for all participants who aren't the message sender
				if (message.senderId !== hangout.getParticipantId()) {
					self.trigger('gapi.hangout.data.onMessageReceived', message);
				}
				
			} else {
				// We've covered all new messages, don't iterate over ones we've seen before
				break;
			}
		}
	};

	var checkState = function() {
		// This function is called in a loop and is responsible for check everything
		// that needs to be monitored for changes
		if (stateCheckerTimer !== null) {
			destroyTimer(stateCheckerTimer);		
		}

		checkHostChanges();
		checkSharedStateChanges();
		checkForMessages();
		checkParticipants();

		// Update the last checked time
		lastCheckedTime = new Date().getTime();

		// Schedule the next check
		stateCheckerTimer = createTimer(checkState, 1000);
	};

	var ensureCurrentUser = function(currentParticipant) {
		// Add the user to the shared participant list if required
		var existingParticipants = hangout.getParticipants();

		var existingParticipant = _.find(existingParticipants, function(participant) {
			return participant.id === currentParticipant.id;
		});

		if (_.isUndefined(existingParticipant)) {
			existingParticipants.push(currentParticipant);

			// Store the new participant in the shared participant List
			setParticipantList(existingParticipants);

			localParticipantList = existingParticipants;
		}
	};

	var ready = function() {
		self.trigger('gapi.hangout.onApiReady', { isApiReady: true });
	};

	var removeUsers = function(userIdsToRemove) {
		// Get the current list of users
		var originalParticipants = getParticipantList();

		var remainingParticipants = _.filter(originalParticipants, function(participant) {
			// Check if the current participants ID is in the userIdsToRemove array
			if (_.include(userIdsToRemove, participant.id)) {
				// If the user was requested to be removed, don't let them
				// pass the filter
				return false;
			} else {
				// The user isn't to be removed, keep them in the remainingParticipants list
				return true;
			}
		});
		
		// Update the list of participants in localStorage
		setParticipantList(remainingParticipants);
	};

	var stopStateChecking = function() {
		destroyTimer(stateCheckerTimer);
	};

	/////////////////////////////////////////////
	// UI / DOM update functions
	/////////////////////////////////////////////
	ui = {
		displayNotice: function(message, opt_permanent) {
			/*	Displays a notice at the top of the hangout window. */
			if (dismissNoticeTimer !== null) {
				destroyTimer(dismissNoticeTimer);
			}

			if (_.isUndefined(opt_permanent)) {
				opt_permanent = false;
			}

			if (opt_permanent !== true) {
				dismissNoticeTimer = createTimer(function() {
					hangout.layout.dismissNotice();
				}, 5000);
			}

			$notice = $('#hangout-message');
			$notice.text(message);
			$('#hangout-message').removeClass('hidden');

			// Play the alert sound
			sounds.ping.play()
		},

		dismissNotice: function() {
			/*	Displays a notice at the top of the hangout window. */
			if (dismissNoticeTimer !== null) {
				destroyTimer(dismissNoticeTimer);
			}

			$notice = $('#hangout-message');
			$('#hangout-message').addClass('hidden');
		},

		hideApp: function() {
			localUiState.isAppVisible = false;

			$('body').removeClass('app-visible');

			// Deselect the app menu button
			var $appButton = $('.button-hangout-app').removeClass('is-selected');

			self.trigger('gapi.hangout.onAppVisible', {
				isAppVisible: localUiState.isAppVisible
			});
		},

		showApp: function() {
			localUiState.isAppVisible = true;

			$('body').addClass('app-running app-visible');

			// Change app button state in the toolbar
			var $appButton = $('.button-hangout-app').addClass('is-selected');

			self.trigger('gapi.hangout.onAppVisible', {
				isAppVisible: localUiState.isAppVisible
			});
		}
	}

	var initialize = function() {

		// Check browser for required functionality
		checkBrowserSupport();

		/////////////////////////////////////////////
		// Setup participiant related functionality
		/////////////////////////////////////////////

		// Get the local participant or create a new participant if one
		// doesn't already exist.
		localParticipant = getLocalParticipant();

		// Get the shared participant list from localStorage if available.
		localParticipantList = getParticipantList();

		if (localParticipantList === null) {
			setParticipantList([]);
			localParticipantList = [];
		}

		/////////////////////////////////////////////
		// Setup shared state functionality
		/////////////////////////////////////////////

		lastLocalState = getSharedState();

		// If there was no last shared state in localStorage, initalise one.
		if (lastLocalState === null) {
			setSharedState({});
			lastLocalState = {};
		}

		/////////////////////////////////////////////
		// Setup message functionality
		/////////////////////////////////////////////

		globalMessageList = getSharedMessageList();

		// If there was no shared message list in localStorage, initalise one. 
		if (globalMessageList === null) {
			globalMessageList = [];
			setSharedMessageList([]);
		}

		// Store the message list locally so we can compare to global when
		// checking for updates
		setLocalMessageList(globalMessageList);
		
		// If there is no participant object for the current "user", create one
		if (_.isNull(localParticipant)) {
			var userId = '' + Math.floor(Math.random() * 10000) + '';
			var currentParticipant = {
				id: userId,
				displayIndex: 0,
				hasMicrophone: true,
				hasCamera: true,
				hasAppEnabled: true,
				person: {
					displayName: 'Demo User ' + userId,
					id: '100235951976314656457',
					image: {
						url: 'https://lh4.googleusercontent.com/-9XNUyUY6Fdo/AAAAAAAAAAI/AAAAAAAAAAA/wzv0O-UdNOM/s96-c/photo.jpg'
					}
				}
			}

			// No user for the session, create one in SessionStorage
			setLocalParticipant(currentParticipant);
			ensureCurrentUser(currentParticipant);

		} else {
			// If a current "user" already exists, get it from SessionStorage
			var currentParticipant = getLocalParticipant();

			// Check that the user is in the shared partipant list and if not, add them
			ensureCurrentUser(currentParticipant);
		}

		/////////////////////////////////////////////
		// Setup shared UI state
		/////////////////////////////////////////////
		var initialHostState = getHostState();
		if (initialHostState == null) {
			setHostState([]);
		}

		startTime = new Date().getTime();

		// Setup a timer to check for changes in the shared state object,
		// new messages and updates to the UI state
		stateCheckerTimer = createTimer(function() {
			checkState();
		}, refreshInterval);

		window.onbeforeunload = function() {
			// Remove the current participant from the participant list
			removeUsers([getLocalParticipant().id]);

			// Clear timers
			if (dismissNoticeTimer !== null) {
				destroyTimer(dismissNoticeTimer);
			}

			if (stateCheckerTimer !== null) {
				destroyTimer(stateCheckerTimer);
			}

			if (gapi._clearData) {
				localStorage.clear();
				sessionStorage.clear();
			}

			return;
		}
	};

	var log = function(message, level) {
		// Mini log wrapper
		if (_.isUndefined(level)) {
			level = 'log';
		}

		if (window.console) {
			if (typeof(window.console[level]) === 'function') {
				window.console[level](message);	
			} else if (window.console.log) {
				window.console.log('[' + level.toUpperCase + '] ' + message);
			}
		}

		return;
	};

	/////////////////////////////////////////////
	// Event binding and triggering functionality
	// from Backbone.js and lightly adapted.
	/////////////////////////////////////////////
	this.on = function(eventName, callback, context) {

		var calls, node, tail, list;
		if (!callback) return this;

		calls = this._callbacks || (this._callbacks = {});

		list = calls[eventName];
		node = list ? list.tail : {};
		node.next = tail = {};
		node.context = context;
		node.callback = callback;
		calls[eventName] = {tail: tail, next: list ? list.next : node};

		return this;
	};

	this.off = function(eventName, callback, context) {
		var calls, node, tail, cb, ctx;

		// No events, or removing *all* events.
		if (!(calls = this._callbacks)) return;
		if (!(eventName || callback || context)) {
			delete this._callbacks;
			return this;
		}

		node = calls[eventName];
		delete calls[eventName];
		if (!node || !(callback || context)) return this;
		// Create a new list, omitting the indicated callbacks.
		tail = node.tail;
		while ((node = node.next) !== tail) {
			cb = node.callback;
			ctx = node.context;
			if ((callback && cb !== callback) || (context && ctx !== context)) {
				this.on(eventName, cb, ctx);
			}
		}

		return this;
	};

	this.trigger = function(eventName) {
		var node, calls, tail, args, all, rest;
		if (!(calls = this._callbacks)) return this;
		all = calls.all;
		rest = Array.prototype.slice.call(arguments, 1);

		// Walk through the linked list of callbacks for the event
		if (node = calls[eventName]) {
			tail = node.tail;
			if (options.eventDebugMode) {
				while ((node = node.next) !== tail) {
					node.callback.apply(node.context || this, rest);
				}
			} else {
				try {
					while ((node = node.next) !== tail) {
						node.callback.apply(node.context || this, rest);
					}
				} catch (e) {
					log('Caught exception while dispatching event: ' + eventName);
				}
			}
		}

		return this;
	};

	/////////////////////////////////////////////
	// Implement the Hangouts API
	/////////////////////////////////////////////
	var hangout = {
		/////////////////////////////////////////////
		// gapi.hangout Functions
		/////////////////////////////////////////////

		getEnabledParticipants: function() {
			/*	Gets the participants who have enabled the app. */

			// TODO: Implement
			throw new FeatureNotImplementedException('gapi.hangout.getEnabledParticipants');
			return;
		},

		getHangoutUrl: function() {
			/*	Gets the URL for the hangout. Example URL: 
				'https://hangoutsapi.talkgadget.google.com/hangouts/1b8d9e10742f576bc994e18866ea'
			*/

			// TODO: Implement
			throw new FeatureNotImplementedException('gapi.hangout.getHangoutUrl');
			return;
		},

		getHangoutId: function() {
			/*	Gets an identifier for the hangout guaranteed to be unique for the hangout's duration.
				The API makes no other guarantees about this identifier. Example of hangout id:
				'muvc-private-chat-99999a93-6273-390d-894a-473226328d79@groupchat.google.com' 
			*/

			// TODO: Implement
			throw new FeatureNotImplementedException('gapi.hangout.getHangoutId');
			return;
		},

		getLocale: function() {
			/*	Gets the locale for the participant in the hangout.
				Example: 'en-US' 
			*/

			// TODO: Implement
			throw new FeatureNotImplementedException('gapi.hangout.getLocale');
			return;
		},

		getStartData: function() {
			/*	Gets the starting data for the current active app. This is the data passed in 
				by the gd URL parameter (also available with gadgets.views.getParams). 
				Returns null if no start data has been specified. 
			*/

			// TODO: Implement
			throw new FeatureNotImplementedException('gapi.hangout.getStartData');
			return;
		},

		getParticipantById: function(participantId) {
			/*	Gets the participant with the given id. Returns null if no participant exists 
				with the given id.
			*/

			var participantList = hangout.getParticipants();
			var requestedParticipant = _.find(participantList, function(participant) {
				return participant.id === participantId;
			});

			// If the requested participant couldn't be found in the shared participant list
			// return null as per the real API...
			if (_.isUndefined(requestedParticipant)) {
				return null;
			}

			// ... Otherwise return the participant object
			return requestedParticipant;
		},

		getParticipantId: function() {
			/*	Gets the id of the local participant. A user is assigned a new id each time 
				they join a hangout. 
				Example: 'hangout65A4C551_ephemeral.id.google.com^354e9d1ed0' 
			*/

			return getLocalParticipant().id;
		},

		getParticipants: function() {
			/*	Gets the participants in the hangout. Note that the list of participants reflects 
				the current state on the hangouts server. There may be a small window of time where
				the local participant (returned from getParticipantId()) is not in the returned array.
			*/
			return localParticipantList;
		},

		hideApp: function() {
			/*	Hide the app and show the video feed in the main hangout window. The app will continue
				to run while it is hidden.
				See also: gapi.hangout.onAppVisible
			*/

			ui.hideApp();
			return;
		},

		isApiReady: function() {
			/*	Returns true if the gapi.hangout API is initialized; false otherwise. Before the API is 
				initialized, data values may have unexpected values.
			*/
			
			// TODO: Implement
			throw new FeatureNotImplementedException('gapi.hangout.isApiReady');
			return;
		},

		isAppVisible: function() {
			/*	Returns true if the app is visible in the main hangout window, false otherwise.	*/
			
			return localUiState.isAppVisible;
		},

		isPublic: function() {
			/* Returns true if the hangout is open to the public false otherwise. */
			
			// TODO: Implement
			throw new FeatureNotImplementedException('gapi.hangout.isPublic');
			return;
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

				self.on('gapi.hangout.onApiReady', callback);
			},

			remove: function(callback) {
				/*	Removes a callback previously added by onApiReady.add. */

				self.off('gapi.hangout.onApiReady', callback);
			}
		},

		onAppVisible: {
			add: function(callback) {
				/*	Adds a callback to be called when the app is shown or hidden. The argument
					to the callback is an event that holds the state that indicates whether 
					the app is visible or not. See also: gapi.hangout.hideApp
				*/

				self.on('gapi.hangout.onAppVisible', callback);
				return;
			},

			remove: function(callback) {
				/* Removes a callback previously added by onAppVisible.add. */

				self.off('gapi.hangout.onAppVisible', callback);
			}
		},

		onEnabledParticipantsChanged: {
			add: function(callback) {
				/*	Adds a callback to be called whenever the set of "participants with the app
					enabled" changes. The argument to the callback is an event that holds all 
					participants who have enabled the app since the last time the event fired.
				*/

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onEnabledParticipantsChanged.add');
				return;
			},

			remove: function(callback) {
				/* Removes a callback previously added by onEnabledParticipantsChanged.add. */

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onEnabledParticipantsChanged.remove');
				return;
			}
		},

		onParticipantsAdded: {
			add: function(callback) {
				/*	Adds a callback to be called whenever participants join the hangout. The 
					argument to the callback is an event that holds the particpants who have
					joined since the last time the event fired.
				*/

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onParticipantsAdded.add');
				return;
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsAdded.add. */

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onParticipantsAdded.remove');
				return;
			}
		},

		onParticipantsChanged: {
			add: function(callback) {
				/*	Adds callback to be called whenever there is any change in the participants
					in the hangout. The argument to the callback is an event that holds holds
					the participants currently in the hangout.
				*/

				self.on('gapi.hangout.onParticipantsChanged', callback);
				return;
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsChanged.add. */

				self.off('gapi.hangout.onParticipantsChanged', callback);
				return;
			}
		},

		onParticipantsDisabled: {
			add: function(callback) {
				/*	Adds a callback to be called whenever participants disable this app.
					The argument to the callback is an event that holds the participants
					who have disabled the app since the last time the event fired.
				*/

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onParticipantsDisabled.add');
				return;
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsDisabled.add. */

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onParticipantsDisabled.remove');
				return;
			}
		},

		onParticipantsEnabled: {
			add: function(callback) {
				/*	Adds a callback to be called whenever a participant in the hangout
					enables this app. The argument to the callback is an event that
					holds the set of participants who have enabled the app since the
					last time the event fired.
				*/

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onParticipantsEnabled.add');
				return;
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsEnabled.add. */

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onParticipantsEnabled.remove');
				return;
			}
		},

		onParticipantsRemoved: {
			add: function(callback) {
				/*	Adds a callback to be called whenever participants leave the hangout.
					The argument to the callback is an event that holds the participants
					who have left since the last time the event fired.
				*/

				self.on('gapi.hangout.onParticipantsRemoved', callback);
				return;
			},

			remove: function(callback) {
				/* Removes a callback previously added by onParticipantsRemoved.add. */

				self.off('gapi.hangout.onApiReady', callback);
				return;
			}
		},

		onPublicChanged: {
			add: function(callback) {
				/*	Adds a callback to be called when the hangout becomes public. 
					A hangout can change only from private to public.
				*/

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onPublicChanged.add');
				return;
			},

			remove: function(callback) {
				/* Removes a callback previously added by onPublicChanged.add. */

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.onPublicChanged.remove');
				return;
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
				hangout.data.submitDelta({}, [key]);
				return;
			},

			getKeys: function() {
				/*	Gets the keys in the shared state object, an array of strings. */

				return _.keys(hangout.data.getState());
			},

			getValue: function(key) {
				/*	Gets the value for a given key. */

				// Get the provided value from the shared state object
				var sharedState = getSharedState();
				var requestedValue = sharedState[key];

				return requestedValue;
			},

			getState: function() {
				/*	Gets the shared state object, a set of name/value pairs. */

				return getSharedState();
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

				// TODO: Implement
				throw new FeatureNotImplementedException('gapi.hangout.data.getStateMetadata');
				return;
			},

			setValue: function(key, value) {
				/*	Sets a single key value pair.
					See also: gapi.hangout.data.onStateChanged
				*/

				if (!_.isString(value)) {
					throw "setValue value parameter must be a valid string";
				}

				// Proxy the keys to be altered through to submitDelta to handle
				// the changes to the shared state object.
				var changes = {};
				changes[key] = value;

				hangout.data.submitDelta(changes, []);

				return;
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

				if (!_.isString(message)) {
					throw "sendMessage parameter must be a string.  Found non-string ";
				}

				// Get the existing global messages from localStorage
				var existingGlobalMessages = getSharedMessageList();
				
				// Get the existing local messages from sessionStorage
				var existingLocalMessages = getLocalMessageList();

				// Create the message object 
				var messageObject = {
					'_timestamp': new Date().getTime(),
					'senderId': hangout.getParticipantId(),
					'message': message
				};

				existingGlobalMessages.push(messageObject);

				// Save the new message to the shared message list 
				setSharedMessageList(existingGlobalMessages);
			
				if (messageObject.senderId !== hangout.getParticipantId()) {
					self.trigger('gapi.hangout.data.onMessageReceived', messageObject);
				}
			},

			submitDelta: function(opt_updates, opt_removes) {
				/*	Submits a request to update the value of the shared state object.
					See also: gapi.hangout.data.onStateChanged
				*/

				var changed = [];
				var removed = [];

				var newState = hangout.data.getState();

				// Add / Change the requested values
				_.each(opt_updates, function(value, key) {
					// Build up and array of added or changed values for the onStateChange
					// event. From the hangout API docs:
					// 		"The first parameter of the callback contains an array of values 
					//		 added to the shared state object. Each added value includes the 
					// 		 following members:
					//			key: the key being added.
					//			value: the new value being set.
					//			timestamp: The server time that the key/value was most recently updated.
					//			timediff: The difference in time on the server between the current time 
					//					  and the time the key/value was most recently updated."

					// Ensure the provided values conform to the spec
					if (!_.isString(value)) {
						log('Value "' + value + '" for key "' + key + '" must be a string. Found "' + typeof(value) + '".');
						return;
					}

					changed.push({ 
						'key': key,
						'value': value,
						'timestamp': new Date().getTime(),
						'timediff': 0
					});

					newState[key] = value;
				});

				// Remove values to be removed
				_.each(opt_removes, function(keyName) {
					// Build up an array of removed values for the onStateChange event.
					// From the hangout API docs: 
					//		"The second parameter to the callback contains an array of
					//		 key names that have been removed from the shared state object."

					removed.push(keyName);
					delete newState[keyName];
				});

				// Store the changes in the shared state variable. The shared state is always
				// stored as a string as per the actual hangouts API
				updateSharedState(newState);

				// Update the internal last local state so that the changes don't get picket up
				// again by the state checking loop.
				lastLocalState = newState;

				// TODO: Implement the fourth param (shared state meta data)
				self.trigger('gapi.hangout.data.onStateChanged', { 'addedKeys': changed, 'metadata': {}, 'removedKeys': removed, 'state': newState });
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
					self.on('gapi.hangout.data.onMessageReceived', callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onMessageReceived.add. */

					self.off('gapi.hangout.data.onMessageReceived', callback);
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

					self.on('gapi.hangout.data.onStateChanged', callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onStateChanged.add. */

					self.off('gapi.hangout.data.onStateChanged', callback);
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

						throw new FeatureNotImplementedException('gapi.hangout.layout.DefaultVideoFeed.onDisplayedParticipantChanged.add');
						return;
					}, 

					remove: function(callback) {
						/*	Removes a callback added by onDisplayedParticipantChanged.add. */

						throw new FeatureNotImplementedException('gapi.hangout.layout.DefaultVideoFeed.onDisplayedParticipantChanged.remove');
						return;
					}
				}
			},

			createParticipantVideoFeed: function() {
				/*	Creates a video feed that displays only a given participant. */

				throw new FeatureNotImplementedException('gapi.hangout.layout.createParticipantVideoFeed');
				return;
			},

			displayNotice: function(message, opt_permanent) {
				/* Add the event to the shared state UI object so other windows are notified */
				addStateItem({
					_type: 'displayNotice',
					message: message,
					opt_permanent: opt_permanent
				});
			},

			dismissNotice: function() {
				addStateItem({
					_type: 'dismissNotice'
				});
			},

			hasNotice: function() {
				/*	Returns true if a notice is currently being displayed, false otherwise. */

				var $notice = $('#hangout-message');
				return !$notice.hasClass('hidden');
			},

			getDefaultVideoFeed: function() {
				/*	Returns the DefaultVideoFeed. */

				throw new FeatureNotImplementedException('gapi.hangout.layout.getDefaultVideoFeed');
				return;
			},

			getVideoCanvas: function() {
				/*	Returns the VideoCanvas, initially set to the default video feed. */

				throw new FeatureNotImplementedException('gapi.hangout.layout.getVideoCanvas');
				return;
			},

			isChatPaneVisible: function() {
				/*	Returns true if a chat pane is visible, false otherwise. */

				throw new FeatureNotImplementedException('gapi.hangout.layout.isChatPaneVisible');
				return;
			},

			setChatPaneVisible: function(visible) {
				/*	Shows or hides the chat pane.
					See also: gapi.hangout.layout.onChatPaneVisible
				*/

				throw new FeatureNotImplementedException('gapi.hangout.layout.setChatPaneVisible');
				return;
			},

			/////////////////////////////////////////////
			// gapi.hangout.layout Events
			/////////////////////////////////////////////

			onChatPaneVisible: {
				add: function(callback) {
					/*	Adds a callback to be called whenever the chat pane is shown or hidden. */

					on('gapi.hangout.layout.onChatPaneVisible', callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onChatPaneVisible.add. */

					off('gapi.hangout.layout.onChatPaneVisible', callback);
				}
			},

			onHasNotice: {
				add: function(callback) {
					/*	Adds a callback to be called whenever a notice is either displayed or dismissed.
						The argument to the callback is an event that is true if a notice is 
						currently displayed. 
					*/

					on('gapi.hangout.layout.onHasNotice', callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onHasNotice.add. */

					off('gapi.hangout.layout.onHasNotice', callback);
				}
			},
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

				throw new FeatureNotImplementedException('gapi.hangout.onair.isonairHangout');
				return;
			},

			isBroadcasting: function() {
				/*	Returns true if the hangout is a Hangout On Air which is currently 
					broadcasting, false otherwise. 
				*/

				throw new FeatureNotImplementedException('gapi.hangout.onair.isBroadcasting');
				return;
			},

			/////////////////////////////////////////////
			// gapi.hangout.onair Events
			/////////////////////////////////////////////

			onBroadcastingChanged: {
				add: function(callback) {
					/*	Adds a callback to be called when the hangout starts or stops broadcasting.	*/

					self.on('gapi.hangout.layout.onHasNotice', callback);
				},

				remove: function(callback) {
					/*	Removes a callback previously added by onBroadcastingChanged.add. */

					self.off('gapi.hangout.layout.onHasNotice', callback);
				}
			}
		}
	};

	// Fire off initalization
	initialize();

	// Return the public interface
	return {
		/////////////////////////////////////////////
		// Public Properties - These do not exist
		// in the realy Hangouts API but can be 
		// useful for development
		/////////////////////////////////////////////
		_checkState: checkState,
		_isEmulated: true,
		_options: options,
		_ready: ready,
		_ui: {
			hideApp: ui.hideApp,
			showApp: ui.showApp
		},

		/////////////////////////////////////////////
		// Public Properties and methods replicating
		// the Google Hangouts API
		/////////////////////////////////////////////
		hangout: {
			getEnabledParticipants: hangout.getEnabledParticipants,
			getHangoutUrl: hangout.getHangoutUrl,
			getHangoutId: hangout.getHangoutId,
			getLocale: hangout.getLocale,
			getStartData: hangout.getStartData,
			getParticipantById: hangout.getParticipantById,
			getParticipantId: hangout.getParticipantId,
			getParticipants: hangout.getParticipants,
			hideApp: hangout.hideApp,
			isApiReady: hangout.isApiReady,
			isAppVisible: hangout.isAppVisible,
			isPublic: hangout.isPublic,
			onApiReady: hangout.onApiReady,
			onAppVisible: hangout.onAppVisible,
			onEnabledParticipantsChanged: hangout.onEnabledParticipantsChanged,
			onParticipantsAdded: {
				add: hangout.onParticipantsAdded.add,
				remove: hangout.onParticipantsAdded.remove
			},
			onParticipantsChanged: {
				add: hangout.onParticipantsChanged.add,
				remove: hangout.onParticipantsChanged.remove
			},
			onParticipantsDisabled: {
				add: hangout.onParticipantsDisabled.add,
				remove: hangout.onParticipantsDisabled.remove
			},
			onParticipantsEnabled: {
				add: hangout.onParticipantsEnabled.add,
				remove: hangout.onParticipantsEnabled.remove
			},
			onParticipantsRemoved: {
				add: hangout.onParticipantsRemoved.add,
				remove: hangout.onParticipantsRemoved.remove
			},
			onPublicChanged: {
				add: hangout.onPublicChanged.add,
				remove: hangout.onPublicChanged.remove
			},
			av: {
				// None of this stuff is implemented
				// TODO: Implement stubby functions
				effects: {

				}
			},
			data: {
				clearValue: hangout.data.clearValue,
				getKeys: hangout.data.getKeys,
				getValue: hangout.data.getValue,
				getState: hangout.data.getState,
				getStateMetadata: hangout.data.getStateMetadata,
				setValue: hangout.data.setValue,
				submitDelta: hangout.data.submitDelta,
				sendMessage: hangout.data.sendMessage,
				onMessageReceived: {
					add: hangout.data.onMessageReceived.add,
					remove: hangout.data.onMessageReceived.remove
				},
				onStateChanged: {
					add: hangout.data.onStateChanged.add,
					remove: hangout.data.onStateChanged.remove
				}
			},
			layout: {
				createParticipantVideoFeed: hangout.layout.createParticipantVideoFeed,
				dismissNotice: hangout.layout.dismissNotice,
				displayNotice: hangout.layout.displayNotice,
				getDefaultVideoFeed: hangout.layout.getDefaultVideoFeed,
				getVideoCanvas: hangout.layout.getVideoCanvas,
				hasNotice: hangout.layout.hasNotice,
				isChatPaneVisible: hangout.layout.isChatPaneVisible,
				setChatPaneVisible: hangout.layout.setChatPaneVisible,
				onChatPaneVisible: {
					add: hangout.layout.onChatPaneVisible.add,
					remove: hangout.layout.onChatPaneVisible.remove
				},
				onHasNotice: {
					add: hangout.layout.onHasNotice.add,
					remove: hangout.layout.onHasNotice.remove	
				}
			},
			onair: {
				isonairHangout: hangout.onair.isonairHangout,
				isBroadcasting: hangout.onair.isBroadcasting,
				onBroadcastingChanged: {
					add: hangout.onair.onBroadcastingChanged.add,
					remove: hangout.onair.onBroadcastingChanged.remove
				}
			}
		}
	}
};

/////////////////////////////////////////////
// Setup Hangout UI
/////////////////////////////////////////////
$(document).ready(function() {
	function startApp() {
		var appFrame = document.getElementById('user-hangout-app');
		appFrame.onload = function() {
			gapi._ready();
		};
		
		if (appFrame.src === 'about:blank') {
			appFrame.src = "/" + '?' + $(appFrame).data('qs');
		}
		gapi._ui.showApp();
	}

	/////////////////////////////////////////////
	// Setup Hangout UI buttons.
	/////////////////////////////////////////////
	(function(window, document) {
		var $hangoutToolbar = $('.hangout-toolbar');
		var $developerToolbar = $('.developer-toolbar');
		var $reloadButton = $developerToolbar.find('.button-reload');
		var $resetButton = $developerToolbar.find('.button-reset');
		var $appButton = $hangoutToolbar.find('.button-hangout-app');
		var appIframe = document.getElementById('user-hangout-app');

		// Setup reload and refresh buttons
		$reloadButton.click(function() {
			gapi._clearData = false;
			window.location.reload();
		});

		$resetButton.click(function() {
			gapi._clearData = true;
			window.location.reload();
		});

		// Setup showing and hiding of app
		$appButton.click(function() {
			var appAlreadyVisible = gapi.hangout.isAppVisible();
			if (appAlreadyVisible) {
				
				// If the app is already visible, hide it
				gapi._ui.hideApp();
			} else {

				// Otherwise show the app
				startApp();
			}
		});

		// Auto start the app if required
		if (gapi._options.appId === getParameterByName('gid')) {
			startApp();
		}
	})(window, document, undefined);
});