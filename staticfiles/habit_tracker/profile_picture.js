document.addEventListener('DOMContentLoaded', () => {
    let cropper;

    document.querySelector("#profilePicInput").addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const previewImg = document.getElementById("preview-img");
                previewImg.src = event.target.result;

                document.getElementById("crop-area").style.display = "block";

                if (cropper) cropper.destroy(); // Destroy previous instance if any
                cropper = new Cropper(previewImg, {
                    aspectRatio: 1, // Square aspect ratio for profile pictures
                    viewMode: 2,
                });
            };
            reader.readAsDataURL(file);
        }
    });

    document.querySelector("#crop-btn").addEventListener("click", function () {
        const croppedImageData = cropper.getCroppedCanvas().toDataURL(); // Get cropped image as a Base64 string

        fetch("/habit_tracker/api/update_profile_pic/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({ image: croppedImageData })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url;
            } else {
                alert("An error occurred!");
            }
        })
        .catch(error => console.error("Error:", error));
    });
})