$(function() {
    
    // ---------------------------------- Semi-Globals --------------------------------------

    var ref = new Firebase("https://ce-testing.firebaseio.com/users");

    var signedInUser;
    var signedInUserInfo;

    // ---------------------------------- Helper Functions ----------------------------------

    function handleUserData(snapshot) {
        var data = snapshot.val();

        console.log('Got updated user data:', data);

        signedInUserInfo = data;

        $('#give-info-address').val(data.address);
        $('#give-info-city').val(data.city);
        $('#give-info-state').val(data.state);
    }
    function handleUserDataError(errorObject) {
        console.log("The read failed: " + errorObject.code);
    }

    // ---------------------------------- Main Behavior Functions ---------------------------

    ref.onAuth(function authDataCallback(authData) {
        if (authData) {
            // console.log(authData);
            console.log("User " + authData.uid + " is logged in with " + authData.provider);
            signedInUser = authData.uid;
            // console.log('Signed in:', signedInUser.email);

            // Act on the user's data
            ref.child(authData.uid).on('value', handleUserData, handleUserDataError);
        } else {
            signedInUser = null;
            console.log("User is logged out");
        }
    });

    function createRandomPassword(length) {
        length = length || 20;
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for(var i = 0; i < length; ++i) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    function signUp($this) {
        var email = $this.find('#sign-up-email').val();
        var password = createRandomPassword(20);

        ref.createUser({
            email:      email,
            password:   password
        }, function(error, userData) {
            if (error) {
                console.log("Error creating user:", error);
            }
            else {
                console.log("Successfully created user account with uid:", userData.uid);
                alert('You\'re signed up!');

                // Log in to set their email
                ref.authWithPassword({
                    email:      email,
                    password:   password
                }, function(error, authData) {
                    if (error) {
                        console.log("Login Failed!", error);
                    }
                    else {
                        console.log("Authenticated successfully with payload:", authData);

                        // Set the email
                        ref.child(authData.uid).set({
                            email: email
                        });

                        // Log them out again
                        ref.unauth();
                    }
                });

                // Immediately reset their password
                ref.resetPassword({
                    email: email
                }, function(error) {
                    if (error) {
                        console.log("Error sending password reset email:", error);
                    }
                    else {
                        console.log("Password reset email sent successfully");
                    }
                });
            }
        });
    }

    function giveInfo($this) {
        var address = $this.find('#give-info-address').val(),
            city = $this.find('#give-info-city').val(),
            state = $this.find('#give-info-state').val();

        ref.child(signedInUser).update({
            address: address,
            city: city,
            state: state
        });
    }

    function logIn($this) {
        var email = $this.find('#log-in-email').val();
        var password = $this.find('#log-in-pass').val();

        ref.authWithPassword({
            email:      email,
            password:   password
        }, function(error, authData) {
            if (error) {
                console.log("Login Failed!", error);
            }
            else {
                alert('You\'re logged in!');
                console.log("Authenticated successfully with payload:", authData);
            }
        });
    }

    function logOut($this) {
        ref.unauth(); // Will ping the onAuth method of 'ref'
    }

    function changePassword($this) {
        var email       = $this.find('#change-pass-email').val();
        var oldPassword = $this.find('#change-pass-pass-old').val();
        var newPassword = $this.find('#change-pass-pass-new').val();

        ref.changePassword({
            email       : email,
            oldPassword : oldPassword,
            newPassword : newPassword
        }, function(error) {
            if (error) {
                console.log("Error changing password:", error);
            }
            else {
                console.log("Password changed successfully");
            }
        });
    }

    function resetPassword($this) {
        var email = $this.find('#reset-pass-email').val() || signedInUserInfo.email;
        console.log('Resetting pass for:', email);

        ref.resetPassword({
            email: email
        }, function(error) {
            if (error) {
                console.log("Error sending password reset email:", error);
            }
            else {
                console.log("Password reset email sent successfully");
            }
        });
    }

    function deleteUser($this) {
        var email = $this.find('#delete-user-email').val();
        var password = $this.find('#delete-user-pass').val();

        ref.removeUser({
            email    : email,
            password : password
        }, function(error) {
            if (error === null) {
                console.log("User removed successfully");
            }
            else {
                console.log("Error removing user:", error);
            }
        });
    }

    // ---------------------------------- Event Listeners -----------------------------------

    $('form').submit(function(evt) {
        evt.preventDefault();
        var $this = $(this);

        switch ($this.attr('id')) {
            case 'sign-up':
                signUp($this);
                break;
            case 'give-info':
                giveInfo($this);
                break;
            case 'log-in':
                logIn($this);
                break;
            case 'log-out':
                logOut($this);
                break;
            case 'reset-pass':
                resetPassword($this);
                break;
            case 'change-pass':
                changePassword($this);
                break;
            case 'delete-user':
                deleteUser($this);
                break;
            default:
                console.log('didn\'t recognize the form id');
        }
    });
});