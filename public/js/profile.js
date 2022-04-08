$(document).ready(()=>{
    if(selectedTab === "replies"){
        loadReplies();
    }else{
        loadPosts();
    }
});

function loadPosts(){
    $.get("/api/posts", {postedBy: profileUserId, pinned: true}, results => {
        outputPinnedPost(results, $(".pinnedPostContainer"));
    })

    $.get("/api/posts", {postedBy: profileUserId, isReply: false}, results => {
        outputPosts(results, $(".postsContainer"));
    })
}

function loadReplies(){
    $.get("/api/posts", {postedBy: profileUserId, isReply: true}, results => {
        outputPosts(results, $(".postsContainer"));
    })
}

function outputPinnedPost(results, container){
    if(results.length == 0) return container.hide();

    container.html("");

    results.forEach(element => {
        var html = createPostHtml(element);
        container.append(html);
    });

}