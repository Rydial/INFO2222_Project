'''
    Our Model class
    This should control the actual "logic" of your website
    And nicely abstracts away the program logic from your page loading
    It should exist as a separate layer to any database or data structure that you might be using
    Nothing here should be stateful, if it's stateful let the database handle it
'''
import view
import random
# from no_sql_db import database
import sql

# Initialise our views, all arguments are defaults for the template
page_view = view.View()
sql = sql.SQLDatabase("users.db")
sql.database_setup()


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
# Message
#-----------------------------------------------------------------------------

def message_form():
    '''
        message_form
        Returns the view for the message_form
    '''
    return page_view("message")

#-----------------------------------------------------------------------------
# Message Sent
#-----------------------------------------------------------------------------

def message_sent():
    '''
        message_sent
        Returns the view for a successful message submission
    '''
    return page_view("message_sent")

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
        global current_user
        current_user = username
        print(current_user)
        print("wtafa")
        # sql.login(username)
        return page_view("valid", name=username)
    else:
        print(err_str)
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