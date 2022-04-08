$(document).ready(()=>{
    $.get("/api/chats", (data, status, xhr) =>{
        if(xhr.status == 400){
            alert('could not get chat list');
        }
        else{
            outputChatLists(data, $(".resultsContainer"));
        }
    })
})

function outputChatLists(chatList, container){
    //console.log(chatList);
    chatList.forEach(element => {
        var html = createChatHtml(element);
        container.append(html);
    });

    if(chatList.length == 0){
        container.append("<span class='noResults'>Nothing to show.</span>")
    }
}

function createChatHtml(chatData){
    var chatName = getChatName(chatData);
    var image = getChatImageElements(chatData);
    var latestMessage = getLatestMessage(chatData.latestMessage);

    return `<a href='/messages/${chatData._id}' class='resultListItem'>
                ${image}
                <div class='resultsDetailsContainer ellipsis'>
                    <span class='heading ellipsis'>${chatName}</span>
                    <span class='subText ellipsis'>${latestMessage}</span>
                </div>
            </a>`;
}

function getLatestMessage(latestMessage){
    if(latestMessage != null){
        var sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
    }
    return 'New Chat';
}

function getChatImageElements(chatData){
    var ary = getOtherChatUsers(chatData.users);

    var groupChatClass = "";
    var chatImage = getUserChatImageElement(ary[0]);

    if(ary.length > 1){
        groupChatClass = "groupChatImage";
        chatImage += getUserChatImageElement(ary[1]);
    }
    return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
}

function getUserChatImageElement(user){
    if(!user || !user.profilePic){
        return alert('user arg invalid');
    }
    return `<img src='${user.profilePic}' alt='Users Profile Pic'>`;
}