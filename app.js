

$(document).ready(function () {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let streak = parseInt(localStorage.getItem('streak')) || 0;
    let lastDate = localStorage.getItem('lastDate') || new Date().toISOString().slice(0, 10);

    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    updateAchievement();

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks(filter=null) {
        $('#task-list').empty();
        updateTaskStats();

        tasks.forEach((task, index) => {
            if (filter && task.checked !== filter) return;

            const $taskItem = $('<li>').addClass('taskItem').hide().fadeIn(300);
            const $checkbox = $('<input>').attr('type', 'checkbox').addClass('checkbox').prop('checked', task.checked);
            const $taskNameElem = $('<p>').attr('id', 'task-name').text(task.name);
            const $taskTimeElem = $('<p>').attr('id', 'task-time').text(task.time);
            const $taskCategoryElem = $('<p>').attr('id', 'task-category').text(task.category.charAt(0).toUpperCase() + task.category.slice(1));
            const $modifyDiv = $('<div>').addClass('modify');
            const $editIcon = $('<img>').attr({ id: 'edit', src: 'images/edit.png', alt: 'Edit Icon' });
            const $deleteIcon = $('<img>').attr({ id: 'delete', src: 'images/delete.png', alt: 'Delete Icon' });

            $modifyDiv.append($editIcon).append($deleteIcon);
            $taskItem.append($checkbox).append($taskNameElem).append($taskTimeElem).append($taskCategoryElem).append($modifyDiv);
            $('#task-list').append($taskItem);

            $deleteIcon.click(function () {
                $taskItem.fadeOut(300, function () {
                    tasks.splice(index, 1);
                    saveTasks();
                    renderTasks();
                });
            });

            $editIcon.click(function () {
                $editIcon.hide();
                const $taskNameInput = $('<input>').attr('type', 'text').val(task.name);
                const $taskTimeInput = $('<input>').attr('type', 'datetime-local').val(task.time);
                const $categorySelect = $('<select>').html(`
                    <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>Personal</option>
                    <option value="fitness" ${task.category === 'fitness' ? 'selected' : ''}>Fitness</option>
                    <option value="hobby" ${task.category === 'hobby' ? 'selected' : ''}>Hobby</option>
                    <option value="others" ${task.category === 'others' ? 'selected' : ''}>Others</option>
                `);
             
                const $saveButton = $('<button>').text('SAVE').addClass('save-btn');

                $taskNameElem.replaceWith($taskNameInput);
                $taskTimeElem.replaceWith($taskTimeInput);
                $taskCategoryElem.replaceWith($categorySelect);
                $modifyDiv.append($saveButton);

                $saveButton.click(function () {
                    task.name = $taskNameInput.val();
                    task.time = $taskTimeInput.val();
                    task.category = $categorySelect.val();
                    saveTasks();
                    renderTasks();
                });
            });

            $checkbox.change(function () {
                task.checked = this.checked;
                saveTasks();
                updateTaskStats();
            });
        });
    }

    function updateTaskStats() {
        const completedTasks = tasks.filter(task => task.checked).length;
        $('#task-stats').text(`${completedTasks} / ${tasks.length}`);
    }

    function updateStreak() {
        const today = new Date().toISOString().slice(0, 10);
        if (lastDate !== today) {
            if (tasks.every(task => task.checked)) {
                streak++;
            } else {
                streak = 0;
            }
            localStorage.setItem('streak', streak);
            lastDate = today;
            localStorage.setItem('lastDate', lastDate);
            updateAchievement();
        }
    }

    function updateAchievement() {
        let achievement = 'Bronze';
        if (streak >= 30) achievement = 'Elite';
        if (streak >= 90) achievement = 'Master';
        if (streak >= 180) achievement = 'Grandmaster';
        if (streak >= 365) achievement = 'Legend';

        $('#achievement').text(`Achievement: ${achievement}`);
    }

    $('#newtask').click(function (event) {
        event.preventDefault();

        const taskName = $('#input-task').val();
        const taskTime = $('#input-time').val();
        const taskCategory = $('#category').val();

        if (!taskName || !taskTime || !taskCategory) {
            alert('Please fill all fields!');
            return;
        }

        const task = {
            checked: false,
            name: taskName,
            time: taskTime,
            category: taskCategory,
            recurrence: recurrence,
            notified: false
        };

        tasks.push(task);
        saveTasks();
        renderTasks();

        if (tasks.length === 1 && taskCategory !== 'fitness') {
            $('#custom-alert').css('display', 'block');
        }

        $('#input-task').val('');
        $('#input-time').val('');
        $('#category').val('');
        $('#recurrence').val('none');
    });

    $('#alert-ok').click(function() {
        $('#custom-alert').css('display', 'none');
    });

    $('#history').click(function() {
        $('#history-popup').css('display', 'block');
        $('#history-list').empty();
        const completedTasks = tasks.filter(task => task.checked);
        completedTasks.forEach(task => {
            $('#history-list').append(`<li>${task.name} - ${task.time} (${task.category})</li>`);
        });
    });

    $('#history-ok').click(function() {
        $('#history-popup').css('display', 'none');
    });

    

    $('#delete-all').click(function () {
        if (confirm("Are you sure you want to delete all tasks?")) {
            tasks.length = 0; 
            saveTasks();
            renderTasks();
        }
    });

    function checkTaskNotifications() {
        const now = new Date();
        const currentTime = now.toISOString().slice(0, 16);

        tasks.forEach(task => {
            if (task.time === currentTime && !task.notified) {
                new Notification("Task Reminder", {
                    body: `Time for: ${task.name}`,
                });
                task.notified = true;
                saveTasks();
            }

           
            if (task.recurrence === 'daily') {
                task.time = new Date(Date.now() + 86400000).toISOString().slice(0, 16); 
            } else if (task.recurrence === 'weekly') {
                task.time = new Date(Date.now() + 604800000).toISOString().slice(0, 16); 
            } else if (task.recurrence === 'monthly') {
                const date = new Date();
                date.setMonth(date.getMonth() + 1);
                task.time = date.toISOString().slice(0, 16); 
            }
        });
        saveTasks();
    }

    setInterval(checkTaskNotifications, 60000);
    renderTasks();
    updateStreak();
    
    $(document).ready(function () {

        const achievement = $('#achievement').text().replace('Achievement: ', '');
        const msg = encodeURIComponent(`🎯 Just hit ${achievement} level! 🚀💪 On a ${streak} day streak! Happy to share  this with you 🎉🎉`);
        const title = encodeURIComponent('My Todo List');

        $('.whatsapp').attr('href', `https://api.whatsapp.com/send?text=${msg}`);
        $('.telegram').attr('href', `https://telegram.me/share/url?text=${msg}`);
    });

    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            updateStreak();
        }
    }, 60000);
});
