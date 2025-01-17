document.addEventListener('DOMContentLoaded', function() {
    allHabits()
    const allHabitTemplate = document.querySelector('#showHabitsTemplate')
    document.querySelector('#habitsButton').addEventListener('click', allHabits)
    document.querySelector('#createHabitButton').addEventListener('click', habitCreate)
    document.querySelector('#activityButton').addEventListener('click', activityLogs)
    document.querySelector('#habitCreationForm').addEventListener('submit', submitHabitCreate)
    document.querySelector('#archive').addEventListener('click', archivedHabits)
    document.querySelector('#showHabits').addEventListener('click', function(event) {
        if (event.target.classList.contains('logButton')) {
            const habitLogId = document.querySelector('.logButton').dataset.habitId
            console.log(habitLogId)
            logHabit(event);
        }
    });
    document.querySelector('#showHabits').addEventListener('click', function(event) {
        if (event.target.classList.contains('activeButton')) {
            activeLog(event);
        }
    });
    document.querySelector('#showHabits').addEventListener('click', function(event) {
        if (event.target.classList.contains('deleteButton')) {
            deleteHabit(event);
        }
    });
    document.querySelector('#archivedHabits').addEventListener('click', function(event) {
        if (event.target.classList.contains('inactiveButton')) {
            inactiveLog(event);
        }
    });
    document.querySelector('#showHabits').addEventListener('click', function(event) {
        if (event.target.classList.contains('renewButton')) {
            renewHabit(event);
        }
    });
    document.querySelector('#habitLogForm').addEventListener('submit', function (event) {
        event.preventDefault();
        submitLogHabit();
    });
})

function allHabits() {
    document.querySelector('#createHabit').style.display = 'none';
    document.querySelector('#showHabits').style.display = 'block';
    document.querySelector('#logHabit').style.display = 'none';
    document.querySelector('#showAllLogs').style.display = 'none';
    document.querySelector('#archivedHabits').style.display = 'none';

    const allHabitContainer = document.querySelector('#showHabits')
    const allHabitTemplate = document.querySelector('#showHabitsTemplate')

    allHabitContainer.innerHTML = "";

    fetch('/habit_tracker/api/habit_tracker/all_habits/')
    .then(response => response.json())
    .then(data => {
        console.log(data)

        data.habits.forEach(habit => {
            const habitElement = allHabitTemplate.content.cloneNode(true)
            const logButton = habitElement.querySelector('.logButton');
            const activeButton = habitElement.querySelector('.activeButton');

            habitElement.querySelector('.habitName').textContent = habit.habit_name
            habitElement.querySelector('.habitDescription').textContent = habit.description
            if (habit.days_left > 0) {
                habitElement.querySelector('.endHabit').textContent = `${habit.days_left} days left`
            } else {
                habitElement.querySelector('.endHabit').textContent = "Completed"
                if (logButton) {
                    logButton.classList.remove('logButton');
                    logButton.classList.add('deleteButton');
                    logButton.innerHTML = 'Remove Habit';
                }
                if (activeButton) {
                    activeButton.classList.remove('activeButton');
                    activeButton.classList.add('renewButton');
                    activeButton.innerHTML = 'Renew Habit';
                }
            }
            habitElement.querySelector('.habitFrequency').textContent = `Remember to log ${habit.frequency}`
            
            if (logButton) {
                logButton.dataset.habitId = habit.id;
                logButton.addEventListener('click', logHabit);
            }
            if (activeButton) {
                activeButton.dataset.habitId = habit.id;
                activeButton.addEventListener('click', activeLog);
            }

            const deleteButton = habitElement.querySelector('.deleteButton');
            const renewButton = habitElement.querySelector('.renewButton');

            if (deleteButton) {
                deleteButton.dataset.habitId = habit.id;
                deleteButton.addEventListener('click', deleteHabit);
            }
            if (renewButton) {
                renewButton.dataset.habitId = habit.id;
                renewButton.addEventListener('click', renewHabit);
            }

            allHabitContainer.appendChild(habitElement)
        })
    })
    .catch(error => console.log("Error fetching habits:", error))
}

