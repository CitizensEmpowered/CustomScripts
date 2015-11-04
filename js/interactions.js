$(function() {
    // ---------------------------------- "Globals" ------------------------------------------------

    var YOUR_ACCOUNT_PAGE = 'http://www.citizensempowered.org/your-account', // Redirected to this upon logging in
    // var YOUR_ACCOUNT_PAGE = 'http://localhost:8080/mock-up-testing/', // Redirected to this upon logging in
        LOG_IN_PAGE = 'http://www.citizensempowered.org/log-in-sign-up', // Redirected to this upon logging out
        // LOG_IN_PAGE = 'http://localhost:8080/mock-up-testing/', // Redirected to this upon logging out
        HOME_PAGE = 'http://www.citizensempowered.org/', // Not really used
        // INSIGHTLY_PROXY_URL = 'http://localhost:5000/v2.2/',
        INSIGHTLY_PROXY_URL = 'http://ce-insightly-proxy.herokuapp.com/v2.1/',
        FIREBASE_URL = 'https://citizensempowered.firebaseio.com/',
        ALL_FORM_INPUTS_SELECTOR = 'input:not([type=submit], [type=hidden]), textarea, select';

    var SQUARESPACE_CONFIG = (window.top.location.href.indexOf('config') !== -1),
        PAGE_LOCKED = (typeof LOCKED_PAGE !== 'undefined');

    var signedInUserFirebaseUid;
    var signedInUserEmail;
    var signedInUserInsightlyUid;
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
                console.log('User has no data');
                return;
            }

            console.log('Got updated user data:', data);

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
            console.log('The read failed: ' + errorObject.code);
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

        // ---------------------------------- Main Behavior Functions ---------------------------

        firebaseRef.onAuth(function authDataCallback(authData) {
            if (authData) {
                signedInUserFirebaseUid = authData.uid;
                signedInUserEmail = authData.password.email;
                console.log('User', signedInUserEmail, '(', signedInUserFirebaseUid, ') is logged in with', authData.provider);
                unlockPage();

                // Act on the user's data
                userRef.child(authData.uid).on('value', handleUserData, handleUserDataError);
            } else {
                var wasSignedIn = !!signedInUserFirebaseUid;

                signedInUserFirebaseUid = null;

                if (wasSignedIn) {
                    console.log('User was logged in and logged out, redirecting');
                    redirectTo(LOG_IN_PAGE);
                }
                else {
                    console.log('User is logged out');
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

            userRef.createUser({
                email:      email,
                password:   password
            }, function(error, userData) {
                if (error) {
                    // console.log('Error creating user:', error);
                    alert('An account with that email already exists');
                }
                else {
                    localStorage.setItem('sign-up-email', email);

                    console.log('Successfully created user account with uid:', userData.uid);
                    alert('You\'re signed up, check your email within the next few minutes to sign in and set your password!');

                    // Immediately reset their password
                    userRef.resetPassword({
                        email: email
                    }, function(error) {
                        if (error) {
                            console.log('Error sending password reset email:', error);
                        }
                        else {
                            console.log('Password reset email sent successfully');
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
                    console.log('Login Failed!', error);
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

        function logOutFromForm() {
            firebaseRef.unauth(); // Will ping the onAuth method of 'userRef'
        }

        function changePasswordFromForm($form) {
            var email       = signedInUserEmail;
            var oldPassword = $form.find('input#password-old').val();
            var newPassword = $form.find('input#password-new1').val();
            var newPasswordVerify = $form.find('input#password-new2').val();

            if (newPassword !== newPasswordVerify) {
                alert('The passwords did not match');
            }
            else {
                userRef.changePassword({
                    email       : email,
                    oldPassword : oldPassword,
                    newPassword : newPassword
                }, function(error) {
                    if (error) {
                        console.log('Error changing password:', error);
                    }
                    else {
                        alert('Password changed successfully');
                    }
                });
            }
        }

        function setPasswordFromForm($form) {
            var email       = localStorage.getItem('sign-up-email');
            var oldPassword = getQueryParameterByName('token');
            var newPassword = $form.find('input#password-new1').val();
            var newPasswordVerify = $form.find('input#password-new2').val();

            console.log()

            if (newPassword !== newPasswordVerify) {
                alert('The passwords did not match');
            }
            else {
                userRef.changePassword({
                    email       : email,
                    oldPassword : oldPassword,
                    newPassword : newPassword
                }, function(error) {
                    if (error) {
                        console.log('Error setting password:', error);
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
            var email = $form.find('input#email').val() || signedInUserEmail;
            console.log('Resetting pass for:', email);

            userRef.resetPassword({
                email: email
            }, function(error) {
                if (error) {
                    console.log('Error sending password reset email:', error);
                    alert('Could not send reset email, no user with that email address');
                }
                else {
                    alert('Password reset email sent successfully');
                }
            });
        }

        function deleteUserFromForm($form) {
            var email = signedInUserEmail;
            var password = $form.find('input#password').val();

            if (!signedInUserFirebaseUid) {
                alert('Must be signed in to delete your account');
            }

            if (confirm('Did you mean to delete your entire account? WARNING: Cannot be undone.')) {
                userRef.child(signedInUserFirebaseUid).remove(function(error) {
                    if (error) {
                        console.log('Removing user data failed');
                    } else {
                        console.log('Removing user data succeeded');
                    }
                });

                userRef.removeUser({
                    email    : email,
                    password : password
                }, function(error) {
                    if (error === null) {
                        alert('Your account has been successfully deleted');
                        console.log('User removed successfully');
                    }
                    else {
                        console.log('Error removing user:', error);
                    }
                });
            }
        }

        function submitUserData(collection, appending, isInsightly, $form) {
            var dataObj = {};
            dataObj.uid = signedInUserFirebaseUid;

            var formId = $form.attr('id');

            $form.find(ALL_FORM_INPUTS_SELECTOR).each(function() {
                var $elem = $(this);
                dataObj[$elem.attr('id')] = $elem.val();
            });

            var specificRef = (collection === 'topics') ? topicRef : userRef.child(signedInUserFirebaseUid);

            specificRef[appending ? 'push' : 'update'](dataObj, function() {
                if (isInsightly) {
                    sendDataToInsightly($form);
                }
            });
        }

        function sendDataToInsightly($form) {
            // $form.attr('name', $form.attr('data-name'));
            // $form.attr('action', $form.attr('data-action'));
            // $form.attr('method', $form.attr('data-method'));

            // // Note: Can't do a AJAX submission of data, Insightly doesn't allow cross-site requests (for security, probably)
            // // Maybe should use API
            // $form.unbind('submit').submit();

            var dataObj = {};

            dataObj.contactInfos = [];
            dataObj.addresses = [];

            $form.find(ALL_FORM_INPUTS_SELECTOR).each(function() {
                var $elem = $(this);

                var elemName = $elem.attr('name');
                var elemVal = $elem.val();

                if (phoneOrEmailValue(elemName)) {
                    if (elemVal) {
                        var consolidatedData = {};

                        var selector = '[name="' + elemName.replace(/Value$/, '') + 'Label"]';

                        consolidatedData.detail = elemVal;
                        consolidatedData.label = $form.find(selector).val();
                        consolidatedData.type = elemName.match(/[^[]+/)[0].replace(/s$/, '');
                        consolidatedData.subtype = null;

                        dataObj.contactInfos.push(consolidatedData);
                    }
                }

                else if (addressPartial(elemName)) {
                    var addressIndex = parseInt(elemName.match(/\[([0-9])\]/)[1]); // Example output: [ '[0]', '0', index: 9, input: 'addresses[0]' ]

                    if (addressIndex >= dataObj.addresses.length) {
                        for (var i = 0; i <= addressIndex; ++i) {
                            dataObj.addresses.push({});
                        }
                    }

                    if (/Street/i.test(elemName)) {
                        var addressPartialSelector = '[name="' + elemName.replace(/Street$/, 'AddressType') + '"]';
                        dataObj.addresses[addressIndex].address_type = $form.find(addressPartialSelector).val();
                    }

                    addressPartialType = elemName.match(/\.(.+)/)[1]; // Example output: [ '.City', 'City', index: 12, input: 'addresses[0].City' ]

                    dataObj.addresses[addressIndex][addressPartialType] = elemVal;
                }

                else if (shouldBeUnderscored(elemName)) {
                    elemName = elemName.replace(/(?!^)([A-Z]+)/, '_$1');
                    dataObj[elemName] = elemVal;
                }

                else {
                    dataObj[elemName] = elemVal;
                }
            });

            console.log('Insightly data:', dataObj);
            console.log('Insightly url:', INSIGHTLY_PROXY_URL + 'Contacts');

            $.post(INSIGHTLY_PROXY_URL + 'Contacts', dataObj, function(data, textStatus) {
                console.log('Got', data, 'from insightly');
                console.log('Got', textStatus, 'from insightly');
            });
        }

        function handleNewTopic(snapshot) {
            var data = snapshot.val();

            console.log('Got topic:', data);

            for (var key in data) {
                var topic = data[key];

                $topicsContainer.append($('<div>', { html: JSON.stringify(topic, 2) }));
            }
        }
        function handleNewTopicError(errorObject) {
            console.log('The read failed: ' + errorObject.code);
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
                case 'log-out':
                    handler = logOutFromForm;
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

        $('#log-out').click(logOutFromForm);
    }

    if (SQUARESPACE_CONFIG) {
        unlockPage();
    }
    else {
        initializeEverything();
    }
});