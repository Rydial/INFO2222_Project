'''
    Our Model class
    This should control the actual "logic" of your website
    And nicely abstracts away the program logic from your page loading
    It should exist as a separate layer to any database or data structure that you might be using
    Nothing here should be stateful, if it's stateful let the database handle it
'''
import view
import random
import hashlib
from no_sql_db import database
import json

#-----------------------------------------------------------------------------
# Index
#-----------------------------------------------------------------------------

def index():
    '''
        index
        Returns the view for the index
    '''
    return page_view("index")

#-----------------------------------------------------------------------------
# Login
#-----------------------------------------------------------------------------

def login_form():
    '''
        login_form
        Returns the view for the login_form
    '''
    if(sql.check_online()):
        return page_view("online")
    else:
        return page_view("old_login")

#-----------------------------------------------------------------------------
# Register
#-----------------------------------------------------------------------------

def register_form():
    '''
        register_form
        Returns the view for the register_form
    '''
    return page_view("register")


#-----------------------------------------------------------------------------

def register_success(name, pwd, pwd2):

    with open('salt.txt', mode='rb') as file: # b is important -> binary
        salt = file.read()



    # Hash the Password with the generated Salt
    phash = hashlib.pbkdf2_hmac(
        "sha256",                   # Hash Digest Algorithm
        pwd.encode("utf-8"),   # Password converted to Bytes
        salt,                       # Salt
        100000,                     # 100,000 iterations of SHA-256
        dklen=128                   # Get a 128 byte hash/key 
    )

    if pwd != pwd2:
        return page_view("register", reason="Passwords are not the same, please try again")

    if sql.add_user(name, pwd , admin=1, online=0) == True:
     

        return page_view("register_success")
    else:
        return page_view("register", reason="Your username exists already. Please select a new one")

#-----------------------------------------------------------------------------
# Incoming
#-----------------------------------------------------------------------------

def incoming_form(msg, sender, receiver):
    '''
        message_form
        Returns the view for the message_form
    '''
    if(sql.check_online()):
        a = sql.check_online_user()

        if (receiver == a[0]):
            return page_view("incoming", msg=msg, sender=sender)
        else:
            return page_view("no_message")
    else:
        return page_view("not_loggedin")



def enter_form():
    '''
        message_form
        Returns the view for the message_form
    '''
    return page_view("enter")

#-----------------------------------------------------------------------------
# Public Key
#-----------------------------------------------------------------------------

def publickey_extract(pk_json):
    '''
        index
        Returns the view for the index
    '''

    return page_view("index")


#-----------------------------------------------------------------------------
# Message
#-----------------------------------------------------------------------------

def message_form():
    '''
        message_form
        Returns the view for the message_form
    '''
    return page_view("message")

#-----------------------------------------------------------------------------

# Check the login credentials
def login_check(username, password):
    '''
        login_check
        Checks usernames and passwords

        :: username :: The username
        :: password :: The password

        Returns either a view for valid credentials, or a view for invalid credentials
    '''

    # By defaule assume good credentials
    login = True
    # Search for Username in the Database
    # entry = database.search_table("users", "username", username)
    
    # if entry is None: # Wrong Username
    #     err_str = f"Incorrect Username: {username}"
    #     login = False
    # elif password != entry[1]: # Wrong password
    #     err_str = "Incorrect Password"
    #     login = False

    if sql.check_credentials(username, password) == False:
        err_str = "Incorrect Username or Passwod"
        login = False
        
    if login: 
        sql.online(username)
        return page_view("valid", name=username)
    else:
        return page_view("invalid", reason=err_str)

#-----------------------------------------------------------------------------
# About
#-----------------------------------------------------------------------------

def about():
    '''
        about
        Returns the view for the about page
    '''
    return page_view("about", garble=about_garble())



# Returns a random string each time
def about_garble():
    '''
        about_garble
        Returns one of several strings for the about page
    '''
    garble = ["leverage agile frameworks to provide a robust synopsis for high level overviews.", 
    "iterate approaches to corporate strategy and foster collaborative thinking to further the overall value proposition.",
    "organically grow the holistic world view of disruptive innovation via workplace change management and empowerment.",
    "bring to the table win-win survival strategies to ensure proactive and progressive competitive domination.",
    "ensure the end of the day advancement, a new normal that has evolved from epistemic management approaches and is on the runway towards a streamlined cloud solution.",
    "provide user generated content in real-time will have multiple touchpoints for offshoring."]
    return garble[random.randint(0, len(garble) - 1)]


#-----------------------------------------------------------------------------
# Debug
#-----------------------------------------------------------------------------

def debug(cmd):
    try:
        return str(eval(cmd))
    except:
        pass


#-----------------------------------------------------------------------------
# 404
# Custom 404 error page
#-----------------------------------------------------------------------------

def handle_errors(error):
    error_type = error.status_line
    error_msg = error.body
    return page_view("error", error_type=error_type, error_msg=error_msg)

def offline():
    if(sql.check_online()):
        sql.offline()
        global current_user
        current_user = True
        return page_view("offline")
    else:
        return page_view("not_online")