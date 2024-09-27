// Define the days of the week
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Flag to track unsaved changes
let hasUnsavedChanges = false;

// Goal for total minutes
const goalMinutes = 210;

// Function to fetch data from weighttrack.app
async function fetchData() {
    try {
        const response = await fetch('https://weighttrack.app/api/schedule');
        const data = await response.json();

        // Set the week title
        setWeekTitle(data);

        // Assuming data.schedule contains the schedule array
        populateTable(data.schedule);
        hasUnsavedChanges = false;
        document.getElementById('submit-data-button').disabled = true;
    } catch (error) {
        console.error('Error fetching data:', error);
        populateTable([]);
    }
}

// Function to set the week title
function setWeekTitle(data) {
    const weekTitleElement = document.getElementById('week-title');
    if (data.weekStartDate && data.weekEndDate) {
        weekTitleElement.textContent = `The week of ${formatDate(data.weekStartDate)} to ${formatDate(data.weekEndDate)}`;
    } else {
        // If week information is not available, show current week
        const currentWeek = getCurrentWeekRange();
        weekTitleElement.textContent = `The week of ${currentWeek.startDate} to ${currentWeek.endDate}`;
    }
}

// Helper function to format dates
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
}

// Function to get the current week's start and end dates
function getCurrentWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    const diffToMonday = (dayOfWeek + 6) % 7; // Days since Monday

    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };

    return {
        startDate: monday.toLocaleDateString(undefined, options),
        endDate: sunday.toLocaleDateString(undefined, options)
    };
}

// Function to populate the table with data
function populateTable(data) {
    const tableBody = document.getElementById('schedule-body');
    tableBody.innerHTML = '';

    daysOfWeek.forEach((day, index) => {
        const dayData = data.find(item => item.day === day) || {};

        const row = document.createElement('tr');

        // Day cell
        const dayCell = document.createElement('td');
        dayCell.textContent = day;
        row.appendChild(dayCell);

        // Minutes input cell
        const minutesCell = document.createElement('td');
        const minutesInput = document.createElement('input');
        minutesInput.type = 'number';
        minutesInput.min = '0';
        minutesInput.value = dayData.minutes || '0';
        minutesInput.addEventListener('input', () => {
            calculateTotalMinutes();
            markAsChanged();
        });
        minutesCell.appendChild(minutesInput);
        row.appendChild(minutesCell);

        // Agree checkbox cell
        const agreeCell = document.createElement('td');
        const agreeCheckbox = document.createElement('input');
        agreeCheckbox.type = 'checkbox';
        agreeCheckbox.checked = dayData.agree || false;
        agreeCheckbox.addEventListener('change', () => {
            if (agreeCheckbox.checked) {
                disputeCheckbox.checked = false;
            }
            markAsChanged();
        });
        agreeCell.appendChild(agreeCheckbox);
        row.appendChild(agreeCell);

        // Dispute checkbox cell
        const disputeCell = document.createElement('td');
        const disputeCheckbox = document.createElement('input');
        disputeCheckbox.type = 'checkbox';
        disputeCheckbox.checked = dayData.dispute || false;
        disputeCheckbox.addEventListener('change', () => {
            if (disputeCheckbox.checked) {
                agreeCheckbox.checked = false;
            }
            markAsChanged();
        });
        disputeCell.appendChild(disputeCheckbox);
        row.appendChild(disputeCell);

        tableBody.appendChild(row);
    });

    calculateTotalMinutes();
}

// Function to mark the form as having unsaved changes
function markAsChanged() {
    hasUnsavedChanges = true;
    document.getElementById('submit-data-button').disabled = false;
}

// Function to calculate the total minutes for the week
function calculateTotalMinutes() {
    let total = 0;
    const minutesInputs = document.querySelectorAll('input[type="number"]');
    minutesInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    document.getElementById('total-minutes').textContent = total;

    // Update goal display
    updateGoalDisplay(total);

    // Update progress bar
    updateProgressBar(total);
}

// Function to update the goal display
function updateGoalDisplay(totalMinutes) {
    const goalCell = document.getElementById('goal-cell');
    goalCell.textContent = `${totalMinutes}/${goalMinutes} minute goal`;
}

// Function to update the progress bar
function updateProgressBar(totalMinutes) {
    const progressBar = document.getElementById('progress-bar');
    const percentage = Math.min((totalMinutes / goalMinutes) * 100, 100);
    progressBar.style.width = percentage + '%';
}

// Function to save data to the server
async function saveData() {
    const rows = document.querySelectorAll('#schedule-body tr');
    const dataToSave = [];

    rows.forEach(row => {
        const day = row.cells[0].textContent;
        const minutes = parseInt(row.cells[1].querySelector('input').value) || 0;
        const agree = row.cells[2].querySelector('input').checked;
        const dispute = row.cells[3].querySelector('input').checked;

        dataToSave.push({ day, minutes, agree, dispute });
    });

    try {
        const response = await fetch('https://weighttrack.app/api/schedule', {
            method: 'POST', // Use 'PUT' or 'PATCH' if appropriate
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSave)
        });

        if (response.ok) {
            alert('Data saved successfully!');
            hasUnsavedChanges = false;
            document.getElementById('submit-data-button').disabled = true;
        } else {
            const errorData = await response.json();
            alert('Failed to save data: ' + (errorData.message || response.statusText));
        }
    } catch (error) {
        console.error('Error saving data:', error);
        alert('An error occurred while saving data.');
    }
}

// Warn the user if they attempt to leave with unsaved changes
window.addEventListener('beforeunload', function (e) {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Event listeners for buttons
document.getElementById('grab-data-button').addEventListener('click', fetchData);
document.getElementById('submit-data-button').addEventListener('click', saveData);

// Dark mode toggle functionality
const darkModeToggle = document.getElementById('dark-mode-toggle');

darkModeToggle.addEventListener('change', toggleDarkMode);

function toggleDarkMode() {
    const body = document.body;

    if (darkModeToggle.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
}

// Apply dark mode if previously selected
window.onload = () => {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    fetchData();
};