function archivedHabits() {
    document.querySelector('#createHabit').style.display = 'none';
    document.querySelector('#showHabits').style.display = 'none';
    document.querySelector('#logHabit').style.display = 'none';
    document.querySelector('#showAllLogs').style.display = 'none';
    document.querySelector('#archivedHabits').style.display = 'block';

    const allArchivedHabitsContainer = document.querySelector('#archivedHabits');
    const archivedHabitsTemplate = document.querySelector('#archivedHabitsTemplate');

    allArchivedHabitsContainer.innerHTML = "";

    fetch('/habit_tracker/api/habit_tracker/archived_habits/')
    .then(response => response.json())
    .then(data => {
        console.log(data)

        data.habits.forEach(habit => {
            const archivedElement = archivedHabitsTemplate.content.cloneNode(true)

            archivedElement.querySelector('.archivedHabitName').textContent = habit.habit_name
            archivedElement.querySelector('.archivedHabitDescription').textContent = habit.description
            archivedElement.querySelector('.archivedEndHabit').textContent = `${habit.days_left} days left`
            archivedElement.querySelector('.archivedHabitFrequency').textContent = `Remember to log ${habit.frequency}`

            const inactiveButton = archivedElement.querySelector('.inactiveButton')
            inactiveButton.dataset.habitId = habit.id;

            inactiveButton.addEventListener('click', inactiveLog)

            allArchivedHabitsContainer.appendChild(archivedElement)
        })
    })
    .catch(error => console.log("Error fetching archived habits: ", error))
}

function activityLogs() {
    document.querySelector('#createHabit').style.display = 'none';
    document.querySelector('#showHabits').style.display = 'none';
    document.querySelector('#logHabit').style.display = 'none';
    document.querySelector('#showAllLogs').style.display = 'block';
    document.querySelector('#archivedHabits').style.display = 'none';

    const showAllLogsContainer = document.querySelector('#showAllLogs')
    const showAllLogsTemplate = document.querySelector('#showAllLogsTemplate')

    showAllLogsContainer.innerHTML = '';

    fetch('/habit_tracker/api/habit_tracker/activity_logs/')
    .then(response => response.json())
    .then(data => {
        console.log(data)

        data.logs.reverse().forEach(log => {
            const logElement = showAllLogsTemplate.content.cloneNode(true)

            logElement.querySelector('.logHabitName').textContent = log.habit_name
            logElement.querySelector('.logNote').textContent = log.note
            if (log.status) {
                logElement.querySelector('.logActivityStatus').textContent = 'Status: Completed'
            } else {
                logElement.querySelector('.logActivityStatus').textContent = 'Status: Setback'
            }
            logElement.querySelector('.logActivityMood').textContent = log.mood
            logElement.querySelector('.logDate').textContent = log.date

            showAllLogsContainer.appendChild(logElement)
        })
    })
    .catch(error => console.log('Error fetching activity: ', error))
}

function habitCreate(event) {
    event.preventDefault();

    document.querySelector('#createHabit').style.display = 'block';
    document.querySelector('#showHabits').style.display = 'none';
    document.querySelector('#logHabit').style.display = 'none';
    document.querySelector('#showAllLogs').style.display = 'none';
    document.querySelector('#archivedHabits').style.display = 'none';
}

