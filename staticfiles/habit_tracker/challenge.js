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
                    alert("You've already completed this challenge.");
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
        alert("Time's up! You've lost one attempt.");
        attemptsLeft -= 1;

        if (attemptsLeft > 0) {
            alert(`You have ${attemptsLeft} attempts left. Try again.`);
            resetChallenge();
        } else {
            alert("No attempts left. Challenge locked.");
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
                    alert("Correct answer! Points have been added to your account.");
                    lockChallenge();
                    clearInterval(timerInterval);
                } else if (data.attempts_left > 0) {
                    attemptsLeft = data.attempts_left;
                    alert(`Wrong answer. You have ${attemptsLeft} attempts left.`);
                    challengeAnswerInput.value = "";
                } else {
                    alert("Wrong answer. No attempts left.");
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
