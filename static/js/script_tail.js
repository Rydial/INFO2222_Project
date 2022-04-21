
/****************************** Debugging Tools *******************************/

// .then(function() {alert("Success!")}).catch(function(error) {alert(error)});

/****************************** Async Functions *******************************/

async function asyncEncryptMessage(msg)
{
    // Encode Plaintext Message
    var encodedMsg = encodeString(msg);

    // Retrieve the Sender's Signing Private Key
    var senderSignPrivK = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(localStorage.getItem("signPrivK1")),
        {
            name: 'RSA-PSS',
            hash: 'SHA-256'
        },
        true,
        ["sign"]
    );

    // Sign the Encoded Message with the Sender's Signing Private Key
    var signature = await crypto.subtle.sign(
        {
            name: "RSA-PSS",
            saltLength: 32,
        },
        senderSignPrivK,
        encodedMsg
    );

    // Generate an IV (Initialization Vector)
    var iv = crypto.getRandomValues(new Uint8Array(12));

    // Generate an AES Shared Secret Key
    var sharedSK = await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    );

    // Encrypt the Encoded Message with the Secret Key
    var msgCipher = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        sharedSK,
        encodedMsg
    );

    // Retrieve the Receiver's Encryption Public Key (Temp)
    var receiverEncPubK = await crypto.subtle.importKey(
        'jwk',
        JSON.parse(localStorage.getItem("encPubK1")),
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        true,
        ["encrypt"]
    );

    // Export the Secret Key
    var skRaw = await crypto.subtle.exportKey(
        'raw',
        sharedSK
    );

    // Encrypt the Exported Secret Key with the Public Key
    var skCipher = await crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP'
        },
        receiverEncPubK,
        skRaw
    );

    // Store the Encrypted Secret Key
    localStorage.setItem("skCipher", pack(skCipher));

    // Store the Encrypted Message
    localStorage.setItem("msgCipher", pack(msgCipher));

    // Store the IV
    localStorage.setItem("sharedIV", pack(iv));

    // Store the Signature
    localStorage.setItem("signature", pack(signature));
}


