App = {
    loading: false,
    contracts: {},

    load: async () => {
        await App.loadAccount();
        await App.loadContract();
        await App.render();
    },

    loadAccount: async () => {
        // Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        // Set the current blockchain account
        App.account = await web3.eth.defaultAccount;
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
        await App.todoList.toggleCompleted(taskId, { from: App.account });
        window.location.reload();
    },

}

$(() => {
    $(window).load(() => {
        App.load()
    })
})