function submitHabitCreate(event) {
    event.preventDefault();

    const habitName = document.querySelector('#habit_name').value;
    const habitDescription = document.querySelector('#habit_description').value;
    const habitFrequency = document.querySelector('#log_frequency').value;
    const habitDuration = document.querySelector('#log_duration').value;
    const csrfToken = document.querySelector('#createHabitCsrfToken').value;

    console.log(csrfToken)

    fetch('/habit_tracker/api/habit_tracker/logging_page/', {
        'method': 'POST',
        'body': JSON.stringify({
            habit_name: habitName,
            habit_description: habitDescription,
            habit_frequency: habitFrequency,
            habit_duration: habitDuration
        }),
        'headers': {
            'content-type': 'application/json',
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result && result.id) {
            const createHabit = document.querySelector('#createHabit')
            createHabit.classList.add('animate__animated', 'animate__fadeOut')
            setTimeout(() => {
                allHabits()
                createHabit.classList.remove('animate__animated', 'animate__fadeOut')
            }, 1000)
        } else {
            alert('Error: Habit could not be created')
        }
    })
    .catch(error => console.log("Error creating habit:", error))
}

function logHabit(event) {
    event.preventDefault()

    document.querySelector('#createHabit').style.display = 'none';
    document.querySelector('#showHabits').style.display = 'none';
    document.querySelector('#logHabit').style.display = 'block';
    document.querySelector('#showAllLogs').style.display = 'none';
    document.querySelector('#archivedHabits').style.display = 'none';

    const habitId = event.target.dataset.habitId
    console.log('ID from button:', habitId)
    document.querySelector('#habitLogForm').dataset.habitId = habitId;
}

function submitLogHabit() {
    const csrfToken = document.querySelector('#logHabitCsrfToken').value;
    const logStatus = document.querySelector('input[name="logStatus"]:checked')?.value;
    const logNote = document.querySelector('#log_notes').value;
    const logMood = document.querySelector('input[name="logMood"]:checked')?.value;
    const habitId = document.querySelector('#habitLogForm').dataset.habitId;
    console.log('id from form:', habitId)
    fetch('/habit_tracker/api/habit_tracker/log_habit/', {
        'method': 'POST',
        'headers': {
            'content-type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        'body': JSON.stringify({
            log_status: logStatus,
            log_note: logNote,
            log_mood: logMood,
            habit_id: habitId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log(data.message)
            activityLogs()
        } else {
            alert('Habit could not be logged')
        }
    })
    .catch(error => console.log("Error logging habit: ", error))
}

function activeLog(event) {
    const habit_id = event.target.dataset.habitId;
    const csrfToken = document.querySelector('#activeButtonCsrfToken').value;

    fetch('/habit_tracker/api/habit_tracker/inactive/', {
        'method': 'POST',
        'headers': {
            'content-type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        'body': JSON.stringify({"habit_id": habit_id})
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log(data.message)
            archivedHabits()
        } else {
            alert(data.error)
        }
    })
}

function deleteHabit(event) {
    const habit_id = event.target.dataset.habitId;
    const csrfToken = document.querySelector('#activeButtonCsrfToken').value;

    fetch('/habit_tracker/api/habit_tracker/delete_habit/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({habit_id: habit_id})
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log(data.message)
            allHabits()
        } else {
            alert(data.error)
        }
    })
    .catch(error => console.log('Error deleting habit: ', error))
}

function inactiveLog(event) {
    const inactiveButtonId = event.target.dataset.habitId
    console.log("inactive id: ", inactiveButtonId)
    const csrfToken = document.querySelector('#deleteButtonCsrfToken').value;

    fetch('/habit_tracker/api/habit_tracker/active/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({'habit_id': inactiveButtonId})
    })
    .then(response => response.json())
    .then(result => {
        if (result.message) {
            console.log(result.message)
            allHabits()
        } else {
            console.log(result.error)
        }
    })
    .catch(error => console.log(error))
}

function renewHabit(event) {
    const habit_id = event.target.dataset.habitId
    const csrfToken = document.querySelector('#renewButtonCsrfToken').value;

    fetch('/habit_tracker/api/habit_tracker/renew_habit/', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({habit_id: habit_id})
    })
    .then(response => response.json())
    .then(result => {
        if (result.message) {
            console.log(result.message)
            allHabits()
        } else {
            console.log(result.error)
        }
    })
    .catch(error => console.log(error))
}