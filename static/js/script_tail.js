
/********************************* Functions **********************************/

function decodeString(encoded)
{
    const decoder = new TextDecoder();

    return decoder.decode(encoded)
}


function decryptMessage()
{
    // Import localStorage Key
    importKey().then(function(key) {
    
        // Retrieve Stored Encrypted Message from localStorage and Unpack it
        var cipher = unpack(localStorage.getItem("encryptedMsg"));

        // Retrive the IV from Local Storage
        var iv = unpack(localStorage.getItem("sharedIV"));

        // Decrypt the Encrypted Message
        crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            cipher
        )
        .then(function(decrypted) {
            const msg = decodeString(decrypted);

            alert(msg);
        });
    });
}


function encodeString(string)
{
    const encoder = new TextEncoder();

    return encoder.encode(string);
}


function encryptMessage()
{
    // Import localStorage Key
    importKey().then(function(key) {

        // Retrieve Raw Input Message from the Website
        var inputMsg = document.getElementById('messageTxt').value;

        // Encode Message
        var encoded = encodeString(inputMsg);

        // Retrive the IV from Local Storage
        var iv = unpack(localStorage.getItem("sharedIV"));

        // Encrypt the Message
        crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encoded
        )
        // Pack and Store the Message in Local Storage
        .then(function(encrypted) {
            const packed = pack(encrypted);

            localStorage.setItem("encryptedMsg", packed);

            // Temporary
            decryptMessage();
        });
    });
}


function exportKey(key)
{
    // Export Key into an ArrayBuffer
    crypto.subtle.exportKey('raw', key)
    // Store Key in localStorage
    .then(function(raw) {
        localStorage.setItem("sharedPrivateKey", pack(raw))
    });
}


function generateKeyandIV()
{
    // Check if key doesn't exists
    if (localStorage.getItem("sharedPrivateKey") == null)
    {
        // Generate and Store Key in localStorage
        crypto.subtle.generateKey(
            {
                name: 'AES-GCM',        // Encryption Algorithm
                length: 256             // Key Length
            },
            true,                       // ?
            ['encrypt', 'decrypt']      // Crypto Operations Key can be used for
        )
        .then(key => exportKey(key));

        // Generate and Store IV in localStorage
        localStorage.setItem(
            "sharedIV",
            pack(crypto.getRandomValues(new Uint8Array(12)))
        );
    }
    else
    {
        console.log(localStorage.getItem("sharedPrivateKey"));
        console.log(localStorage.getItem("sharedIV"));
        console.log(localStorage.getItem("encryptedMsg"));
    }
}


function generateRSAKeyPair()
{
    // Check if user hasn't generated a private key yet
    if (localStorage.getItem("privateKey") == null)
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
            localStorage.setItem("privateKey", JSON.stringify(sK));

            // Store User Public Key in localStorage
            localStorage.setItem("publicKey", JSON.stringify(pK));

            var oReq = new XMLHttpRequest();
            oReq.open("POST", "/home");
            oReq.send(localStorage.getItem("publicKey"));

            // fetch('/',
            //     {
            //         method: 'GET',
            //         headers: {
            //             'Content-Type': 'application/json'
            //         },
            //         body: localStorage.getItem("privateKey")
            //     }
            // ).then(function() {
            // // Request Completed
            // });
        });
    }
    // Debugging [Optional]
    else
    {
        console.log(localStorage.getItem("privateKey"));
        console.log(localStorage.getItem("publicKey")); 
    }
}


function importKey()
{
    // Retrieve Key from localStorage
    const unpacked = unpack(localStorage.getItem("sharedPrivateKey"));

    // Return Imported Key
    return crypto.subtle.importKey(
        'raw',
        unpacked,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
    );
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

// Generate RSA Public-Private Key Pair Once (persists forever)
generateRSAKeyPair();


// Retrive Messege Submit Button Element
var messageButton = document.getElementById('messageSubmitForm');

// Connect Button to encryptMessage Function
messageButton.addEventListener('submit', encryptMessage);