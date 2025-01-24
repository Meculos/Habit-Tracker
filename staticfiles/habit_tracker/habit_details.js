document.addEventListener("DOMContentLoaded", () => {
    const chartCanvas = document.getElementById("habitChart");
    const success = chartCanvas.dataset.success || 0;
    const setback = chartCanvas.dataset.setback || 0;

    const habitctx = chartCanvas.getContext("2d");

    // Render the habit-specific chart
    new Chart(habitctx, {
        type: "doughnut",
        data: {
            labels: ["Successes", "Setbacks"],
            datasets: [{
                label: "Habit Progress",
                data: [success, setback],
                backgroundColor: ["#4caf50", "#f44336"], // Green and Red
                borderColor: ["#3e8e41", "#d32f2f"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Habit Succession Chart'
                }
            }
        }
    });

    // Get the raw JSON data from the 'data-mood-chart' attribute
    const rawData = document.getElementById('moodChart').dataset.moodChart;
    console.log(rawData)

    let moodChartData;

    // Parse the JSON data safely, log an error if parsing fails
    try {
        moodChartData = JSON.parse(rawData);
    } catch (error) {
        console.error("Failed to parse mood chart data:", error);
        moodChartData = [];
    }

    if (moodChartData.length > 0) {
        // Extract date labels and mood data
        const labels = moodChartData.map(item => item.date);
        const data = moodChartData.map(item => item.mood);

        const ctx = document.getElementById("moodChart").getContext("2d");

        // Render the chart
        new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,  // Dates
                datasets: [{
                    label: "Mood Over Time",
                    data: data,  // Mood levels
                    borderColor: "#007bff",
                    backgroundColor: "rgba(0, 123, 255, 0.2)",
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Mood Tracker for this Habit'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Mood Level"
                        },
                        ticks: {
                            callback: function(value) {
                                const moodMap = {
                                    1: "Very Low",
                                    2: "Low",
                                    3: "Neutral",
                                    4: "Good",
                                    5: "Very Good"
                                };
                                return moodMap[value] || value;
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Date"
                        }
                    }
                }
            }
        });
    }
    const progressBar = document.getElementById("progressBar");

    if (progressBar) {
        const progress = parseInt(progressBar.dataset.progress, 10);

        progressBar.style.width = progress + "%";
        progressBar.setAttribute("aria-valuenow", progress);
    }
    const streakChartCtx = document.getElementById("streakLineChart");
    let streakChartData;

    try {
        streakChartData = JSON.parse(streakChartCtx.dataset.streakChart);
    } catch (error) {
        console.error("Failed to parse streak chart data:", error.message);
        return; // Stop execution if parsing fails
    }

    // Proceed only if parsing succeeds
    const labels = streakChartData.map(entry => entry.date);
    const data = streakChartData.map(entry => entry.streak_length);

    new Chart(streakChartCtx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Streak Length",
                    data: data,
                    borderColor: "rgba(54, 162, 235, 1)",
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    fill: true,
                    tension: 0.2,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true },
            },
        },
    });
    const relapseChartCtx = document.getElementById("relapseBarChart");
    const relapseChartData = JSON.parse(relapseChartCtx.dataset.relapseChart);

    const labelsR = relapseChartData.map(entry => entry.date);
    const dataR = relapseChartData.map(entry => entry.relapse_count);

    new Chart(relapseChartCtx, {
        type: "bar",
        data: {
            labels: labelsR,
            datasets: [
                {
                    label: "Relapses",
                    data: dataR,
                    backgroundColor: "rgba(255, 99, 132, 0.6)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
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
});
