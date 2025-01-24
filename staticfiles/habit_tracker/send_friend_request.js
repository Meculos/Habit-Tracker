document.addEventListener('DOMContentLoaded', () => {
    fetch('/habit_tracker/api/habit_tracker/points_history/')
        .then(response => response.json())
        .then(data => {
            console.log(data)
            const labels = data.points.map(item => item.date); // Dates for the x-axis
            const points = data.points.map(item => item.points); // Points for the y-axis

            renderPointsChart(labels, points);
        })
        .catch(error => console.error('Error fetching points history:', error));

    document.querySelectorAll('.send_friend_request').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const receiver_id = button.dataset.userId; // Get user ID from the button
            const token = document.querySelector('[name=csrfmiddlewaretoken]').value; // Get CSRF token

            fetch('/habit_tracker/api/habit_tracker/send_friend_request/', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'X-CSRFToken': token,
                },
                body: JSON.stringify({ receiver_id: receiver_id }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    button.classList.add('animate__animated', 'animate__zoomOutLeft');
                    setTimeout(() => {
                        button.classList.remove('animate__zoomOutLeft');
                        button.innerHTML = '<i class="fas fa-handshake"></i> Request Pending';
                        button.classList.remove('btn-primary');
                        button.classList.add('btn-secondary', 'animate__zoomInLeft');
                        button.classList.remove('send_friend_request');
                    }, 1000);
                    console.log(data.message);
                } else {
                    alert(data.message);
                }
            })
            .catch(error => console.log('Error sending request: ', error));
        });
    });
});

let pointsChartInstance; // Global variable to keep track of the chart instance

function renderPointsChart(labels, points) {
    const ctx = document.getElementById('pointsChart').getContext('2d');
    
    // Destroy the existing chart if it exists
    if (pointsChartInstance) {
        pointsChartInstance.destroy();
    }

    // Create a new chart
    pointsChartInstance = new Chart(ctx, {
        type: 'line', // Choose the chart type
        data: {
            labels: labels, // Dates on the x-axis
            datasets: [{
                label: 'Points Over Time',
                data: points, // Points on the y-axis
                backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fill color
                borderColor: 'rgba(75, 192, 192, 1)', // Line color
                borderWidth: 1 // Line thickness
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true, // Start the y-axis at 0
                    title: {
                        display: true,
                        text: 'Points'
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


