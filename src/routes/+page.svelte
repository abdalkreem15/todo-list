<script lang="ts">
    type Todo = {
        id: number;
        text: string;
        completed: boolean;
    };

    let todos = $state<Todo[]>([]);

    // Load todos from localStorage at startup
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem("todos");
        if (stored) {
            try {
                todos = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse todos from localStorage:", e);
            }
        }
    }

    // Save todos to localStorage when they change
    $effect(() => {
        localStorage.setItem("todos", JSON.stringify(todos));
    });

    let filter = $state<"all" | "completed" | "incomplete">("all");
    let MSG = $state("");
    let newTodoText = $state("");

    const filteredTodos = $derived(() => {
        if (filter === "all") return todos;
        if (filter === "completed") return todos.filter(t => t.completed);
        if (filter === "incomplete") return todos.filter(t => !t.completed);
        return todos;
    });

    function addTodo() {
        const text = newTodoText.trim();
        if (text === "") {
            MSG = "Please enter a task";
            return;
        }

        MSG = "";
        todos = [
            ...todos,
            {
                id: Date.now(),
                text,
                completed: false
            }
        ];
        newTodoText = "";
    }

    function removeTodo(id: number) {
        todos = todos.filter(todo => todo.id !== id);
    }

    function toggleChecked(id: number) {
        todos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
    }
</script>

<main>
    <h1>📝 My To-Do List</h1>

    <div class="input">
        <input
            type="text"
            bind:value={newTodoText}
            onkeydown={(e) => {
                if (e.key === "Enter") addTodo();
            }}
        />
        <button class="addBTN" onclick={addTodo}>Add</button>
        <p>{MSG}</p>
    </div>

    <div class="filter">
        <button onclick={() => (filter = "all")}>All</button>
        <button onclick={() => (filter = "completed")}>Completed</button>
        <button onclick={() => (filter = "incomplete")}>Incomplete</button>
    </div>

    <div class="list">
        <ul>
            {#each filteredTodos() as todo (todo.id)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <li
                    class:completed={todo.completed}
                    onclick={() => toggleChecked(todo.id)}
                    style="cursor: pointer;"
                >
                    <input
                        type="checkbox"
                        checked={todo.completed}
                        onchange={(e) => {
                        e.stopPropagation(); // prevent li's onclick toggling twice
                        toggleChecked(todo.id);
                        }}
                    />
                    {todo.text}
                    <button
                        class="removeBTN"
                        onclick={(e) => {
                        e.stopPropagation(); // prevent li's onclick when clicking remove button
                        removeTodo(todo.id);
                        }}
                    >
                        ❌
                    </button>
                </li>
            {/each}
        </ul>
    </div>
</main>

<style>
    /* Global styles */
    :global(body), :global(html) {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f4f4;
        color: #333;
        height: 100%;
    }

    /* Main container */
    main {
        width: 90%;
        max-width: 600px;
        margin: 3rem auto;
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }

    /* Title */
    h1 {
        text-align: center;
        margin-bottom: 1rem;
    }

    /* Input section */
    .input {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        align-items: center;
    }

    .input input[type="text"] {
        flex: 1;
        padding: 0.6rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 1rem;
    }

    .addBTN {
        padding: 0.6rem 1rem;
        font-size: 1rem;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .addBTN:hover {
        background-color: #45a049;
    }

    /* Filter buttons */
    .filter {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .filter button {
        padding: 0.4rem 1rem;
        border: 1px solid #ccc;
        background: #eee;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .filter button:hover {
        background-color: #ddd;
    }

    /* Task list */
    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        padding: 0.5rem;
        background: #c7c5c5;
        border-bottom: 1px solid #a5a5a5;

        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    li:last-child {
        border-bottom: none;
    }

    /* Completed tasks */
    .completed {
        text-decoration: line-through;
        color: #888;
        background-color: #a19f9f;
        border-bottom: #717070;
    }

    /* Remove button */
    .removeBTN {
        margin-left: auto;
        background: none;
        border: none;
        color: red;
        cursor: pointer;
        font-size: 1.2rem;
    }

    /* Validation message */
    p {
        margin-top: 0.5rem;
        color: red;
        font-size: 0.9rem;
    }

    /* Responsive styles */
    @media (max-width: 600px) {
        main {
            padding: 1rem;
        }

        h1 {
            font-size: 1.5rem;
        }

        .input,
        .filter {
            flex-direction: column;
            align-items: stretch;
        }

        .input input[type="text"],
        .addBTN,
        .filter button {
            width: 100%;
            box-sizing: border-box;
        }

        .filter {
            gap: 0.5rem;
        }

        .filter button {
            font-size: 0.9rem;
        }

        li {
            flex-direction: column;
            align-items: flex-start;
            font-size: 1rem;
        }

        .removeBTN {
            align-self: flex-end;
            font-size: 1rem;
        }
    }

    @media (max-width: 400px) {
        main {
            width: 100%;
            margin: 1rem 0;
            border-radius: 0;
            box-shadow: none;
        }
    }

</style>