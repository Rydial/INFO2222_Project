import os
import hashlib

class Table():
    def __init__(self, table_name, *table_fields):
        self.entries = []
        self.fields = table_fields
        self.name = table_name

    def create_entry(self, data):
        '''
        Inserts an entry in the table
        Doesn't do any type checking
        '''

        # Bare minimum, we'll check the number of fields
        if len(data) != len(self.fields):
            raise ValueError('Wrong number of fields for table')

        self.entries.append(data)
        return

    def search_table(self, target_field_name, target_value):
        '''
            Search the table given a field name and a target value
            Returns the first entry found that matches
        '''
        # Lazy search for matching entries
        for entry in self.entries:
            for field_name, value in zip(self.fields, entry):
                if target_field_name == field_name and target_value == value:
                    return entry

        # Nothing Found
        return None


class DB():

    '''                          Init-Stage Methods                          '''

    def __init__(self):
        # Initialize Member Variables
        self.tables = {}

        # Read Data from Database CSV File
        self.read_database()
        
        return
    

    def read_database(self):
        # Open the Database CSV File (Closes Automatically)
        with open("database.csv", "a+") as file:

            # Create a new Table Entry "users" in the Database
            self.add_table("users",
                "username",
                "password",
                "salt",
                "admin",
                "loggedIn"
            )

            # Set File Pointer to the Beginning of the File
            file.seek(0)

            # Add each 'entry' into the "users" Table
            for entry in file.readlines():
                self.create_table_entry("users", entry.strip().split(","))

        return

    '''                            Class Methods                             '''

    def add_table(self, table_name, *table_fields):
        table = Table(table_name, *table_fields)
        self.tables[table_name] = table

        return


    def add_user(self, username, password, admin=0, online=0):

        # Generate a random salt with a length of 32 bytes
        salt = os.urandom(32)

        # Hash the Password with the generated Salt
        hash = hashlib.pbkdf2_hmac(
            "sha256",                   # Hash Digest Algorithm
            password.encode("utf-8"),   # Password converted to Bytes
            salt,                       # Salt
            100000,                     # 100,000 iterations of SHA-256
            dklen=128                   # Get a 128 byte hash/key 
        )

        # Add User as a new entry to the 'users' table
        self.create_table_entry("users", [username, hash, salt, admin, online])

        return


    def check_credentials(self, username, password):

        # Retrieve User's Table Entry
        user = self.search_table("users", "username", username)

        # Hash the Input Password with the stored Salt
        input_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            user[2],
            100000,
            dklen=128)
        
        # Check Username and Password Validity
        if user is not None:
            if input_hash == user[1]:
                return True

        return False


    def check_online(self): # ???



        return


    def create_table_entry(self, table_name, data):
        return self.tables[table_name].create_entry(data)


    def offline(self):



        return


    def online(self, username):

        

        return


    def search_table(self, table_name, target_field_name, target_value):
        return self.tables[table_name].search_table(target_field_name, target_value)


# Our global database, Invoke this as needed
database = DB()
