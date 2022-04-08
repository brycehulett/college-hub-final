var typing = false;
var lastTypingTime;

$(document).ready(()=>{


    socket.emit("join room", chatId);
    socket.on("typing", ()=>$(".typingDots").show());
    socket.on("stop typing", ()=>$(".typingDots").hide());

    $.get(`/api/chats/${chatId}`, data=> $("#chatName").text(getChatName(data)));
    $.get(`/api/chats/${chatId}/messages`, data=>{
        var lastSenderId = "";
        var msgs = [];
        data.forEach((element, index) => {
            msgs.push(createMessageHtml(element, data[index+1], lastSenderId));
            lastSenderId = element.sender._id;
        });
        

        var msgsHtml = msgs.join("");
        addMessagesHtmlToPage(msgsHtml);
        scrollToBottom(false);

        $('.loadingSpinnerContainer').remove();
        $('.chatContainer').css('visibility','visible');
        
    })
})

function addMessagesHtmlToPage(html){
    $(".chatMessages").append(html);
}

$("#chatNameButton").click(()=>{
    var name = $("#chatNameTextbox").val().trim();
    $.ajax({
        url: "/api/chats/" + chatId,
        type: "PUT",
        data: {chatName: name},
        success: (data, status, xhr) =>{
            if(xhr.status != 204){
                alert('could not update');
            }else{
                location.reload();
            }
        }
    })
})

$(".sendMessageButton").click(()=>{
    messageSubmitted();
})

$(".inputTextbox").keydown((e)=>{

    updateTyping();

    if(e.which === 13){         // 13 is the enter key
        messageSubmitted();
        return false;
    } 
    
})

function updateTyping(){

    if(!connected) return;

    if(!typing){
        typing = true;
        socket.emit("typing", chatId);
    }

    lastTypingTime = new Date().getTime();
    var timerLength = 3000;

    setTimeout(()=>{
        var timeDiff = new Date().getTime() - lastTypingTime;
        if(timeDiff >= timerLength && typing){
            socket.emit("stop typing", chatId);
            typing = false;
        }
    }, timerLength);

    socket.emit("typing", chatId);
}

function messageSubmitted(){
    var content = $(".inputTextbox").val().trim();
    if(content != ""){
        sendMessage(content);
        $(".inputTextbox").val("");
        socket.emit("stop typing", chatId);
        typing = false;
    }
    
}

function sendMessage(content){
    $.post("/api/messages", {content, chatId}, (data, status, xhr)=>{

        if(xhr.status != 201){
            alert('could not send msg');
            $(".inputTextbox").val(content);
            return;
        }

        addChatMessageHtml(data);

        if(connected){
            socket.emit("new message", data);
        }
    })
}

function addChatMessageHtml(msg){
    if(!msg || !msg._id){
        return alert('message invalid')
    }

    var msgDiv = createMessageHtml(msg, null, "");
    addMessagesHtmlToPage(msgDiv);
    scrollToBottom(true);
}

function createMessageHtml(msg, nextMsg, lastSenderId){

    var sender = msg.sender;
    var senderName = sender.firstName + " " + sender.lastName;
    var currentSenderId = sender._id;
    var nextSenderId = nextMsg != null ? nextMsg.sender._id : "";

    var isFirst = lastSenderId != currentSenderId;
    var isLast = nextSenderId != currentSenderId;

    var isMyMsg = msg.sender._id == userLoggedIn._id;
    var liClassName = isMyMsg ? "mine" : "theirs";

    var nameElement = "";

    if(isFirst){
        liClassName += " first";
        if(!isMyMsg){
            nameElement = `<span class='senderName'>${senderName}</span>`;
        }
    }

    var profileImage = "";
    if(isLast){
        liClassName += " last";
        profileImage = `<img src='${sender.profilePic}'>`
    }

    var imageContainer = "";
    if(!isMyMsg){
        imageContainer = `<div class='imageContainer'>
                            ${profileImage}
                          </div>`;
    }

    return `<li class='message ${liClassName}'>
                ${imageContainer}
                <div class='messageContainer'>
                    ${nameElement}
                    <span class='messageBody'>
                        ${msg.content}
                    </span>
                </div>
            </li>`;
}

function scrollToBottom(animated){
    var container = $('.chatMessages');
    var scrollHeight = container[0].scrollHeight;
    if(animated){
        container.animate({scrollTop: scrollHeight}, "slow");
    }else{
        container.scrollTop(scrollHeight);
    }
}