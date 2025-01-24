document.addEventListener("DOMContentLoaded", () => {
    loadComments()
    document.querySelector('#commentForm').addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent form submission
        submitComment();
    });
    document.querySelector('#smallForm').addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent form submission
        submitSmall();
    });
})

function submitComment() {
    const commentContent = document.querySelector('#commentArea').value;
    const postId = document.querySelector('#commentForm').dataset.postId
    const token = document.querySelector('#commentCsrfToken').value;

    fetch('/habit_tracker/api/habit_tracker/comment/', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'X-CSRFToken': token
        },
        body: JSON.stringify({comment: commentContent, post_id: postId})
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log(data.message)
            document.querySelector('#commentArea').value = '';
            loadComments()
        } else {
            console.log(data.error)
        }
    })
    .catch(error => console.log('error posting comment: ', error))
}

function submitSmall() {
    const commentContent = document.querySelector('#smallArea').value;
    const postId = document.querySelector('#smallForm').dataset.postId
    const token = document.querySelector('#smallCsrfToken').value;

    fetch('/habit_tracker/api/habit_tracker/comment/', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'X-CSRFToken': token
        },
        body: JSON.stringify({comment: commentContent, post_id: postId})
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log(data.message)
            document.querySelector('#smallArea').value = '';
            loadComments()
        } else {
            console.log(data.error)
        }
    })
    .catch(error => console.log('error posting comment: ', error))
}

function loadComments() {
    const postId = document.querySelector('#commentForm').dataset.postId;

    fetch(`/habit_tracker/api/habit_tracker/comment?post_id=${postId}`, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            // Selectors for both containers
            const largeDiv = document.querySelector('#commentsDiv');
            const smallDiv = document.querySelector('#smallDiv');
            const largeTemplate = document.querySelector('#commentsTemplate');
            const smallTemplate = document.querySelector('#smallTemplate');

            // Clear previous content
            if (largeDiv) largeDiv.innerHTML = '';
            if (smallDiv) smallDiv.innerHTML = '';

            data.comments.forEach(comment => {
                // Populate largeDiv if visible
                if (largeDiv && largeDiv.offsetParent !== null) {
                    const commentElement = largeTemplate.content.cloneNode(true);
                    const profileURL = `/habit_tracker/profile/${comment.id}/`;
                    commentElement.querySelector('.commentName').innerHTML = `<a href="${profileURL}">${comment.username.charAt(0).toUpperCase() + comment.username.slice(1)}</a>`
                    commentElement.querySelector('.commentDate').textContent = comment.date;
                    commentElement.querySelector('.commentPost').textContent = comment.comment;
                    commentElement.querySelector('img').src = comment.picture;
                    largeDiv.appendChild(commentElement);
                }

                // Populate smallDiv if visible
                if (smallDiv && smallDiv.offsetParent !== null) {
                    const commentElement = smallTemplate.content.cloneNode(true);
                    const profileURL = `/habit_tracker/profile/${comment.id}/`;
                    commentElement.querySelector('.commentName').innerHTML = `<a href="${profileURL}">${comment.username.charAt(0).toUpperCase() + comment.username.slice(1)}</a>`
                    commentElement.querySelector('.commentDate').textContent = comment.date;
                    commentElement.querySelector('.commentPost').textContent = comment.comment;
                    commentElement.querySelector('img').src = comment.picture;
                    smallDiv.appendChild(commentElement);
                }
            });
        })
        .catch(error => console.log('Error fetching comments: ', error));
}