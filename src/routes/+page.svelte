<script lang="ts">
    import {onMount} from "svelte";
    const version = '1.0.4';

    type Todo = {
        id: number;
        text: string;
        completed: boolean;
    };

    let todos = $state<Todo[]>([]);
    let current_theme = $state(".light");

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

    onMount(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "light" || savedTheme === "dark") {
            current_theme = savedTheme;
        }
        document.body.className = current_theme;
    });


    function toggleTheme() {
        current_theme = current_theme === "light" ? "dark" : "light";
        document.body.className = current_theme;
        localStorage.setItem("theme", current_theme);
    }
</script>

<header>
    <button class="toggle-theme" onclick={toggleTheme}>
        toggle theme
    </button>
</header>

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
    /* Global base styles */
    :global(body), :global(html) {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        height: 100%;
        transition: background-color 0.3s, color 0.3s;
    }

    /* Light theme on body */
    :global(body.light) {
        background-color: #f4f4f4;
        color: #333;
    }

    /* Dark theme on body */
    :global(body.dark) {
        background-color: #121212;
        color: #eee;
    }

    main {
    width: 90%;
    max-width: 600px;
    margin: 3rem auto;  /* centers horizontally */
    background-color: white; /* or theme-based color */
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    transition: background-color 0.3s, color 0.3s;
}

    /* Main container background differs from body */
    :global(body.light) main {
        background-color: #ffffff;
        color: #333;
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        transition: background-color 0.3s, color 0.3s;
    }

    :global(body.dark) main {
        background-color: #1e1e1e;
        color: #ddd;
        box-shadow: 0 10px 20px rgba(255,255,255,0.1);
        transition: background-color 0.3s, color 0.3s;
    }

    /* Header button */
    header {
        display: flex;
        justify-content: flex-end; /* Align button right */
        padding: 1rem 2rem;
    }

    :global(body.light) header {
        background-color: #f0f0f0; /* light gray for light theme */
        color: #333;
    }

:global(body.dark) header {
        background-color: #222; /* dark gray for dark theme */
        color: #eee;
    }

    button.toggle-theme {
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background-color: var(--button-bg, #4CAF50);
    color: white;
    transition: background-color 0.3s ease;
    user-select: none;
    }

    button.toggle-theme:hover {
    background-color: var(--button-hover-bg, #45a049);
    }

    header button {
        width: 100%;
        padding: 0.8rem 1rem;
        font-size: 1.1rem;
        box-sizing: border-box;
        }

    :global(body.light) header button:hover {
        background-color: #ddd;
        color: #111;
    }

    :global(body.dark) header button:hover {
        background-color: #333;
        color: #fff;
    }

    /* Input styles */
    .input input[type="text"] {
        flex: 1;
        padding: 0.6rem;
        border-radius: 6px;
        font-size: 1rem;
        border: 1px solid;
        transition: background-color 0.3s, color 0.3s, border-color 0.3s;
    }

    :global(body.light) .input input[type="text"] {
        background-color: #fff;
        color: #333;
        border-color: #ccc;
    }

    :global(body.dark) .input input[type="text"] {
        background-color: #2a2a2a;
        color: #eee;
        border-color: #555;
    }

    /* Add button */
    .addBTN {
        padding: 0.6rem 1rem;
        font-size: 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    :global(body.light) .addBTN {
        background-color: #4caf50;
        color: white;
    }

    :global(body.light) .addBTN:hover {
        background-color: #45a049;
    }

    :global(body.dark) .addBTN {
        background-color: #388e3c;
        color: white;
    }

    :global(body.dark) .addBTN:hover {
        background-color: #2e7d32;
    }

    /* Filter buttons */
    .filter button {
        padding: 0.4rem 1rem;
        border-radius: 6px;
        border: 1px solid;
        cursor: pointer;
        transition: background-color 0.3s, color 0.3s, border-color 0.3s;
    }

    :global(body.light) .filter button {
        background-color: #eee;
        border-color: #ccc;
        color: #333;
    }

    :global(body.light) .filter button:hover {
        background-color: #ddd;
    }

    :global(body.dark) .filter button {
        background-color: #2a2a2a;
        border-color: #555;
        color: #eee;
    }

    :global(body.dark) .filter button:hover {
        background-color: #444;
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
        border-radius: 6px;
        user-select: none;
        cursor: pointer;
        transition: background-color 0.3s, color 0.3s;
    }

    /* Light mode li */
    :global(body.light) li {
        background-color: #c7c5c5;
        color: #333;
        border-bottom: 1px solid #a5a5a5;
    }

    /* Dark mode li */
    :global(body.dark) li {
        background-color: #333333;
        color: #ddd;
        border-bottom: 1px solid #555555;
    }

    /* Last item no border */
    li:last-child {
        border-bottom: none;
    }

    /* Completed task style */
    .completed {
        text-decoration: line-through;
        opacity: 0.6;
    }

    /* Remove button */
    .removeBTN {
        margin-left: auto;
        background: none;
        border: none;
        color: #e74c3c;
        font-size: 1.2rem;
        cursor: pointer;
        transition: color 0.3s;
    }

    :global(body.light) .removeBTN:hover {
        color: #c0392b;
    }

    :global(body.dark) .removeBTN:hover {
        color: #e57373;
    }

    /* Checkbox */
    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
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

        header {
            padding: 0.5rem 1rem;
        }

        header button {
            padding: 0.4rem 0.8rem;
            font-size: 0.9rem;
        }
    }

    @media (max-width: 400px) {
        main {
            width: 100%;
            margin: 1rem 0;
            border-radius: 0;
            box-shadow: none;
        }

        header {
            padding: 0.3rem 0.5rem;
        }

        header button {
            padding: 0.3rem 0.6rem;
            font-size: 0.8rem;
        }
    }
</style>