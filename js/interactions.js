// ---------------------------------- Globals -------------------------------------------

var signedInUser;
var signedInUserInfo;

$(function() {
    // ---------------------------------- Semi-Globals --------------------------------------

    var YOUR_ACCOUNT_PAGE = 'http://www.citizensempowered.org/your-account',
        LOG_IN_PAGE = 'http://www.citizensempowered.org/log-in-sign-up',
        HOME_PAGE = 'http://www.citizensempowered.org/',
        ALL_FORM_INPUTS_SELECTOR = 'input:not([type=submit], [type=hidden]), textarea, select';

    var SQUARESPACE_CONFIG = (window.top.location.href.indexOf('config') !== -1),
        PAGE_LOCKED = (typeof LOCKED_PAGE !== 'undefined');
        

    function unlockPage() {
        if (PAGE_LOCKED) {
            document.getElementById('page-blocker').style.display = 'none';
        }
    }

    function initializeEverything() {
        var ref = new Firebase('https://ce-testing.firebaseio.com/');
        var userRef = ref.child('users');
        var topicRef = ref.child('topics');

        // ---------------------------------- Helper Functions ----------------------------------

        function handleUserData(snapshot) {
            var data = snapshot.val();

            if (!data) {
                console.log('Child (user) data is gone');
                return;
            }

            console.log('Got updated user data:', data);

            signedInUserInfo = data;

            var $giveInfoForm = $('form#give-info');
            if ($giveInfoForm.length) {
                var formId = 'give-info';
                $giveInfoForm.find(ALL_FORM_INPUTS_SELECTOR).each(function() {
                    var $elem = $(this);
                    var key = $elem.attr('id').replace(formId + '__', '');
                    $elem.val(signedInUserInfo[key]);
                });
            }
        }
        function handleUserDataError(errorObject) {
            console.log('The read failed: ' + errorObject.code);
        }

        // ---------------------------------- Main Behavior Functions ---------------------------

        userRef.onAuth(function authDataCallback(authData) {
            if (authData) {
                // console.log(authData);
                console.log('User ' + authData.uid + ' is logged in with ' + authData.provider);
                signedInUser = authData.uid;
                // console.log('Signed in:', signedInUser.email);
                unlockPage();

                // Act on the user's data
                userRef.child(authData.uid).on('value', handleUserData, handleUserDataError);
            } else {
                var wasSignedIn = signedInUser ? true : false;

                signedInUser = null;
                signedInUserInfo = null;

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

        function signUp($this) {
            var email = $this.find('#sign-up-email').val();
            var password = createRandomPassword(20);

            userRef.createUser({
                email:      email,
                password:   password
            }, function(error, userData) {
                if (error) {
                    console.log('Error creating user:', error);
                }
                else {
                    console.log('Successfully created user account with uid:', userData.uid);
                    alert('You\'re signed up, check your email within the next few minutes for your temporary password!');

                    // Log in to set their email
                    userRef.authWithPassword({
                        email:      email,
                        password:   password
                    }, function(error, authData) {
                        if (error) {
                            console.log('Login Failed!', error);
                        }
                        else {
                            console.log('Authenticated successfully with payload:', authData);

                            // Set the email
                            userRef.child(authData.uid).set({
                                email: email
                            });

                            redirectTo(YOUR_ACCOUNT_PAGE);
                        }
                    });

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

        function submitUserData(collection, appending, $this) {

            var dataObj = {};
            dataObj.uid = signedInUser;

            var formId = $this.attr('id');

            $this.find(ALL_FORM_INPUTS_SELECTOR).each(function() {
                var $elem = $(this);
                var id = $elem.attr('id').replace(formId + '__', '');
                dataObj[id] = $elem.val();
            });

            var specificRef = (collection === 'topics') ? topicRef : userRef.child(signedInUser);

            console.log(dataObj);

            specificRef[appending ? 'push' : 'update'](dataObj);
        }
     
        function logIn($this) {
            var email = $this.find('#log-in-email').val();
            var password = $this.find('#log-in-pass').val();

            userRef.authWithPassword({
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
            userRef.unauth(); // Will ping the onAuth method of 'userRef'
        }

        function changePassword($this) {
            var email       = signedInUserInfo.email;
            var oldPassword = $this.find('#change-pass-pass-old').val();
            var newPassword = $this.find('#change-pass-pass-new1').val();
            var newPasswordVerify = $this.find('#change-pass-pass-new2').val();

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
            var email = $this.find('#reset-pass-email').val() || signedInUserInfo.email;
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
            var email = signedInUserInfo.email;
            var password = $this.find('#delete-user-pass').val();

            if (!signedInUser) {
                alert('Must be signed in to delete your account');
            }

            if (confirm('Did you mean to delete your entire account (not reversible)?')) {
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

        // ---------------------------------- Event Listeners -----------------------------------

        $('form').submit(function(evt) {
            evt.preventDefault();
            var $this = $(this);
            var handler;

            switch ($this.attr('id')) {
                case 'sign-up':
                    handler = signUp;
                    break;
                case 'give-info':
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
                case 'reset-pass':
                    handler = resetPassword;
                    break;
                case 'change-pass':
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