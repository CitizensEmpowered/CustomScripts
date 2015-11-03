$(function() {
    // ---------------------------------- "Globals" ------------------------------------------------

    var YOUR_ACCOUNT_PAGE = 'http://www.citizensempowered.org/your-account', // Redirected to this upon logging in
        LOG_IN_PAGE = 'http://www.citizensempowered.org/log-in-sign-up', // Redirected to this upon logging out
        HOME_PAGE = 'http://www.citizensempowered.org/', // Not really used
        INSIGHTLY_PROXY_URL = 'http://localhost:5000/v2.2/',
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

        function redirectTo(url) {
            window.location.href = url;
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

        function signUp($form) {
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
                    console.log('Successfully created user account with uid:', userData.uid);
                    alert('You\'re signed up, check your email within the next few minutes for your temporary password!');

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
     
        function logIn($form) {
            var email = $form.find('input#email').val();
            var password = $form.find('input#password').val();

            firebaseRef.authWithPassword({
                email:      email,
                password:   password
            }, function(error, authData) {
                if (error) {
                    console.log('Login Failed!', error);
                }
                else {
                    redirectTo(YOUR_ACCOUNT_PAGE);
                    // console.log('Authenticated successfully with payload:', authData);
                    // alert('You\'re logged in!');
                }
            });
        }

        function logOut() {
            firebaseRef.unauth(); // Will ping the onAuth method of 'userRef'
        }

        function changePassword($form) {
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

        function resetPassword($form) {
            var email = $form.find('input#email').val() || signedInUserEmail;
            console.log('Resetting pass for:', email);

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

        function deleteUser($form) {
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

            // console.log('Data destination:', $form.attr('data-action'));

            $form.find(ALL_FORM_INPUTS_SELECTOR).each(function() {
                var $elem = $(this);
                // if ($elem.attr('name') === 'Salutation')
                    dataObj[$elem.attr('name')] = $elem.val();
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
                    handler = signUp;
                    break;
                case 'update-user':
                    handler = submitUserData.bind(null, 'users', false, true);
                    break;
                case 'create-topic':
                    handler = submitUserData.bind(null, 'topics', true, false);
                    break;
                case 'log-in':
                    handler = logIn;
                    break;
                case 'log-out':
                    handler = logOut;
                    break;
                case 'reset-password':
                    handler = resetPassword;
                    break;
                case 'change-password':
                    handler = changePassword;
                    break;
                case 'delete-user':
                    handler = deleteUser;
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