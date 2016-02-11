$(function() {
    // ---------------------------------- "Globals" ------------------------------------------------

    var YOUR_ACCOUNT_PAGE = 'http://www.citizensempowered.org/your-account', // Redirected to this upon logging in
    // var YOUR_ACCOUNT_PAGE = 'http://localhost:8080/mock-up-testing/', // Redirected to this upon logging in
        LOG_IN_PAGE = 'http://www.citizensempowered.org/log-in-sign-up', // Redirected to this upon logging out
        // LOG_IN_PAGE = 'http://localhost:8080/mock-up-testing/', // Redirected to this upon logging out
        HOME_PAGE = 'http://www.citizensempowered.org/', // Not really used
        // INSIGHTLY_PROXY_URL = 'http://localhost:5000/v2.1/',
        INSIGHTLY_PROXY_URL = 'http://ce-insightly-proxy.herokuapp.com/v2.1/', // Proxy server to hide Insightly credentials
        FIREBASE_URL = 'https://citizensempowered.firebaseio.com/',
        ALL_FORM_INPUTS_SELECTOR = 'input:not([type=submit], [type=hidden]), textarea, select';

    var SQUARESPACE_CONFIG = (window.top.location.href.indexOf('config') !== -1),
        PAGE_LOCKED = (typeof LOCKED_PAGE !== 'undefined');

    var signedInUserInfo = {
        firebaseUid: null,
        email: null,
        insightlyUid: null
    };

    var firebaseRef;

    function unlockPage() {
        if (PAGE_LOCKED) {
            document.getElementById('page-blocker').style.display = 'none';
        }
    }

    function initializeEverything() {
        firebaseRef = new Firebase(FIREBASE_URL);
        var userRef = firebaseRef.child('users');
        var topicRef = firebaseRef.child('topics');
        var $topicsContainer = $('.topic-viewer');

        // ---------------------------------- Helper Functions ----------------------------------

        function handleUserData(snapshot) {
            var data = snapshot.val();

            if (!data) {
                console.log('[Custom Script] User has no data');
                return;
            }

            console.log('[Custom Script] Got updated user data:', data);

            signedInUserInfo.insightlyUid = data.insightlyUid;

            var $userInfoForm = $('form#update-user');
            if ($userInfoForm.length) {
                $userInfoForm.find(ALL_FORM_INPUTS_SELECTOR).each(function() {
                    var $elem = $(this);
                    var key = $elem.attr('id');
                    $elem.val(data[key]);
                });
            }
        }
        function handleUserDataError(errorObject) {
            console.log('[Custom Script] The read failed: ' + errorObject.code);
        }

        function createRandomPassword(length) {
            length = length || 20;
            var text = '';
            var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

            for(var i = 0; i < length; ++i) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return text;
        }

        function getQueryParameterByName(name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        function redirectTo(url) {
            window.location.href = url;
        }

        function phoneOrEmailValue(elementName) {
            return /\[[0-9]\]\.Value/.test(elementName);
        }
        function addressPartial(elementName) {
            return /addresse?s?\[[0-9]\]/.test(elementName);
        }
        function shouldBeUnderscored(elementName) {
             return /[A-Z][a-z]+[A-Z]/.test(elementName);
        }

        function replaceHeaderSignInLink() {
            var $newElement = $('<span>');

            var $signOutLink = $('<a>', { id: 'log-out', href: '#', html: 'Log Out' });
            var $accLink = $('<a>', { href: YOUR_ACCOUNT_PAGE, html: 'Your Account' });

            $newElement.append($accLink);
            $newElement.append(' / ');
            $newElement.append($signOutLink);

            var $oldLink = $('a[href*="log-in"]');
            $newElement.insertAfter($oldLink);
            $oldLink.hide();

            $signOutLink.click(logOut);
        }

        // ---------------------------------- Main Behavior Functions ---------------------------

        firebaseRef.onAuth(function authDataCallback(authData) {
            if (authData) { // User is logged in
                replaceHeaderSignInLink();

                signedInUserInfo.firebaseUid = authData.uid;
                signedInUserInfo.email = authData.password.email;

                console.log('[Custom Script] User', signedInUserInfo.email, '(', signedInUserInfo.firebaseUid, ') is logged in with', authData.provider);
                unlockPage();

                // Act on the user's data
                userRef.child(authData.uid).on('value', handleUserData, handleUserDataError);
            } else {
                var wasSignedIn = !!signedInUserInfo.firebaseUid; // Detecting case where use was logged out with page active

                signedInUserInfo.firebaseUid = null;
                signedInUserInfo.insightlyUid = null;

                if (wasSignedIn) {
                    console.log('[Custom Script] User was logged in and logged out, redirecting');
                    redirectTo(LOG_IN_PAGE);
                }
                else {
                    console.log('[Custom Script] User is logged out');
                    if (PAGE_LOCKED) {
                        alert('You\'re not signed in, redirecting you to the home page.');
                        window.location.replace(LOG_IN_PAGE);
                    }
                }
            }
        });

        function signUpFromForm($form) {
            var email = $form.find('#email').val();
            var password = createRandomPassword(20);

            firebaseRef.createUser({
                email:      email,
                password:   password
            }, function(error, userData) {
                if (error) {
                    console.log('[Custom Script] Error creating user:', error);
                    alert('An account with that email already exists');
                }
                else {
                    localStorage.setItem('sign-up-email', email);

                    console.log('[Custom Script] Successfully created user account with email:', email);
                    alert('You\'re signed up, check your email within the next few minutes to sign in and set your password!');

                    // Immediately reset their password
                    firebaseRef.resetPassword({
                        email: email
                    }, function(error) {
                        if (error) {
                            console.log('[Custom Script] Error sending password reset email:', error);
                        }
                        else {
                            console.log('[Custom Script] Password reset email sent successfully');
                        }
                    });
                }
            });
        }

        function logIn(email, password) {
            firebaseRef.authWithPassword({
                email:      email,
                password:   password
            }, function(error, authData) {
                if (error) {
                    console.log('[Custom Script] Login Failed!', error);
                    alert('Failed to log you in, likely problem with username or password');
                }
                else {
                    // alert('You\'re logged in!');
                    redirectTo(YOUR_ACCOUNT_PAGE);
                }
            });
        }
        function logInFromForm($form) {
            var email = $form.find('input#email').val();
            var password = $form.find('input#password').val();

            logIn(email, password);
        }

        function logOut(evt) {
            evt.preventDefault();
            if (signedInUserInfo.firebaseUid) { // Testing to see if user is logged in
                firebaseRef.unauth(); // Will ping the onAuth method of 'firebaseRef'
                alert('You have been successfully logged out');
            }
            else {
                alert('You were not already logged in');
            }
        }

        function changePasswordFromForm($form) {
            var email       = signedInUserInfo.email;
            var oldPassword = $form.find('input#password-old').val();
            var newPassword = $form.find('input#password-new1').val();
            var newPasswordVerify = $form.find('input#password-new2').val();

            if (newPassword !== newPasswordVerify) {
                alert('The passwords did not match');
            }
            else {
                firebaseRef.changePassword({
                    email       : email,
                    oldPassword : oldPassword,
                    newPassword : newPassword
                }, function(error) {
                    if (error) {
                        console.log('[Custom Script] Error changing password:', error);
                        alert('Could not change password, email/password combination incorrect.');
                    }
                    else {
                        alert('Password changed successfully');
                    }
                });
            }
        }

        if (localStorage.getItem('sign-up-email')) {
            $('form#set-password input#email').val(localStorage.getItem('sign-up-email'));
        }
        function setPasswordFromForm($form) {
            var email       = $form.find('input#email').val();
            var oldPassword = getQueryParameterByName('token');
            var newPassword = $form.find('input#password-new1').val();
            var newPasswordVerify = $form.find('input#password-new2').val();

            if (newPassword !== newPasswordVerify) {
                alert('The passwords did not match');
            }
            else if (!email) {
                alert('The email used to sign up is no longer remembered. It is likely that you have already set your password.');
            }
            else {
                firebaseRef.changePassword({
                    email       : email,
                    oldPassword : oldPassword,
                    newPassword : newPassword
                }, function(error) {
                    if (error) {
                        console.log('[Custom Script] Error setting password:', error);
                        alert('Password set was unsuccessful - link likely expired or was already used.');
                    }
                    else {
                        localStorage.removeItem('sign-up-email');
                        alert('Password set successfully');

                        logIn(email, newPassword);
                    }
                });
            }
        }

        function resetPasswordFromForm($form) {
            var email = $form.find('input#email').val() || signedInUserInfo.email;

            firebaseRef.resetPassword({
                email: email
            }, function(error) {
                if (error) {
                    console.log('[Custom Script] Error sending password reset email:', error);
                    alert('Could not send reset email, no user with that email address');
                }
                else {
                    alert('Password reset email sent successfully');
                }
            });
        }

        function deleteUserFromForm($form) {
            var email = signedInUserInfo.email;
            var password = $form.find('input#password').val();

            if (!signedInUserInfo.firebaseUid) {
                alert('Must be signed in to delete your account');
            }

            if (confirm('Did you mean to delete your entire account? WARNING: Cannot be undone.')) {
                userRef.child(signedInUserInfo.firebaseUid).remove(function(error) {
                    if (error) {
                        console.log('[Custom Script] Removing user data failed');
                    }
                    else {
                        console.log('[Custom Script] Removing user data succeeded');
                    }
                });

                firebaseRef.removeUser({
                    email    : email,
                    password : password
                }, function(error) {
                    if (error === null) {
                        console.log('[Custom Script] User removed successfully');
                        alert('Your account has been successfully deleted');
                    }
                    else {
                        console.log('[Custom Script] Error removing user:', error);
                        alert('Your account could not be deleted. Likely problem with your password, or your account has been corrupted.');
                    }
                });
            }
        }

        function submitUserData(collection, appending, isInsightly, $form) {
            var dataObj = {};

            var formId = $form.attr('id');

            $form.find(ALL_FORM_INPUTS_SELECTOR).each(function() {
                var $elem = $(this);
                dataObj[$elem.attr('id')] = $elem.val();
            });

            var specificRef = (collection === 'topics') ? topicRef : userRef.child(signedInUserInfo.firebaseUid);

            specificRef[appending ? 'push' : 'update'](dataObj, function() {
                if (isInsightly) {
                    sendDataToInsightly($form);
                }
            });
        }

        function sendDataToInsightly($form) {
            var insightlyData = {
                "contact_id": null, // Gotten from firebase
                "salutation": "",   // Gotten from form
                "first_name": "",   // Gotten from form
                "last_name": "",    // Gotten from form
                "background": "",   // Gotten from form
                // "customfields": [
                //     {
                //         "custom_field_id": "",
                //         "field_value": {}
                //     },
                //     {
                //         "custom_field_id": "",
                //         "field_value": {}
                //     },
                //     {
                //         "custom_field_id": "",
                //         "field_value": {}
                //     }
                // ],
                "addresses": [ // Update this section to addresses requested in form
                    {
                        "address_type": "home",
                        "street":       "", // Gotten from form
                        "city":         "", // Gotten from form
                        "state":        "", // Gotten from form
                        "postcode":     "", // Gotten from form
                        "country":      ""  // Gotten from form
                    }
                ],
                "contactinfos": [
                    {
                        "type": "email",
                        "subtype": null,
                        "label": "personal",
                        "detail": "" // Gotten from form
                    },
                    {
                        "type": "phone",
                        "subtype": null,
                        "label": "mobile",
                        "detail": "" // Gotten from form
                    },
                    {
                        "type": "phone",
                        "subtype": null,
                        "label": "home",
                        "detail": "" // Gotten from form
                    }
                ],
                "tags": [
                    {
                        "tag_name": "CE MEMBER"
                    }
                ],
            };

            var mapper = {
                'salutation':           ['salutation'],
                'first-name':           ['first_name'],
                'last-name':            ['last_name'],
                'background-info':      ['background'],
                'email-personal':       ['contactinfos', 0, 'detail'],
                'phone-mobile':         ['contactinfos', 1, 'detail'],
                'phone-home':           ['contactinfos', 2, 'detail'],
                'address-street':       ['addresses', 0, 'street'],
                'address-city':         ['addresses', 0, 'city'],
                'address-state':        ['addresses', 0, 'state'],
                'address-postal-code':  ['addresses', 0, 'postcode'],
                'address-country':      ['addresses', 0, 'country']
            };

            $form.find(ALL_FORM_INPUTS_SELECTOR).each(function() {
                var $elem = $(this);
                var elemId = $elem.attr('id');
                var elemVal = $elem.val();

                var elemInsightlyStoragePath = mapper[elemId];

                if (!elemInsightlyStoragePath) {
                    console.log('Didn\'t recognize:', elemId);
                    return;
                }

                var elemDestination = insightlyData;

                var i = 0;
                for (; i < elemInsightlyStoragePath.length-1; ++i) { // Go through path until 1 step away
                    var step = elemInsightlyStoragePath[i];
                    elemDestination = elemDestination[step];
                }

                // Assign to final destination
                elemDestination[elemInsightlyStoragePath[i]] = elemVal;
            });

            insightlyData.contactinfos = insightlyData.contactinfos.filter(function(contactinfo) {
                return contactinfo.detail;
            });

            var method;
            if (signedInUserInfo.insightlyUid) {
                method = 'PUT'; // Update, not add
                insightlyData.contact_id = signedInUserInfo.insightlyUid;
            }
            else {
                method = 'POST'; // Add, not update
                delete insightlyData.contact_id;
            }

            console.log('[Custom Script] Insightly data:', insightlyData);

            $.ajax({
                method: method,
                url: INSIGHTLY_PROXY_URL + 'Contacts',
                data: insightlyData,
                success: function(data, textStatus) {
                    console.log('[Custom Script] Good');
                    console.log('[Custom Script] Got', data, 'from insightly');
                    console.log('[Custom Script] Got', textStatus, 'from insightly');

                    alert('Updated your information successfully');

                    if (!signedInUserInfo.insightlyUid) {
                        var newUid = data.CONTACT_ID;

                        signedInUserInfo.insightlyUid = newUid;

                        userRef.child(signedInUserInfo.firebaseUid).child('insightlyUid').set(newUid, function(error) {
                            if (error) {
                                console.log('[Custom Script] Failed at adding insightlyUid');
                            }
                            else {
                                console.log('[Custom Script] Adding insightlyUid success');
                            }
                        });
                    }
                },
                error: function(xhr, status, err) {
                    console.log('[Custom Script] Issue with connecting to insightly');
                    console.log(xhr);
                    console.log(status);
                    console.log(err);
                }
            });
        }

        function handleNewTopic(snapshot) {
            var data = snapshot.val();

            console.log('[Custom Script] Got topics:', data);

            for (var key in data) {
                var topic = data[key];

                $topicsContainer.append($('<div>', { html: JSON.stringify(topic, 2) }));
            }
        }
        function handleNewTopicError(errorObject) {
            console.log('[Custom Script] The read failed: ' + errorObject.code);
        }

        if ($topicsContainer.length) {
            topicRef.once('value', handleNewTopic, handleNewTopicError);
        }

        // ---------------------------------- Event Listeners -----------------------------------

        $('form').submit(function(evt) {
            var $form = $(this);
            var handler;
            var recognized = true;

            switch ($form.attr('id')) {
                case 'sign-up':
                    handler = signUpFromForm;
                    break;
                case 'update-user':
                    handler = submitUserData.bind(null, 'users', false, true);
                    break;
                case 'create-topic':
                    handler = submitUserData.bind(null, 'topics', true, false);
                    break;
                case 'log-in':
                    handler = logInFromForm;
                    break;
                case 'reset-password':
                    handler = resetPasswordFromForm;
                    break;
                case 'change-password':
                    handler = changePasswordFromForm;
                    break;
                case 'set-password':
                    handler = setPasswordFromForm;
                    break;
                case 'delete-user':
                    handler = deleteUserFromForm;
                    break;
                default:
                    recognized = false;
                    console.log('[Custom Script] Didn\'t recognize the form id:', $form.attr('id'));
            }

            if (recognized) {
                evt.preventDefault();
                handler($form);
            }
        });

        $('#log-out').click(logOut);
    }

    if (SQUARESPACE_CONFIG) {
        unlockPage();
    }
    else {
        initializeEverything();
    }
});