$(function() {
    // ---------------------------------- "Globals" ------------------------------------------------

    var YOUR_ACCOUNT_PAGE = 'http://www.citizensempowered.org/your-account', // Redirected to this upon logging in
    // var YOUR_ACCOUNT_PAGE = '/web-testing/', // Redirected to this upon logging in
        LOG_IN_PAGE = 'http://www.citizensempowered.org/log-in-sign-up', // Redirected to this upon logging out
        // LOG_IN_PAGE = '/web-testing/', // Redirected to this upon logging out
        HOME_PAGE = 'http://www.citizensempowered.org/', // Not really used
        ALL_FORM_INPUTS_SELECTOR = 'input:not([type=submit], [type=hidden]), textarea, select';

    var SQUARESPACE_CONFIG = (window.top.location.href.indexOf('config') !== -1),
        PAGE_LOCKED = (typeof LOCKED_PAGE !== 'undefined');

    var signedInUser;
    var signedInUserEmail;
    var firebaseRef;

    function unlockPage() {
        if (PAGE_LOCKED) {
            document.getElementById('page-blocker').style.display = 'none';
        }
    }

    function initializeEverything() {
        firebaseRef = new Firebase('https://citizensempowered.firebaseio.com/');
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
                signedInUser = authData.uid;
                signedInUserEmail = authData.password.email;
                console.log('User', signedInUserEmail, '(', signedInUser, ') is logged in with', authData.provider);
                unlockPage();

                // Act on the user's data
                userRef.child(authData.uid).on('value', handleUserData, handleUserDataError);
            } else {
                var wasSignedIn = signedInUser ? true : false;

                signedInUser = null;

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

        function signUp($this) {
            var email = $this.find('#email').val();
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
     
        function logIn($this) {
            var email = $this.find('input#email').val();
            var password = $this.find('input#password').val();

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

        function changePassword($this) {
            var email       = signedInUserEmail;
            var oldPassword = $this.find('input#password-old').val();
            var newPassword = $this.find('input#password-new1').val();
            var newPasswordVerify = $this.find('input#password-new2').val();

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

        function resetPassword($this) {
            var email = $this.find('input#email').val() || signedInUserEmail;
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

        function deleteUser($this) {
            var email = signedInUserEmail;
            var password = $this.find('input#password').val();

            if (!signedInUser) {
                alert('Must be signed in to delete your account');
            }

            if (confirm('Did you mean to delete your entire account? WARNING: Cannot be undone.')) {
                userRef.child(signedInUser).remove(function(error) {
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

        function submitUserData(collection, appending, $this) {

            var dataObj = {};
            dataObj.uid = signedInUser;

            var formId = $this.attr('id');

            $this.find(ALL_FORM_INPUTS_SELECTOR).each(function() {
                var $elem = $(this);
                dataObj[$elem.attr('id')] = $elem.val();
            });

            var specificRef = (collection === 'topics') ? topicRef : userRef.child(signedInUser);

            console.log(dataObj);

            specificRef[appending ? 'push' : 'update'](dataObj);
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
            evt.preventDefault();
            var $this = $(this);
            var handler;

            switch ($this.attr('id')) {
                case 'sign-up':
                    handler = signUp;
                    break;
                case 'update-user':
                    handler = submitUserData.bind(null, 'users', false);
                    break;
                case 'create-topic':
                    handler = submitUserData.bind(null, 'topics', true);
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
                    console.log('didn\'t recognize the form id:', $this.attr('id'));
            }

            handler($this);
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