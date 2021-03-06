Balanced.Auth = (function () {
<<<<<<< HEAD
    var defaultBalancedAuthOptions = {
        baseUrl: ENV.BALANCED.AUTH,
        signInEndPoint: '/logins',
        signOutEndPoint: '/logins/current',

        tokenKey: 'AA111',
        tokenIdKey: 'AA111_c:b8:cb:19:25:40:4a:82:e8:d2:4d:cc:1f:c2:f7:c3',
        userModel: 'Balanced.User',

        // We're using the cookie, so Ember Auth doesn't need to worry about the token
        tokenLocation: 'none',
        sessionAdapter: 'cookie',
        modules: ['authRedirectable'],
        authRedirectable: {
            route: 'login'
        }
    };

    var auth = Ember.Auth.create(_.extend(defaultBalancedAuthOptions, window.BalancedAuthOptions));

    auth.setAuthProperties = function (signedIn, user, userId, authToken, isGuest) {
        auth.set('_strategy.adapter.authToken', authToken);
        auth.set('_session.userId', userId);
        auth.set('_session.signedIn', signedIn);
        auth.set('_session.user', user);
        auth.set('isGuest', isGuest);
    };

    auth.rememberLogin = function (token) {
        $.cookie(Balanced.COOKIE.EMBER_AUTH_TOKEN, token, {
            expires: 1,
            path: '/'
        });
    };

    auth.forgetLogin = function () {
        // Removing from the root domain since we were setting it on the root
        // domain for a while. This line can be removed after Aug 23, 2013
        $.removeCookie(Balanced.COOKIE.EMBER_AUTH_TOKEN, {
            path: '/',
            domain: 'balancedpayments.com'
        });

        $.removeCookie(Balanced.COOKIE.EMBER_AUTH_TOKEN, {
            path: '/'
        });
        auth.destroyGuestUser();
    };

    auth.retrieveLogin = function () {
        return $.cookie(Balanced.COOKIE.EMBER_AUTH_TOKEN);
    };

    function loginGuestUser(apiKeySecret) {
        var guestUser = Balanced.User.create({
            user_marketplaces: Ember.A()
        });
        auth.setAuthProperties(true, guestUser, '/users/guest', apiKeySecret, true);
        setAPIKey(apiKeySecret);
    }

    function setAPIKey(apiKeySecret) {
        Balanced.NET.ajaxHeaders['Authorization'] = 'Basic ' + window.btoa(apiKeySecret + ':');
    }

    function unsetAPIKey() {
        delete Balanced.NET.ajaxHeaders['Authorization'];
    }

    function loadGuestAPIKey() {
        return $.cookie(Balanced.COOKIE.API_KEY_SECRET);
    }

    function initGuestUser() {
        var apiKeySecret = loadGuestAPIKey();
        if (apiKeySecret) {
            loginGuestUser(apiKeySecret);
        }
    }

    auth.storeGuestAPIKey = function (apiKeySecret) {
        $.cookie(Balanced.COOKIE.API_KEY_SECRET, apiKeySecret, {
            path: '/'
        });
        loginGuestUser(apiKeySecret);
    };

    auth.getGuestAPIKey = function() {
        return loadGuestAPIKey();
    };

    auth.destroyGuestUser = function () {
        $.removeCookie(Balanced.COOKIE.API_KEY_SECRET, {
            path: '/'
        });
        $.removeCookie(Balanced.COOKIE.API_KEY_SECRET, {
            path: '/',
            domain: 'balancedpayments.com'
        });

        $.removeCookie(Balanced.COOKIE.SESSION, {
            path: '/'
        });
        Balanced.NET.loadCSRFToken();
        unsetAPIKey();
    };

    auth.manualLogin = function (user, login) {
        auth.destroyGuestUser();
        //  persist cookie for next time
        auth.rememberLogin(login.uri);
        auth.setAuthProperties(true, user, user.uri, login.uri, false);
    };

    auth.manualLogout = function () {
        auth.setAuthProperties(false, null, null, null, false);
    };

    var INTENDED_DESTINATION_KEY = 'intendedDestinationHash';

    auth.getIntendedDestinationHash = function () {
        return auth.get(INTENDED_DESTINATION_KEY);
    };

    auth.clearIntendedDestinationHash = function () {
        auth.set(INTENDED_DESTINATION_KEY, null);
    };

    auth.setAPIKey = setAPIKey;
    auth.unsetAPIKey = unsetAPIKey;

    initGuestUser();

    // Since we can't use withCredentials for signIn (due to Firefox problems
    // with async==true), grab the session cookie out of the response and set
    // it manually upon login
    auth.on('signInSuccess', function () {
        var response = Balanced.Auth.get('jqxhr');
        auth.rememberLogin(response.uri);
    });

    auth.on('signOutSuccess', function () {
        auth.forgetLogin();
    });

    auth.on('authAccess', function () {
        auth.set(INTENDED_DESTINATION_KEY, window.location.hash);
    });

    return auth;
=======
	var auth = Ember.Object.extend(Ember.Evented).create();

	auth._doSignIn = function(opts) {
		var self = this;
		if (null == opts) {
			opts = {};
		}

		return Balanced.NET.ajax($.extend(true, {
			url: ENV.BALANCED.AUTH + '/logins',
			type: 'POST'
		}, opts)).done(function (response, status, jqxhr) {
			var user = Balanced.User.create();
			user.set('isNew', false);
			user._updateFromJson(response.user);
			user.set('isLoaded', true);
			user.trigger('didLoad');

			self.setAuthProperties(true,
				user,
				response.user_id,
				response.user_id,
				false);

			auth.rememberLogin(response.uri);

			self.trigger('signInSuccess');
		}).fail(function () {
			self.trigger('signInError');
		}).always(function () {
			self.trigger('signInComplete');
		});
	};

	auth.signIn = function(emailAddress, password) {
		return this._doSignIn({
			data: {
				email_address: emailAddress,
				password: password
			}
		});
	};

	auth.rememberMeSignIn = function() {
		var authCookie = this.retrieveLogin();
		if (authCookie) {
			return this._doSignIn({
				data: { uri: authCookie },
				xhrFields: {
					withCredentials: true
				}
			});
		}
	};

	auth.signOut = function() {
		var self = this;

		this.forgetLogin();
		return Balanced.NET.ajax({
			url: ENV.BALANCED.AUTH + '/logins/current',
			type: 'DELETE',
			xhrFields: {
				withCredentials: true
			}
		}).done(function () {
			self.trigger('signOutSuccess');
		}).fail(function () {
			self.trigger('signOutError');
		}).always(function () {
			self.trigger('signOutComplete');
		});
	};

	auth.setAuthProperties = function (signedIn, user, userId, authToken, isGuest) {
		auth.set('authToken', authToken);
		auth.set('userId', userId);
		auth.set('signedIn', signedIn);
		auth.set('user', user);
		auth.set('isGuest', isGuest);
	};

	auth.rememberLogin = function (token) {
		$.cookie(Balanced.COOKIE.EMBER_AUTH_TOKEN, token, {
			expires: 1,
			path: '/'
		});
	};

	auth.forgetLogin = function () {
		// Removing from the root domain since we were setting it on the root
		// domain for a while. This line can be removed after Aug 23, 2013
		$.removeCookie(Balanced.COOKIE.EMBER_AUTH_TOKEN, {
			path: '/',
			domain: 'balancedpayments.com'
		});

		$.removeCookie(Balanced.COOKIE.EMBER_AUTH_TOKEN, {
			path: '/'
		});
		auth.destroyGuestUser();
		auth.manualLogout();
	};

	auth.retrieveLogin = function () {
		return $.cookie(Balanced.COOKIE.EMBER_AUTH_TOKEN);
	};

	function loginGuestUser(apiKeySecret) {
		var guestUser = Balanced.User.create({
			user_marketplaces: Ember.A()
		});
		auth.setAuthProperties(true, guestUser, '/users/guest', apiKeySecret, true);
		setAPIKey(apiKeySecret);
	}

	function setAPIKey(apiKeySecret) {
		Balanced.NET.ajaxHeaders['Authorization'] = 'Basic ' + window.btoa(apiKeySecret + ':');
	}

	function unsetAPIKey() {
		delete Balanced.NET.ajaxHeaders['Authorization'];
	}

	function loadGuestAPIKey() {
		return $.cookie(Balanced.COOKIE.API_KEY_SECRET);
	}

	function initGuestUser() {
		var apiKeySecret = loadGuestAPIKey();
		if (apiKeySecret) {
			loginGuestUser(apiKeySecret);
		}
	}

	auth.storeGuestAPIKey = function (apiKeySecret) {
		$.cookie(Balanced.COOKIE.API_KEY_SECRET, apiKeySecret, {
			path: '/'
		});
		loginGuestUser(apiKeySecret);
	};

	auth.getGuestAPIKey = function() {
		return loadGuestAPIKey();
	};

	auth.destroyGuestUser = function () {
		$.removeCookie(Balanced.COOKIE.API_KEY_SECRET, {
			path: '/'
		});
		$.removeCookie(Balanced.COOKIE.API_KEY_SECRET, {
			path: '/',
			domain: 'balancedpayments.com'
		});

		$.removeCookie(Balanced.COOKIE.SESSION, {
			path: '/'
		});
		Balanced.NET.loadCSRFToken();
		unsetAPIKey();
	};

	auth.manualLogin = function (user, login) {
		auth.destroyGuestUser();
		//  persist cookie for next time
		auth.rememberLogin(login.uri);
		auth.setAuthProperties(true, user, user.uri, login.uri, false);
	};

	auth.manualLogout = function () {
		auth.setAuthProperties(false, null, null, null, false);
	};

	auth.setAPIKey = setAPIKey;
	auth.unsetAPIKey = unsetAPIKey;

	initGuestUser();

	return auth;
>>>>>>> origin/n00b-features
}());
