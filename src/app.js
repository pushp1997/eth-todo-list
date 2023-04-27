App = {
    loading: false,
    contracts: {},

    load: async () => {
        await App.loadAccount();
        await App.loadContract();
        await App.render();
    },

    loadAccount: async () => {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        App.account = accounts[0];
        console.log(accounts[0]);
    },

    loadContract: async () => {
        const todoList = await $.getJSON("TodoList.json");

        // Creating a javascript version of the smart contract
        App.contracts.TodoList = TruffleContract(todoList);
        App.contracts.TodoList.setProvider(window.ethereum);

        // Hydrating the smart contract with values from the blockchain
        App.todoList = await App.contracts.TodoList.deployed();
    },

    render: async () => {
        // Preventing double render
        if (App.loading) {
            return;
        }

        // Updating app loading state
        App.setLoading(true);

        // Rendering the loaded account
        $("#account").html(App.account);

        // Rendering Tasks
        await App.renderTasks();

        App.setLoading(false);
    },

    setLoading: async (state) => {
        App.loading = state;

        const loader = $('#loader');
        const content = $('#content');

        if (state) {
            loader.show();
            content.hide();
        }
        else {
            loader.hide();
            content.show();
        }
    },

    renderTasks: async () => {
        // Loading the total task count from the blockchain
        const taskCount = await App.todoList.taskCount();
        const $taskTemplate = $('.taskTemplate');

        // Rendering each task with a new task template
        for (var i = 1; i <= taskCount; i++) {
            // Fetching the task data from the blockchain
            const task = await App.todoList.tasks(i);
            const taskId = task[0].toNumber();
            const taskContent = task[1];
            const taskCompleted = task[2];

            // Creating the html for the task
            const $newTaskTemplate = $taskTemplate.clone();
            $newTaskTemplate.find('.content').html(taskContent);
            $newTaskTemplate.find('input')
                .prop('name', taskId)
                .prop('checked', taskCompleted)
                .on('click', App.toggleCompleted);

            // Putting the task in the correct list
            if (taskCompleted) {
                $('#completedTaskList').prepend($newTaskTemplate);
            } else {
                $('#taskList').prepend($newTaskTemplate);
            }

            // Showing the task
            $newTaskTemplate.show();
        }
    },

    createTask: async () => {
        App.setLoading(true);
        const content = $('#newTask').val();
        await App.todoList.createTask(content, { from: App.account });
        window.location.reload();
    },

    toggleCompleted: async (e) => {
        App.setLoading(true);
        const taskId = e.target.name;
        console.log(taskId);
        await App.todoList.toggleCompleted(taskId, { from: App.account });
        window.location.reload();
    },

}

$(() => {
    $(window).load(() => {
        App.load()
    })
})