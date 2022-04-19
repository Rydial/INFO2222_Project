
/********************************* Functions **********************************/

function decodeString(encoded)
{
    const decoder = new TextDecoder();

    return decoder.decode(encoded)
}


function decryptMessage(cipher, key, iv)
{
    // Unpack Cipher
    var unpacked = unpack(cipher);

    // Decrypt Encrypted Message
    var decrypted = crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        unpacked
    );
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

    // Generate a Key
    var key = generateKey();

    // Generate an IV (Initialization Vector)
    var iv = generateIV();

    // Encrypt the Encoded Message
    var encrypted = crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        encoded
    );

    // Send Encrypted Message back to the Website
    fetch('/message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cipher: pack(encrypted),
            iv: pack(iv)
        })
    });
}


function generateIV()
{
    return crypto.getRandomValues(new Uint8Array(12));
}


function generateKey()
{
    return crypto.subtle.generateKey(
        {
            name: 'AES-GCM',        // Encryption Algorithm
            length: 256             // Key Length
        },
        true,                       // ?
        ['encrypt', 'decrypt']      // Crypto Operations Key can be used for
    );
}


function pack()
{
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}


function unpack()
{
    return (new Uint8Array(atob(base64).split('').map(
        char => char.charCodeAt()))).buffer;
}

/******************************************************************************/

// Retrive Messege Submit Button Element
var messageButton = document.getElementById('messageSubmitForm');

// Connect Button to encryptMessage Function
messageButton.addEventListener('submit', encryptMessage);