
/* Useful Debugging Line */
// .then(function() {alert("Success!")}).catch(function(error) {alert(error)});


/********************************* Functions **********************************/

function decodeString(encoded)
{
    const decoder = new TextDecoder();

    return decoder.decode(encoded)
}


function decryptMessage()
{
    // Retrieve User Private Key from localStorage and Import it 
    crypto.subtle.importKey(
        'jwk',
        JSON.parse(localStorage.getItem("privateKey1")),
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        true,
        ["decrypt"]
    )
    .then(function(userPK) {

        // Retrieve Encrypted Shared Secret Key
        var sharedSKCipher = unpack(localStorage.getItem("encryptedSK"));

        // Decrypt and Retrieve the Secret Key
        return crypto.subtle.decrypt(
            {
                name: 'RSA-OAEP'
            },
            userPK,
            sharedSKCipher
        )
    })
    .then(function(sharedSKRaw) {
        return crypto.subtle.importKey(
            'raw',
            sharedSKRaw,
            {
                name: 'AES-GCM'
            },
            true,
            ['encrypt', 'decrypt']
        )
    })
    .then(function(sharedSK) {

        // Decrypt and Retrieve the Message
        return crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: unpack(localStorage.getItem("sharedIV"))
            },
            sharedSK,
            unpack(localStorage.getItem("encryptedMsg"))
        )
    })
    .then(function(plaintext) {
        const msg = decodeString(plaintext);

        alert(msg);
    });
}


function encodeString(string)
{
    const encoder = new TextEncoder();

    return encoder.encode(string);
}


function encryptMessage()
{
    // Retrieve Raw Input Message from the Website
    var inputMsg = document.getElementById('messageTxt').value;

    // Encode Message
    var encoded = encodeString(inputMsg);

    // Generate an IV (Initialization Vector)
    var iv = crypto.getRandomValues(new Uint8Array(12));

    // Generate an AES Shared Secret Key
    crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    )
    .then(function(sharedSK) {

        // Encrypt the Message with the Secret Key
        crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            sharedSK,
            encoded
        )
        .then(function(encryptedMsg) {

            // Retrive the Recipient's Public Key (Temp)
            crypto.subtle.importKey(
                'jwk',
                JSON.parse(localStorage.getItem("publicKey1")),
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256'
                },
                true,
                ["encrypt"]
            )
            .then(function(recipientPK) {

                // Export the Secret Key into a String
                crypto.subtle.exportKey(
                    'raw',
                    sharedSK
                )
                .then(function(rawSK) {

                    // Encrypt the Secret Key with the Public Key
                    crypto.subtle.encrypt(
                        {
                            name: 'RSA-OAEP'
                        },
                        recipientPK,
                        rawSK
                    )
                    .then(function(encryptedSK) {
                        
                        // Store the Encrypted Secret Key
                        localStorage.setItem("encryptedSK", pack(encryptedSK));

                        // Store the Encrypted Message
                        localStorage.setItem("encryptedMsg", pack(encryptedMsg));

                        // Store the IV
                        localStorage.setItem("sharedIV", pack(iv));

                        // TEMPORARY
                        decryptMessage();
                    });
                });
            });
        });
    });
}


function generateKeyPairs()
{
    // Check if user hasn't generated a private key yet
    if (localStorage.getItem("privateKey1") == null)
    {
        generateRSAKeyPair('1');
        generateRSAKeyPair('2');
    }
    // Debugging [Optional]
    else
    {
        // console.log(localStorage.getItem("privateKey1"));
        console.log(localStorage.getItem("publicKey1"));

        // console.log(localStorage.getItem("privateKey2"));
        console.log(localStorage.getItem("publicKey2"));

        console.log(localStorage.getItem("encryptedSK"));
        console.log(localStorage.getItem("encryptedMsg"));
        console.log(localStorage.getItem("sharedIV"));
    }
}


function generateRSAKeyPair(num)
{
    // Generate Key Pair
    crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    )
    // Export Key Pair using JSON Web Key Format
    .then(async function(keyPair) {

        /* Export Private and Public Key into JSON Web Keys */
        var privateKey = await crypto.subtle.exportKey(
            'jwk', keyPair.privateKey);
        var publicKey = await crypto.subtle.exportKey(
            'jwk', keyPair.publicKey);

        // Pack and Export Keys as Strings
        return [privateKey, publicKey];
    })
    .then(function([sK, pK]) {

        // Store User Private Key in localStorage
        localStorage.setItem("privateKey" + num, JSON.stringify(sK));

        // Store User Public Key in localStorage
        localStorage.setItem("publicKey" + num, JSON.stringify(pK));
        
        // Create an XML HTTP Request
        var xmlhttp = new XMLHttpRequest();

        // Set Request URL and Method
        xmlhttp.open("POST", "/home");

        // Set the Request Header Content Type to JSON
        xmlhttp.setRequestHeader("Content-Type", "application/json");

        // Send the Public Key to the Server
        xmlhttp.send(localStorage.getItem("publicKey" + num));
    });
}


function pack(arrayBuffer)
{
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}


function unpack(base64)
{
    return (new Uint8Array(atob(base64).split('').map(
        char => char.charCodeAt()))).buffer;
}

/******************************************************************************/

// localStorage.clear();

// Generate All RSA Public-Private Key Pairs Once (persists forever)
generateKeyPairs();

// Retrive Messege Submit Button Element
var messageButton = document.getElementById('messageSubmitForm');

// Connect Button to encryptMessage Function
messageButton.addEventListener('submit', encryptMessage);