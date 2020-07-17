import WebSocket from 'ws'

// hashmap with userID and corresponding websocket
let userIDToSocketMap = new Map()

function getUserIDToSocketMap() {
    return userIDToSocketMap;
}


function setupSocketManagement(wsServer: WebSocket.Server) {
    // called when client connects
    wsServer.on('connection', function(ws: any, req: any) {
        console.log('New Client connected ', req.headers.userid);
        // add socket to socket map
        const userid = req.headers.userid;
        userIDToSocketMap.set(userid, ws)
        console.log(userIDToSocketMap)
        
        ws.on('message', function(msg: String){
            console.log('message received ' + msg);
            ws.send(msg)
        })
        
        ws.on('close', function(){
            userIDToSocketMap.forEach(function deleteSocket(value, key){
                if (ws === value){
                userIDToSocketMap.delete(key);
                return;
                }
            });
            console.log("closing socket")
            console.log(userIDToSocketMap)
        });
        });

    wsServer.on('error', function(e: Error){
    console.log("Error in websocket ", e);
    });
}

export default {setupSocketManagement, getUserIDToSocketMap}


