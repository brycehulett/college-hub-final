// globals
var cropper, timer;
var selectedUsers = [];

$("#postTextarea, #replyTextarea").keyup(e=>{
    var textbox = $(e.target);
    var value = textbox.val().trim();

    var isModal = textbox.parents(".modal").length == 1;  
    var submitButton = isModal ? $("#submitReplyButton") : $("#submitPostButton");

    if(submitButton.length == 0){
        return alert("no submit button found");  // comment out when rdy to deploy
    }

    if(value == ""){
        submitButton.prop("disabled", true);
        return;
    }

    submitButton.prop("disabled", false);
})

$("#submitPostButton, #submitReplyButton").click((e)=>{
    var button = $(e.target);
    var isModal = button.parents(".modal").length == 1;  
    var textbox = isModal? $("#replyTextarea"):$("#postTextarea");

    var data = {
        content: textbox.val()
    }

    if(isModal){
        var id = button.data().id;
        if(id == null) return alert("button id is null");
        data.replyTo = id;
    }

    // ajax request
    $.post("/api/posts", data, postData => {

        if(postData.replyTo){
            location.reload();
        }else{
            var html = createPostHtml(postData);    
            $(".postsContainer").prepend(html);
            textbox.val("");
            button.prop("disabled", true);
        }
    })
})


$("#fileUploadButton").click((e)=>{
    
    var button = $(e.target);
    var textbox = $("#postTextarea");

    var data = {
        content: textbox.val()
    }
    var data = new FormData($('#uploadForm')[0]);
    $.ajax({
        url:'api/posts/files',
        type: 'POST',
        contentType: false,
        processData: false,
        cache: false,
        data: data,
        success: () => location.reload()
    });

    // ajax request
    // $.post("/api/posts/upload", data, postData => {
    //         // var html = createPostHtml(postData);    
    //         // $(".postsContainer").prepend(html);
    //         textbox.val("");
    //         button.prop("disabled", true);
        
    // })
})

