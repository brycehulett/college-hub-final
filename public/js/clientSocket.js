var connected = false;

var socket = io("http://localhost:3000");
socket.emit("setup", userLoggedIn);

socket.on("connected", () => connected = true);
socket.on("message received", (newMsg) => msgReceived(newMsg));
socket.on("notification received", (newNotification)=>{
    $.get("/api/notifications/latest", (notificationData)=>{
        refreshNotificationsBadge();
    })
})

function emitNotification(userId){
    if(userId == userLoggedIn._id) return;

    socket.emit("notification received", userId);
}