$(document).ready(()=>{
    // ajax request
    $.get("/api/posts/" + postId, results => {
        outputPostsWithReplies(results, $(".postsContainer"));
    })
})  