$("#replyModal").on("show.bs.modal", (e)=>{
    var button = $(e.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#submitReplyButton").data("id", postId);

    $.get("/api/posts/" + postId, results => {
        outputPosts(results.postData, $("#originalPostContainer"));
    })
})

$("#deletePostModal").on("show.bs.modal", (e)=>{
    
    var button = $(e.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#deletePostButton").data("id", postId);
})

$("#confirmPinModal").on("show.bs.modal", (e)=>{
    
    var button = $(e.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#pinPostButton").data("id", postId);
})

$("#unpinModal").on("show.bs.modal", (e)=>{
    
    var button = $(e.relatedTarget);
    var postId = getPostIdFromElement(button);
    $("#unpinPostButton").data("id", postId);
})

$("#deletePostButton").click((e)=>{
    var postId = $(e.target).data("id");

    // submit ajax request to delete
    $.ajax({
        url: `/api/posts/${postId}/`,
        type: "DELETE",
        success: (data, status, xhr)=>{
            if(xhr.status != 202){
                return alert("Could not delete post")
            }
            location.reload();
        } 
    })
})

$("#pinPostButton").click((e)=>{
    var postId = $(e.target).data("id");

    // submit ajax request to delete
    $.ajax({
        url: `/api/posts/${postId}/`,
        type: "PUT",
        data: {pinned:true},
        success: (data, status, xhr)=>{
            if(xhr.status != 204){
                return alert("Could not update pin")
            }
            location.reload();
        } 
    })
})

$("#unpinPostButton").click((e)=>{
    var postId = $(e.target).data("id");

    // submit ajax request to delete
    $.ajax({
        url: `/api/posts/${postId}/`,
        type: "PUT",
        data: {pinned:false},
        success: (data, status, xhr)=>{
            if(xhr.status != 204){
                return alert("Could not unpin")
            }
            location.reload();
        } 
    })
})

$("#replyModal").on("hidden.bs.modal", e => $("#originalPostContainer").html(""))

$("#coverPhoto").change((e)=>{
    var input = $(e.target)[0];
    //console.log(input);
    if(input.files && input.files[0]){
        var reader = new FileReader();
        reader.onload = (e) =>{
            var image = document.getElementById("coverPreview");
            image.src = e.target.result;
            //$("#imagePreview").attr("src", e.target.result);

            if(cropper !== undefined){
                cropper.destroy();
            }
            cropper = new Cropper(image, {
                aspectRatio: 16 / 9,
                background: false
            });

        }
        reader.readAsDataURL(input.files[0]);
    }
})

$("#imageUploadButton").click(()=>{
    var canvas = cropper.getCroppedCanvas();

    if(canvas == null) return alert("could not upload image")

    canvas.toBlob((blob)=>{
        var formData = new FormData();
        formData.append("croppedImage", blob);
        
        $.ajax({
            url: "/api/users/profilePicture",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => location.reload()
        })
    })

})

$("#coverPhotoButton").click(()=>{
    var canvas = cropper.getCroppedCanvas();

    if(canvas == null) return alert("could not upload image")

    canvas.toBlob((blob)=>{
        var formData = new FormData();
        formData.append("croppedImage", blob);
        
        $.ajax({
            url: "/api/users/coverPhoto",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: () => location.reload()
        })
    })

})

$("#userSearchTextbox").keydown((e)=>{
    clearTimeout(timer);
    var textbox = $(e.target);
    var value = textbox.val();

    if(value == "" && (e.which == 9 || e.keyCode == 8)){
        // remove 1 user from selection
        selectedUsers.pop();
        updateSelectedUsersHtml();
        $(".resultsContainer").html("");
        if(selectedUsers.length == 0) $("#createChatButton").prop("disabled", true);
        return;
    }

    timer = setTimeout(() =>{
        value = textbox.val().trim();

        if(value == ""){
            $(".resultsContainer").html("");
        }else{
            searchUsers(value);
        }
    }, 1000);
})

$("#createChatButton").click(()=>{
    var data = JSON.stringify(selectedUsers);
    $.post("/api/chats", {users:data}, chat => {
        if(!chat || !chat._id) return alert("invalid response from sever");
        window.location.href = `/messages/${chat._id}`;
    })
})

$(document).on("click",".lightMode",(e)=>{
    // Switch to Light Mode
    if (document.documentElement.getAttribute("color-mode") == "dark") {
        // Sets the custom html attribute
        document.documentElement.setAttribute("color-mode", "light"); // Sets the user's preference in local storage
        localStorage.setItem("color-mode", "light");
        return;
      }
      /* Switch to Dark Mode and Sets the custom html attribute */
      document.documentElement.setAttribute("color-mode", "dark"); // Sets the user's preference in local storage

      localStorage.setItem("color-mode", "dark");
})

$(document).on("click",".likeButton",(e)=>{
    var button = $(e.target);
    var postId = getPostIdFromElement(button);

    if(postId === undefined) return;

    // submit ajax request to update/put
    $.ajax({
        url: `/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData)=>{
            button.find("span").text(postData.likes.length || "");
            if(postData.likes.includes(userLoggedIn._id)){
                button.addClass("active");
            }else{
                button.removeClass("active");
            }
        } 
    })
})

$(document).on("click", ".retweetButton",(e)=>{
    var button = $(e.target);
    var postId = getPostIdFromElement(button);

    if(postId === undefined) return;

    // submit ajax request to update/put
    $.ajax({
        url: `/api/posts/${postId}/retweet`,
        type: "POST",
        success: (postData)=>{
            button.find("span").text(postData.retweetUsers.length || "");
            if(postData.retweetUsers.includes(userLoggedIn._id)){
                button.addClass("active");
            }else{
                button.removeClass("active");
            }
        } 
    })

})

$(document).on("click", ".post",(e)=>{
    var element = $(e.target);
    var postId = getPostIdFromElement(element);

    if(postId !== undefined && !element.is("button")){
        window.location.href = '/posts/' + postId;
    }
})

$(document).on("click", ".followButton",(e)=>{
    var button = $(e.target);
    var userId = button.data().user;
        // submit ajax request to update record
        $.ajax({
            url: `/api/users/${userId}/follow`,
            type: "PUT",
            success: (data, status, xhr)=>{
                if(xhr.status == 404){
                    return;
                }
                var difference = 1;
                if(data.following && data.following.includes(userId)){
                    button.addClass("following");
                    button.text("Following");
                }else{
                    button.removeClass("following");
                    button.text("Follow");
                    difference = -1;
                }
                var followersLabel = $("#followersValue");
                if(followersLabel.length != 0){
                    var followersText = parseInt(followersLabel.text());
                    followersLabel.text(followersText + difference);
                }
            } 
        })
})

function getPostIdFromElement(element){
    var isRoot = element.hasClass("post");
    var rootElement = isRoot ? element: element.closest(".post");
    return rootElement.data().id;
}


function createPostHtml(postData, largeFont = false){

    if(postData == null) return alert("post object is null");

    var isRetweet = postData.retweetData !== undefined;
    var retweetedBy = isRetweet ? postData.postedBy.username : null;
    postData = isRetweet ? postData.retweetData : postData;

    var postedBy = postData.postedBy;
    var displayName = postedBy.firstName + " " + postedBy.lastName;
    var timestamp = timeDifference(new Date(), new Date(postData.createdAt));

    var likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active":"";
    var retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active":"";
    var largeFontClass = largeFont ? "largeFont": "";

    var retweetText = "";
    if(isRetweet){
        retweetText =   `<span class="retweetGreen">
                            <i class="fas fa-retweet"></i>
                            Reposted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>
                        </span>`;
    }

    var fileText = "";
    if(postData.filePath != undefined){
        var extension = postData.filePath.split('.').pop();
        if(extension == 'txt'){
            fileText = `<embed src="${postData.filePath}">;`
            fileText = `<object data="${postData.filePath}" type="text/plain">
                            <p>No Support?</p>
                            </object>
            `;
            
        }else if(extension == 'pdf'){
            fileText = `<embed src="${postData.filePath}" width="800px" height="1000px" />`;
        }
        else{
            fileText = 
                `<span class="fileUploadImage">
                    <img src="${postData.filePath}" alt="uploaded file">
                </span>`;
        }
    }

    var replyFlag = "";
    if(postData.replyTo && postData.replyTo._id){
        if(!postData.replyTo._id){
            return alert("reply to not populated")
        }else if(!postData.replyTo.postedBy._id){
            return alert("posted by not populated")
        }
        var replyToUsername = postData.replyTo.postedBy.username;
        replyFlag = `<div class='replyFlag'>
                        Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                    </div>`;
    }

    var buttons = "";
    var pinnedPostText = "";
    if(postData.postedBy._id == userLoggedIn._id){
        var pinnedClass = "";
        var dataTarget = "#confirmPinModal";
        if(postData.pinned === true){
            pinnedClass = "active";
            dataTarget = "#unpinModal";
            pinnedPostText = "<i class='fas fa-thumbtack'></i> <span>Pinned Post</span>";
        }

        buttons =   `<button class='pinButton ${pinnedClass}' data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}"><i class='fas fa-thumbtack'></i></button>
                     <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class='fas fa-times'></i></button>`
    }

    return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
                <div class='postActionContainer'>
                    ${retweetText}
                </div>
                <div class='mainContentContainer'>
                    <div class='userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>
                    <div class='postContentContainer'>
                        <div class='pinnedPostText'>${pinnedPostText}</div>
                        <div class='header'>
                            <a href='/profile/${postedBy.username}' class='displayName'>${displayName}</a>
                            <span class='username'>@${postedBy.username}</span>
                            <span class='date'>${timestamp}</span>
                            ${buttons}
                        </div>
                        ${replyFlag}
                        <div class='postBody'>
                            <span>${postData.content}</span>
                        </div>
                        <div class='postBodyFile'>
                            ${fileText}
                        </div>
                        <div class='postFooter'>
                            <div class='postButtonContainer'>
                                <button data-toggle='modal' data-target='#replyModal'>
                                    <i class="fa-solid fa-comment"></i>
                                </button>
                            </div>
                            <div class='postButtonContainer green'>
                                <button class='retweetButton ${retweetButtonActiveClass}'>
                                    <i class="fas fa-retweet"></i>
                                    <span>${postData.retweetUsers.length || ""}</span>
                                </button>
                            </div>
                            <div class='postButtonContainer red'>
                                <button class='likeButton ${likeButtonActiveClass}'>
                                    <i class="fa-solid fa-heart"></i>
                                    <span>${postData.likes.length || ""}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
}

function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if(elapsed/1000 < 30)
            return "Just now"
         return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}

function outputPosts(results, container){
    container.html("");
    if(!Array.isArray(results)){
        results = [results];
    }
    results.forEach(element => {
        var html = createPostHtml(element);
        container.append(html);
    });

    if(results.length == 0){
        container.append("<span class='noResults'>Nothing to show</span>");
    }
}

function outputPostsWithReplies(results, container){
    container.html("");

    if(results.replyTo !== undefined && results.replyTo._id !== undefined){
        var html = createPostHtml(results.replyTo);
        container.append(html);
    }

    var mainPostHtml = createPostHtml(results.postData, true);
    container.append(mainPostHtml);

    results.replies.forEach(element => {
        var html = createPostHtml(element);
        container.append(html);
    });
}

function outputUsers(results, container){
    container.html("");
    results.forEach(result => {
        var html = createUserHtml(result, true);
        container.append(html);
    });

    if(results.length == 0){
        container.append("<span class='noResults'>No results found</span>");
    }
}

function createUserHtml(userData, showFollowButton){

    var name = userData.firstName + " " + userData.lastName;
    var isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
    var text = isFollowing ? "Following" : "Follow"
    var buttonClass = isFollowing ? "followButton following" : "followButton"
    var followButton = "";

    if(showFollowButton && userLoggedIn._id != userData._id){
        followButton = `<div class='followButtonContainer'>
                            <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                        </div>`
    }

    return `<div class='user'>
                <div class='userImageContainer'>
                    <img src='${userData.profilePic}'>
                </div> 
                <div class='userDetailsContainer'>
                    <div class='header'>
                        <a href='/profile/${userData.username}'>${name}</a>
                        <span class='username'>@${userData.username}</span>
                    </div>
                </div>
                ${followButton}   
            </div>`
}

function searchUsers(searchTerm){
    $.get("/api/users", {search: searchTerm}, results =>{
        outputSelectableUsers(results, $(".resultsContainer"));
    })
}

function outputSelectableUsers(results, container){
    container.html("");
    results.forEach(result => {

        if(result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)){
            return;
        }

        var html = createUserHtml(result, false);
        var element = $(html);
        element.click(()=> userSelected(result));
        container.append(element);
    });

    if(results.length == 0){
        container.append("<span class='noResults'>No results found</span>");
    }
}

function userSelected(user){
    selectedUsers.push(user);
    updateSelectedUsersHtml();
    $("#userSearchTextbox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled", false);
}

function updateSelectedUsersHtml(){
    var elements = [];

    selectedUsers.forEach(user =>{
        var name = user.firstName + " " + user.lastName;
        var userElement = $(`<span class='selectedUser'>${name}</span>`)
        elements.push(userElement);
    })

    $(".selectedUser").remove();
    $("#selectedUsers").prepend(elements);
}

function getChatName(chatData){
    var chatName = chatData.chatName;
    // use the chat name or set to usersname
    if(!chatName){
        var otherChatUsers = getOtherChatUsers(chatData.users);
        var namesAry = otherChatUsers.map(user=>user.firstName + " " + user.lastName);
        chatName = namesAry.join(", ");
    }
    return chatName;
}

function getOtherChatUsers(users){
    //console.log(users);
    if(users.length == 1) return users;  // chat w/ yourself
    return users.filter(user=>user._id != userLoggedIn._id);
}

function msgReceived(newMsg){
    if($(".chatContainer").length == 0){
        // show some notification
    }else{
        addChatMessageHtml(newMsg);
    }
}