document.addEventListener("DOMContentLoaded", function () {
    const submitButton = document.querySelector("#submitButton");
    const challengeAnswerInput = document.getElementById("challengeAnswer");
    const timerDiv = document.getElementById("timer");
    const challengeId = submitButton.dataset.challengeId;

    const challengeDuration = 60; // Timer duration in seconds
    let timeRemaining = challengeDuration;
    let timerInterval;
    let attemptsLeft;

    // Fetch challenge status from the backend
    function fetchChallengeStatus() {
        fetch(`/habit_tracker/api/habit_tracker/check_answer/${challengeId}/`)
            .then(response => response.json())
            .then(data => {
                attemptsLeft = data.attempts_left;
                if (data.completed || attemptsLeft === 0) {
                    lockChallenge();
                    Swal.fire({
                        title: "Alert!",
                        text: "You've already completed this challenge!",
                        icon: "info",
                        confirmButtonText: "OK"
                      });
                } else {
                    startTimer();
                }
            })
            .catch(error => {
                console.error("Error fetching challenge status:", error);
                alert("Unable to load challenge status. Please try again.");
            });
    }

    // Start the timer
    function startTimer() {
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeRemaining -= 1;
            updateTimerDisplay();

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                handleTimeout();
            }
        }, 1000);
    }

    // Update the timer display
    function updateTimerDisplay() {
        timerDiv.textContent = `Time Remaining: ${timeRemaining}s`;
    }

    // Handle timeout
    function handleTimeout() {
        Swal.fire({
            title: "Alert!",
            text: "Time is up! You've lost 1 attempt",
            icon: "info",
            confirmButtonText: "OK"
          });
        attemptsLeft -= 1;

        if (attemptsLeft > 0) {
            Swal.fire({
                title: "Alert!",
                text: `You have ${attemptsLeft} attempts left. Try again.`,
                icon: "info",
                confirmButtonText: "OK"
            });
            resetChallenge();
        } else {
            Swal.fire({
                title: "Alert!",
                text: "No attempts left. Challenge locked.",
                icon: "info",
                confirmButtonText: "OK"
            });
            lockChallenge();
        }
    }

    // Reset challenge for another attempt
    function resetChallenge() {
        timeRemaining = challengeDuration;
        challengeAnswerInput.value = "";
        startTimer();
    }

    // Lock the challenge (disable input and button)
    function lockChallenge() {
        challengeAnswerInput.disabled = true;
        submitButton.disabled = true;
    }

    // Handle answer submission
    submitButton.addEventListener("click", function () {
        const answer = challengeAnswerInput.value;

        fetch(`/habit_tracker/api/habit_tracker/check_answer/${challengeId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
            },
            body: JSON.stringify({ answer: answer }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.correct) {
                    Swal.fire({
                        title: "Alert!",
                        text: "Correct answer! Points have been added to your account.",
                        icon: "info",
                        confirmButtonText: "OK"
                    });
                    lockChallenge();
                    clearInterval(timerInterval);
                } else if (data.attempts_left > 0) {
                    attemptsLeft = data.attempts_left;
                    Swal.fire({
                        title: "Alert!",
                        text: `Wrong aswer! You have ${attemptsLeft} attempts left.`,
                        icon: "info",
                        confirmButtonText: "OK"
                    });
                    challengeAnswerInput.value = "";
                } else {
                    Swal.fire({
                        title: "Alert!",
                        text: "Wrong answer. No attempts left!",
                        icon: "info",
                        confirmButtonText: "OK"
                    });
                    lockChallenge();
                }
            })
            .catch(error => {
                console.error("Error submitting challenge:", error);
                alert("An error occurred. Please try again later.");
            });
    });

    // Retrieve CSRF token for secure POST requests
    function getCSRFToken() {
        const cookieValue = document.cookie
            .split("; ")
            .find(row => row.startsWith("csrftoken="))
            ?.split("=")[1];
        return cookieValue || "";
    }

    // Fetch the initial challenge status
    fetchChallengeStatus();
});
