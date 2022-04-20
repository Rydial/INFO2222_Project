
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
        JSON.parse(localStorage.getItem("encryptionSK1")),
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
                JSON.parse(localStorage.getItem("encryptionPK1")),
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
    if (localStorage.getItem("encryptionSK1") == null)
    {
        generateEncryptionKeyPairs();
        generateSigningKeyPairs();
    }
    // Debugging [Optional]
    else
    {
        // console.log(localStorage.getItem("encryptionSK1"));
        console.log(localStorage.getItem("encryptionPK1"));

        // console.log(localStorage.getItem("encryptionSK2"));
        console.log(localStorage.getItem("encryptionPK2"));

        console.log(localStorage.getItem("encryptedSK"));
        console.log(localStorage.getItem("encryptedMsg"));
        console.log(localStorage.getItem("sharedIV"));
    }
}


async function generateEncryptionKeyPairs()
{
    // Generate 1st Encryption Key Pair
    var encryptionKeyPair1 = await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );

    // Generate 2nd Encryption Key Pair
    var encryptionKeyPair2 = await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );

    // Generate 1st Signing Key Pair
    var signingKeyPair1 = await crypto.subtle.generateKey(
        {
            name: "RSA-PSS",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["sign", "verify"]
    );

    // Generate 2nd Signing Key Pair
    var signingKeyPair2 = await crypto.subtle.generateKey(
        {
            name: "RSA-PSS",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["sign", "verify"]
    );

    /* Export Encryption Key Pairs into JSON Web Keys */
    var eSK1 = await crypto.subtle.exportKey(
        'jwk', encryptionKeyPair1.privateKey);
    var ePK1 = await crypto.subtle.exportKey(
        'jwk', encryptionKeyPair1.publicKey);
    var eSK2 = await crypto.subtle.exportKey(
        'jwk', encryptionKeyPair2.privateKey);
    var ePK2 = await crypto.subtle.exportKey(
        'jwk', encryptionKeyPair2.publicKey);

    /* Export Signing Key Pairs into JSON Web Keys */
    var sSK1 = await crypto.subtle.exportKey(
        'jwk', signingKeyPair1.privateKey);
    var sPK1 = await crypto.subtle.exportKey(
        'jwk', signingKeyPair1.publicKey);
    var sSK2 = await crypto.subtle.exportKey(
        'jwk', signingKeyPair2.privateKey);
    var sPK2 = await crypto.subtle.exportKey(
        'jwk', signingKeyPair2.publicKey);
    
    // Store User Private Key in localStorage
    localStorage.setItem("encryptionSK1", JSON.stringify(eSK1));
    localStorage.setItem("encryptionSK2", JSON.stringify(eSK2));

    // Store User Public Key in localStorage
    localStorage.setItem("encryptionPK1", JSON.stringify(ePK1));
    localStorage.setItem("encryptionPK2", JSON.stringify(ePK2));

    // Create an XML HTTP Request
    var xmlhttp = new XMLHttpRequest();

    // Set Request URL and Method
    xmlhttp.open("POST", "/home");

    // Set the Request Header Content Type to JSON
    // xmlhttp.setRequestHeader("Content-Type", "application/json");

    // Form Data
    let formData = new FormData();
    formData.append("pk1", localStorage.getItem("encryptionPK1"));
    formData.append("pk2", localStorage.getItem("encryptionPK2"));

    // Send the Public Key to the Server
    xmlhttp.send(formData);
}


function generateSigningKeyPairs()
{

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

function displayMessage()
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", "/incoming");
    let formData = new FormData();
    formData.append("msg", "This is a test - check.");
    xmlhttp.send(formData);
}

/******************************************************************************/

displayMessage();

// localStorage.clear();

// Generate All RSA Public-Private Key Pairs Once (persists forever)
generateKeyPairs();

// Retrive Messege Submit Button Element
var messageButton = document.getElementById('messageSubmitForm');

// Connect Button to encryptMessage Function
messageButton.addEventListener('submit', encryptMessage);

