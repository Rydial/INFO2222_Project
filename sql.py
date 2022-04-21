import sqlite3
import os
import hashlib

# This class is a simple handler for all of our SQL database actions
# Practicing a good separation of concerns, we should only ever call 
# These functions from our models

# If you notice anything out of place here, consider it to your advantage and don't spoil the surprise
# test push
class SQLDatabase():
    '''
        Our SQL Database

    '''

    # Get the database running
    def __init__(self, database_arg="users.db"):
        self.conn = sqlite3.connect(database_arg)
        self.cur = self.conn.cursor()

    # SQLite 3 does not natively support multiple commands in a single statement
    # Using this handler restores this functionality
    # This only returns the output of the last command
    def execute(self, sql_string):
        out = None
        for string in sql_string.split(";"):
            try:
                out = self.cur.execute(string)
            except:
                print("failed")
                print(sql_string)
                pass
        return out



    def executemany(self, many_new_data):
        """add many new data to database in one go"""
        out = self.cur.executemany('REPLACE INTO jobs VALUES(?, ?, ?, ?)', many_new_data)

        return out

    # Commit changes to the database
    def commit(self):
        self.conn.commit()

    #-----------------------------------------------------------------------------
    
    # Sets up the database
    # Default admin password
    def database_setup(self, admin_password='a'):

        # Clear the database if needed
        self.execute("DROP TABLE IF EXISTS Users")
        self.execute("DROP TABLE IF EXISTS friendships")

        self.commit()

        # Create the users table
        self.execute("""CREATE TABLE Users(
            username TEXT,
            hashed BLOB,
            admin INTEGER DEFAULT 0,
            online INTEGER DEFAULT 0
        )""")

        self.execute( """CREATE TABLE friendships(
            friendship_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user1 VARCHAR(50) NOT NULL,
            user2 VARCHAR(50) NOT NULL
            
        )""")

        self.execute("""
                INSERT INTO friendships
                VALUES(1, 'Michael', 'Danny')
            """)

        self.execute("""
                INSERT INTO friendships
                VALUES(2, 'Danny', 'Michael')
            """)

        self.commit()

        self.add_user('Michael', 'complex_pwd123', admin=1, online=0)
        self.add_additional_user('Danny', 'pwd_reverse123!', admin=1, online=0)

        
    #-----------------------------------------------------------------------------
    # User handling
    #-----------------------------------------------------------------------------

    # Add a user to the database
    def add_user(self, username, password, admin=0, online=0 ):
        sql_cmd = """
                INSERT INTO Users
                VALUES('{username}', 'temp', {admin}, {online})
            """

        with open('salt.txt', mode='rb') as file: # b is important -> binary
            salt = file.read()
            # print(salt)

        # Hash the Password with the generated Salt
        phash = hashlib.pbkdf2_hmac(
            "sha256",                   # Hash Digest Algorithm
            password.encode("utf-8"),   # Password converted to Bytes
            salt,                       # Salt
            100000,                     # 100,000 iterations of SHA-256
            dklen=128                   # Get a 128 byte hash/key 
        )

        with open('hashed.txt', 'w+b') as f:
            f.write(str.encode(username + '\n') )
            f.write(phash)
        
        sql_cmd = sql_cmd.format(username=username, hashed = phash, admin=admin, online=online)
        self.execute(sql_cmd)

        self.cur.execute("""
            UPDATE users SET hashed = ? WHERE username=?""", (memoryview(phash).tobytes(),username) )
        self.commit()
        return True


    # Add a user to the database
    def add_additional_user(self, username, password, admin=0, online=0):
        sql_cmd = """
                INSERT INTO Users
                VALUES('{username}', 'temp', {admin}, {online})
            """
       
        with open('salt2.txt', mode='rb') as file: # b is important -> binary
            salt2 = file.read()


        phash2 = hashlib.pbkdf2_hmac(
            "sha256",                   # Hash Digest Algorithm
            password.encode("utf-8"),   # Password converted to Bytes
            salt2,                       # Salt
            100000,                     # 100,000 iterations of SHA-256
            dklen=128                   # Get a 128 byte hash/key 
        )

        with open('hashed.txt', 'w+b') as f:
            f.write(str.encode(username + '\n') )
            f.write(phash2)
        
        sql_cmd = sql_cmd.format(username=username, hashed = phash2, admin=admin, online=online)
        self.execute(sql_cmd)

        self.cur.execute("""
            UPDATE users SET hashed = ? WHERE username=?""", (memoryview(phash2).tobytes(),username) )
        self.commit()
        return True
    #-----------------------------------------------------------------------------

    # Check login credentials
    def check_credentials(self, username, password):
       
        print("check\n")
        print(password)
        print("check\n")



        conn = sqlite3.connect('users.db')
  
        # Creating a cursor object using the cursor() method
        cursor = conn.cursor()
        
        with open('salt.txt', mode='rb') as file: # b is important -> binary
            salt = file.read()

        with open('salt2.txt', mode='rb') as file: # b is important -> binary
            salt2 = file.read()
        
            
        # Display data
        print('\nData in USER table:')
        data=cursor.execute("""SELECT * FROM USERS WHERE username=?""", (username,))
        for row in data:
    
            input_hash = hashlib.pbkdf2_hmac(
            "sha256",                   # Hash Digest Algorithm
            password.encode("utf-8"),   # Password converted to Bytes
            salt,                       # Salt
            100000,                     # 100,000 iterations of SHA-256
            dklen=128                   # Get a 128 byte hash/key 
            )

            input_hash2 = hashlib.pbkdf2_hmac(
            "sha256",                   # Hash Digest Algorithm
            password.encode("utf-8"),   # Password converted to Bytes
            salt2,                       # Salt
            100000,                     # 100,000 iterations of SHA-256
            dklen=128                   # Get a 128 byte hash/key 
            )

            if (input_hash == row[1] or input_hash2 == row[1]):
                print("SUCCESSLY VERIFIED")
                conn.commit()
                conn.close()
                return True
            else:
                print("NOT VERIFIED")
                conn.commit()
                conn.close()
                return False
          
       
        # Commit your changes in the database    
        conn.commit()
        
        # Closing the connection
        conn.close()

        return False


    def online(self, username):
        sql_query = """
                UPDATE Users SET online = 1
                WHERE username = '{username}'
            """

        sql_query = sql_query.format(username=username)

        self.execute(sql_query)
        self.commit()
        return True

    def offline(self):
        sql_query = """
                UPDATE Users SET online = 0
                WHERE online = 1
            """

        sql_query = sql_query.format()

        self.execute(sql_query)
        self.commit()
        return True

    def check_online(self):
        sql_query = """
                SELECT * FROM Users
                WHERE online = 1
            """

        sql_query = sql_query.format()
        self.execute(sql_query)
        r = self.cur.fetchone()
        if r:
            return True
        return False

    def check_online_user(self):
        sql_query = """
                SELECT * FROM Users
                WHERE online = 1
            """

        sql_query = sql_query.format()
        self.execute(sql_query)
        a = self.cur.fetchone()
        if a:
            return a