async function asyncGenerateKeyPairs()
{
    // Generate 1st Encryption Key Pair
    var encKeyPair1 = await crypto.subtle.generateKey(
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
    var encKeyPair2 = await crypto.subtle.generateKey(
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
    var signKeyPair1 = await crypto.subtle.generateKey(
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
    var signKeyPair2 = await crypto.subtle.generateKey(
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
    var ePrivK1 = await crypto.subtle.exportKey('jwk', encKeyPair1.privateKey);
    var ePubK1 = await crypto.subtle.exportKey('jwk', encKeyPair1.publicKey);
    var ePrivK2 = await crypto.subtle.exportKey('jwk', encKeyPair2.privateKey);
    var ePubK2 = await crypto.subtle.exportKey('jwk', encKeyPair2.publicKey);

    /* Export Signing Key Pairs into JSON Web Keys */
    var sPrivK1 = await crypto.subtle.exportKey('jwk', signKeyPair1.privateKey);
    var sPubK1 = await crypto.subtle.exportKey('jwk', signKeyPair1.publicKey);
    var sPrivK2 = await crypto.subtle.exportKey('jwk', signKeyPair2.privateKey);
    var sPubK2 = await crypto.subtle.exportKey('jwk', signKeyPair2.publicKey);
    
    /* Store Encryption Key Pairs in localStorage */
    localStorage.setItem("encPrivK1", JSON.stringify(ePrivK1));
    localStorage.setItem("encPrivK2", JSON.stringify(ePrivK2));
    localStorage.setItem("encPubK1", JSON.stringify(ePubK1));
    localStorage.setItem("encPubK2", JSON.stringify(ePubK2));

    /* Store Signing Key Pairs in localStorage */
    localStorage.setItem("signPrivK1", JSON.stringify(sPrivK1));
    localStorage.setItem("signPrivK2", JSON.stringify(sPrivK2));
    localStorage.setItem("signPubK1", JSON.stringify(sPubK1));
    localStorage.setItem("signPubK2", JSON.stringify(sPubK2));

    // Create an XML HTTP Request
    var xmlhttp = new XMLHttpRequest();

    // Set Request URL and Method
    xmlhttp.open("POST", "/home");

    // Set the Request Header Content Type to JSON
    // xmlhttp.setRequestHeader("Content-Type", "application/json");

    // Form Data
    let formData = new FormData();
    formData.append("epk1", localStorage.getItem("encPubK1"));
    formData.append("epk2", localStorage.getItem("encPubK2"));
    formData.append("spk1", localStorage.getItem("signPubK1"));
    formData.append("spk2", localStorage.getItem("signPubK2"));

    // Send the Public Key to the Server
    xmlhttp.send(formData);
}

/********************************* Functions **********************************/

function decodeString(encoded)
{
    const decoder = new TextDecoder();

    return decoder.decode(encoded)
}


function decryptMessage()
{
    // Retrieve Receiver's Encryption Private Key and Import it 
    return crypto.subtle.importKey(
        'jwk',
        JSON.parse(localStorage.getItem("encPrivK1")),
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        true,
        ["decrypt"]
    )
    .then(function(receiverEncPrivK) {
        // Retrieve Encrypted Shared Secret Key
        var skCipher = unpack(localStorage.getItem("skCipher"));
        
        // Decrypt and Retrieve the Secret Key Plaintext
        return crypto.subtle.decrypt(
            {
                name: 'RSA-OAEP'
            },
            receiverEncPrivK,
            skCipher
        )
    })
    // Import the Shared Secret Key
    .then(function(skRaw) {
        return crypto.subtle.importKey(
            'raw',
            skRaw,
            {
                name: 'AES-GCM'
            },
            true,
            ['encrypt', 'decrypt']
        )
    })
    // Decrypt and Retrieve the Message
    .then(function(sharedSK) {
        return crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: unpack(localStorage.getItem("sharedIV"))
            },
            sharedSK,
            unpack(localStorage.getItem("msgCipher"))
        )
    })
    .then(function(encodedMsg) {

        // Retrieve the Sender's Signing Public Key
        return crypto.subtle.importKey(
            "jwk",
            JSON.parse(localStorage.getItem("signPubK1")),
            {
                name: 'RSA-PSS',
                hash: 'SHA-256'
            },
            true,
            ["verify"]
        )
        // Verify the Digital Signature with the Public Key
        .then(senderSignPubK => crypto.subtle.verify(
            {
                name: "RSA-PSS",
                saltLength: 32,
            },
            senderSignPubK,
            unpack(localStorage.getItem("signature")),
            encodedMsg
        ))
        .then(function(verified) {
            
            // Check Digital Signature Verification
            if (verified == true)
            {
                // Decode the Encoded Message into Plaintext
                const plaintext = decodeString(encodedMsg);

                return plaintext;
            }
            else
                alert("Digital Signature could not be verified!");
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
    // Retrieve Raw Input from the Message Form
    var inputMsg = document.getElementById('messageTxt').value;
    var msgRecipient = document.getElementById('messageRecipient').value;

    // Store Recipient Username
    localStorage.setItem("receiver", msgRecipient);

    // Store Sender Username
    if (msgRecipient == 'Danny')
        localStorage.setItem('sender', 'Michael');
    else
        localStorage.setItem('sender', 'Danny');

    // Encrypt Input Message
    asyncEncryptMessage(inputMsg);
}


function generateKeyPairs()
{
    // Generate Key Pairs if Non-Existant
    if (localStorage.getItem("encPrivK1") == null)
        asyncGenerateKeyPairs();
    // Debugging [Optional]
    else
    {
        // console.log(localStorage.getItem("encPrivK1"));
        console.log(localStorage.getItem("encPubK1"));

        // console.log(localStorage.getItem("encPrivK2"));
        console.log(localStorage.getItem("encPubK2"));

        console.log(localStorage.getItem("skCipher"));
        console.log(localStorage.getItem("msgCipher"));
        console.log(localStorage.getItem("sharedIV"));
        console.log(localStorage.getItem("signature"));

        console.log(localStorage.getItem("msg"));

        console.log(localStorage.getItem("receiver"));
        console.log(localStorage.getItem("sender"));
    }
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
    formData.append("sender", localStorage.getItem("sender"));
    formData.append("receiver", localStorage.getItem("receiver"));
    decryptMessage().then(function(msg) {
        formData.append("msg", msg);
        xmlhttp.send(formData);
    });
}

/******************************************************************************/

displayMessage();

// localStorage.clear();

// Generate All RSA Public-Private Key Pairs Once (persists forever)
generateKeyPairs();

// Retrive Messege Submit Button Element
var messageButton = document.getElementById('messageSubmitForm');

// Connect Button to encryptMessage Function
// messageButton.addEventListener('submit', encryptMessage);
messageButton.addEventListener('submit', decryptMessage);

