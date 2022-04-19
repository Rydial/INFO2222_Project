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

        with open('salt.txt', mode='rb') as file: # b is important -> binary
            salt = file.read()
            print(salt)
        # salt = os.urandom(32)


        # Hash the Password with the generated Salt
        phash = hashlib.pbkdf2_hmac(
            "sha256",                   # Hash Digest Algorithm
            admin_password.encode("utf-8"),   # Password converted to Bytes
            salt,                       # Salt
            100000,                     # 100,000 iterations of SHA-256
            dklen=128                   # Get a 128 byte hash/key 
        )


        # Clear the database if needed
        self.execute("DROP TABLE IF EXISTS Users")
        self.commit()

        # Create the users table
        self.execute("""CREATE TABLE Users(
            username TEXT,
            password TEXT,
            hashed BLOB,
            admin INTEGER DEFAULT 0
        )""")

        self.commit()

        # with open('hashed.txt', 'w+b') as f:
        #     f.write(hash)
        
        # hash2 = memoryview(hash).tobytes()
        # print(hash2.tobytes())
        # print("\n\n\n\n\n")
        # Add our admin user
        self.add_user('a', 'a', phash , admin=1)

        # print(hash2)

        

    #-----------------------------------------------------------------------------
    # User handling
    #-----------------------------------------------------------------------------

    # Add a user to the database
    def add_user(self, username, password, hashed, admin=0):
        sql_cmd = """
                INSERT INTO Users
                VALUES('{username}', '{password}', 'pooka', {admin})
            """
        # print("AAA\n")
        # print(hashed.tobytes())
        # print("AAA\n")

        with open('hashed.txt', 'w+b') as f:
            f.write(str.encode(username + '\n') )
            f.write(hashed)
        
        sql_cmd = sql_cmd.format(username=username, password=password, hashed = hashed, admin=admin)
        print(hashed)
        self.execute(sql_cmd)

        print("a\n")
        self.cur.execute("""
            UPDATE users SET hashed = ? WHERE username=?""", (memoryview(hashed).tobytes(),username) )
        print("9\n")
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
            print(salt)
        
        # Display columns
        # print('\nColumns in EMPLOYEE table:')
        # data=cursor.execute('''SELECT * FROM EMPLOYEE''')
        # for column in data.description:
        #     print(column[0])
            
        # Display data
        print('\nData in USER table:')
        data=cursor.execute("""SELECT * FROM USERS WHERE username=?""", (username,))
        for row in data:
            
            print(row[2])

            print("P\n")     
            input_hash = hashlib.pbkdf2_hmac(
            "sha256",                   # Hash Digest Algorithm
            password.encode("utf-8"),   # Password converted to Bytes
            salt,                       # Salt
            100000,                     # 100,000 iterations of SHA-256
            dklen=128                   # Get a 128 byte hash/key 
            )


            print(input_hash)

            if (input_hash == row[2]):
                print("SUCCESSLY VERIFIED")
            else:
                print("NOT VERIFIED")


            print("P\n")            
       
        # Commit your changes in the database    
        conn.commit()
        
        # Closing the connection
        conn.close()

        
        
        sql_query = """
                SELECT 1 
                FROM Users
                WHERE username = '{username}' AND password = '{password}'
            """

        sql_query = sql_query.format(username=username, password=password)
        self.execute(sql_query)

        # If our query returns
        if self.cur.fetchone():
            return True
        else:
            return False
