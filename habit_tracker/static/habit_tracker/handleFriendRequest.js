let completionRateChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    fetch('/habit_tracker/api/habit_tracker/habit_completion_rate/')
        .then(response => response.json())
        .then(data => {
            const completed = data.completed;
            const missed = data.missed;

            // Render the chart
            renderCompletionRateChart(completed, missed);
        })
        .catch(error => console.error('Error fetching habit completion rate:', error));

    document.querySelectorAll('.accept-friend-request').forEach(button => {
        button.addEventListener('click', () => {
            const requestId = button.dataset.requestId;
            handleFriendRequest(requestId, 'accept', button);
        });
    });

    document.querySelectorAll('.deny-friend-request').forEach(button => {
        button.addEventListener('click', () => {
            const requestId = button.dataset.requestId;
            handleFriendRequest(requestId, 'deny', button);
        });
    });
});

function renderCompletionRateChart(success, setback) {
    const ctx = document.getElementById('completionRateChart').getContext('2d');
    
    // If a chart instance already exists, destroy it to prevent stacking
    if (completionRateChartInstance) {
        completionRateChartInstance.destroy();
    }

    // Create a new chart instance
    completionRateChartInstance = new Chart(ctx, {
        type: 'doughnut', // or 'pie'
        data: {
            labels: ['Success', 'Setback'],  // Updated labels
            datasets: [{
                data: [success, setback],  // Update to reflect success and setback
                backgroundColor: ['#4caf50', '#f44336'], // Green for success, Red for setback
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            let dataset = tooltipItem.dataset;
                            let label = dataset.labels[tooltipItem.dataIndex] || '';
                            let value = dataset.data[tooltipItem.dataIndex];
                            return `${label}: ${value} logs`;  // Show the data along with the label
                        }
                    }
                }
            }
        }
    });
}

function handleFriendRequest(requestId, action, button) {
    const token = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(`/habit_tracker/api/habit_tracker/friend_request/${action}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token,
        },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`Friend request ${action}ed successfully.`);
            
            // Remove the notification from the DOM
            const notificationElement = button.closest('.notification-item'); // Assuming each notification has a specific wrapper
            if (notificationElement) {
                notificationElement.remove();
            }
        } else {
            console.log(data.message || "Something went wrong.");
        }
    })
    .catch(error => console.error('Error handling friend request:', error));
}
