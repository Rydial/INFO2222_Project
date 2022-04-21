'''
    This file will handle our typical Bottle requests and responses 
    You should not have anything beyond basic page loads, handling forms and 
    maybe some simple program logic
'''

from bottle import route, get, post, error, request, static_file

import model
import sql


sql = sql.SQLDatabase("users.db")
sql.database_setup()

#-----------------------------------------------------------------------------
# Static file paths
#-----------------------------------------------------------------------------

# Allow image loading
@route('/img/<picture:path>')
def serve_pictures(picture):
    '''
        serve_pictures

        Serves images from static/img/

        :: picture :: A path to the requested picture

        Returns a static file object containing the requested picture
    '''
    return static_file(picture, root='static/img/')

#-----------------------------------------------------------------------------

# Allow CSS
@route('/css/<css:path>')
def serve_css(css):
    '''
        serve_css

        Serves css from static/css/

        :: css :: A path to the requested css

        Returns a static file object containing the requested css
    '''
    return static_file(css, root='static/css/')

#-----------------------------------------------------------------------------

# Allow javascript
@route('/js/<js:path>')
def serve_js(js):
    '''
        serve_js

        Serves js from static/js/

        :: js :: A path to the requested javascript

        Returns a static file object containing the requested javascript
    '''
    return static_file(js, root='static/js/')

#-----------------------------------------------------------------------------
# Pages
#-----------------------------------------------------------------------------

# Redirect to login
@get('/')
@get('/home')
def get_index():
    '''
        get_index
        
        Serves the index page
    '''
    return model.index()

#-----------------------------------------------------------------------------

@post('/home')
def get_public_key():
    '''
        Gets public key from client
    '''
    print(request.json)
    print ("AAA\n\n")
    print(request.json)

    return model.publickey_extract(request.json)
    # print(request.forms.get('pk1'))
    # print(request.forms.get('pk2'))

#-----------------------------------------------------------------------------

# Display the login page
@get('/login')
def get_login_controller():
    '''
        get_login
        
        Serves the login page
    '''
    return model.login_form()

#-----------------------------------------------------------------------------

# Display the register page
@get('/register')
def get_register_controller():
    '''
        get_register
        
        Serves the register page
    '''
    return model.register_form()

#-----------------------------------------------------------------------------

@post("/register")
def post_register_controller():

    username = request.forms.get("username")
    pwd = request.forms.get("pwd")
    pwd2 = request.forms.get("pwd2")

    publicKey = request.json
    print(publicKey)
    print("99\n")
    # Call the appropriate method
    return model.register_success(username, pwd, pwd2)

#-----------------------------------------------------------------------------

@post("/incoming_messaage")
def post_incoming_message_controller():

    # 

    return # page_view()
    pass

#-----------------------------------------------------------------------------

# Display the message page
@get('/message')
def get_message_controller():
    '''
        get_message
        
        Serves the message page
    '''
    return model.message_form()

#-----------------------------------------------------------------------------

@get('/incoming')
def get_incoming_controller():
    '''
        get_message
        
        Serves the message page
    '''
    # print(request.GET.getall('msg'))
    # a = request.json
    print("GET")

    return model.enter_form()

#-----------------------------------------------------------------------------
b = None

# Display the message page
@post('/incoming')
def post_incoming_controller():
    
    global b
    # content = request.

    # Get Decrypted Message from JavaScript
    a = request.json
    # print(a)
    print("POST")
    if (a == None):
        print(a)
    else:
        print(a)
        b = a
        
    if b is None:
        return model.enter_form()

    else:

        return model.incoming_form(b["msg"], b["sender"], b["receiver"])

#-----------------------------------------------------------------------------

# Attempt the login
@post('/login')
def post_login():
    '''
        post_login
        
        Handles login attempts
        Expects a form containing 'username' and 'password' fields
    '''

    # Handle the form processing
    username = request.forms.get('username')
    password = request.forms.get('password')
    
    # Call the appropriate method
    return model.login_check(username, password)

#-----------------------------------------------------------------------------

@post('/message')
def post_message():
    '''
        post_message
        
        Handles message attempts
        Expects a form containing a 'message' field
    '''

    msg = request.forms.get('message')

    # Call the appropriate method
    return model.message_sent()


#-----------------------------------------------------------------------------

@get('/about')
def get_about():
    '''
        get_about
        
        Serves the about page
    '''
    return model.about()



@get('/offline')
def get_offline():
    return model.offline()

#-----------------------------------------------------------------------------

# Help with debugging
@post('/debug/<cmd:path>')
def post_debug(cmd):
    return model.debug(cmd)

#-----------------------------------------------------------------------------

# 404 errors, use the same trick for other types of errors
@error(404)
def error(error): 
    return model.handle_errors(error)

#-----------------------------------------------------------------------------

