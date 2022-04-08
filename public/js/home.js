$(document).ready(()=>{
    // ajax request
    $.get("/api/posts",{followingOnly: true}, results => {
        outputPosts(results, $(".postsContainer"));
    })
})  
