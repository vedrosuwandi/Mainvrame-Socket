require('dotenv').config();

const io = require('socket.io')(8980, {
    cors : {
        origin : process.env.LOCAL_URL
    }
});

// contains { userID and socketID }
let users = [];

const sendUser = (userID , socketID) =>{
    if(userID !== null){
        // to prevent the same id
        !users.some(user =>
            user.userID === userID
        ) 
        && 
        users.push({userID, socketID})
    }
}

// set the user into the filtered user array
const removeUser = (socketID) =>{
    users = users.filter(user => user.socketID !== socketID); 
}

// Get user based on the userID
const getUser = (userID) =>{
    return users.find(user=>
        user.userID === userID
    )
}



io.on("connection", (socket)=>{
    // when user is connected to socket server
    console.log("User Connected : " + socket.id)

    // retrieve UserID and SocketID from user (Client)
    socket.on("SendUser" , userID =>{
        sendUser(userID, socket.id);
        // Send getUsers data to client
        io.emit("getUsers" , users);
    });

    // retrieve message from client
    socket.on("SendMessage" , ({_id , userID, receiverID , text})=>{
        // get the receiver user data
        const user = getUser(receiverID);
        // send the text to the client
        io.to(user?.socketID).emit("getMessage", {
           _id, userID , text
        })
    })

    //Unsend Message 
    socket.on("UnsentMessage" , ({Message , ReceiverID})=>{
        const user = getUser(ReceiverID);
        io.to(user?.socketID).emit("currentMessage" , Message);
    })
    


    socket.on("sendData", ({data, UserID})=>{
        const user = getUser(UserID);
        if(user?.socketID != undefined){
            io.to(user.socketID).emit("getNewConversation" , data);
        }
    })


    // when user is disconnected with socket server
    socket.on("disconnect" , ()=>{
        console.log("User Disconnected")
        removeUser(socket.id)
        io.emit("getUsers" , users);
    })
})