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
    const relapseChartCtx = document.getElementById("relapseBarChart");

    // Parse the data from the dataset
    const rawRelapseData = relapseChartCtx.dataset.relapseChart;
    const relapseChartData = JSON.parse(rawRelapseData);
    const combinedData = {};

    // Merge relapse data across all habits by date
    Object.entries(relapseChartData).forEach(([habit, data]) => {
        data.forEach(entry => {
            const date = entry.date;
            if (!combinedData[date]) {
                combinedData[date] = 0;
            }
            combinedData[date] += entry.relapse_count; // Sum up relapses for the same date
        });
    });

    // Prepare combined chart data
    const labelsR = Object.keys(combinedData).sort();
    const dataR = labelsR.map(date => combinedData[date]);

    // Create the chart
    new Chart(relapseChartCtx, {
        type: "bar",
        data: {
            labels: labelsR,
            datasets: [
                {
                    label: "Combined Relapses",
                    data: dataR,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                },
            },
        },
    });
    const combinedMoodCtx = document.getElementById("combinedMoodChart");
    const combinedMoodData = JSON.parse(combinedMoodCtx.dataset.combinedMoodChart);
    console.log('combined mood data: ', combinedMoodData)

    if (!combinedMoodData || combinedMoodData.length === 0) {
        console.log("No combined mood data available");
    } else {
        // Prepare datasets and labels
        const datasets = [];
        let allLabels = new Set();

        combinedMoodData.forEach(habit => {
            const labels = habit.mood_data.map(entry => entry.date);
            const data = habit.mood_data.map(entry => entry.average_mood);

            // Add habit data to datasets
            datasets.push({
                label: habit.habit, // Habit name as the label
                data: data,
                borderColor: getRandomColor(),
                fill: false,
                tension: 0.4,
            });

            // Add all unique dates to labels
            labels.forEach(label => allLabels.add(label));
        });

        // Sort all unique dates
        allLabels = Array.from(allLabels).sort();

        // Generate the chart
        new Chart(combinedMoodCtx, {
            type: "line",
            data: {
                labels: allLabels, // Unique sorted dates
                datasets: datasets,
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: { enabled: true },
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        suggestedMin: 1,
                        suggestedMax: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function (value) {
                                const moodLabels = ["Very Low", "Low", "Neutral", "Good", "Very Good"];
                                return moodLabels[value - 1]; // Convert numeric mood to text
                            },
                        },
                    },
                },
            },
        });
    }

    // Utility function to generate random colors for each dataset
    function getRandomColor() {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r}, ${g}, ${b}, 1)`;
    }
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
