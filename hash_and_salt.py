import hashlib
import os


###################################################################
#                          Salt & Hashing                         #
###################################################################

# Generate a random salt with a length of 32 bytes
salt = os.urandom(32)

# User Password
password = "user_created_password"

# Hash the Password with the generated Salt
hash = hashlib.pbkdf2_hmac(
    "sha256",                   # Hash Digest Algorithm
    password.encode("utf-8"),   # Password converted to Bytes
    salt,                       # Salt
    100000,                     # 100,000 iterations of SHA-256
    dklen=128                   # Get a 128 byte hash/key 
)

'''
The current hash is a digest object, where we could hex it to
make it human readable.
'''

# Store the Salt and Hash together (Salt has a length of 32 bytes)
storage = salt + hash


###################################################################
#                          Verification                           #
###################################################################

print()

# Grab the User's Password Input
while (user_password_input := input()):

    # Hash the Input Password with the stored Salt
    input_hash = hashlib.pbkdf2_hmac(
        "sha256",
        user_password_input.encode("utf-8"),
        storage[:32],
        100000,
        dklen=128)

    # Check Input Hash with Stored Hash
    if storage[32:] == input_hash:
        print("\nPassword is valid\n")
        break
    else:
        print("\nPassword is invalid\n")