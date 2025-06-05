<script lang="ts">
    import {onMount} from "svelte";
    const version = '1.0.4';

    type Todo = {
        id: number;
        text: string;
        completed: boolean;
    };

    let todos = $state<Todo[]>([]);
    let current_theme = $state("light"); // Default to 'light' theme
    // svelte-ignore non_reactive_update
        let draggedTodoId: number | null = null; // To store the ID of the todo being dragged
    let hoveredTodoId: number | null = $state(null); // To store the ID of the todo being hovered over

    // Load todos from localStorage at startup
    // This block runs client-side after the component is mounted.
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem("todos");
        if (stored) {
            try {
                todos = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse todos from localStorage:", e);
                // Clear invalid data to prevent further errors
                localStorage.removeItem("todos");
            }
        }
    }

    // Save todos to localStorage when they change
    // This Svelte effect reacts to changes in the 'todos' state.
    $effect(() => {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem("todos", JSON.stringify(todos));
        }
    });

    let filter = $state<"all" | "completed" | "incomplete">("all");
    let MSG = $state(""); // Message for validation or feedback
    let newTodoText = $state(""); // Binds to the new todo input field

    // Derived state for filtered todos based on the current filter
    const filteredTodos = $derived(() => {
        if (filter === "all") return todos;
        if (filter === "completed") return todos.filter(t => t.completed);
        if (filter === "incomplete") return todos.filter(t => !t.completed);
        return todos; // Fallback, though filters cover all cases
    });

    // Function to add a new todo item
    function addTodo() {
        const text = newTodoText.trim();
        if (text === "") {
            MSG = "Please enter a task";
            return;
        }

        MSG = ""; // Clear message on successful input
        todos = [
            ...todos, // Spread existing todos
            {
                id: Date.now(), // Unique ID for the new todo
                text,
                completed: false // New todos are incomplete by default
            }
        ];
        newTodoText = ""; // Clear input field
    }

    // Function to remove a todo item by its ID
    function removeTodo(id: number) {
        todos = todos.filter(todo => todo.id !== id);
    }

    // Function to toggle the 'completed' status of a todo item
    function toggleChecked(id: number) {
        todos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
    }

    // Lifecycle hook: runs after the component is first mounted to the DOM
    onMount(() => {
        // Load theme preference from localStorage
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "light" || savedTheme === "dark") {
            current_theme = savedTheme;
        }
        // Apply the theme class to the body element
        document.body.className = current_theme;
    });

    // Function to toggle between light and dark themes
    function toggleTheme() {
        current_theme = current_theme === "light" ? "dark" : "light";
        document.body.className = current_theme;
        localStorage.setItem("theme", current_theme); // Save preference
    }

    // --- Drag and Drop Functions ---

    // Handler when a drag operation starts on a list item
    function handleDragStart(event: DragEvent, id: number) {
        draggedTodoId = id; // Store the ID of the item being dragged
        event.dataTransfer?.setData("text/plain", id.toString());
    }

    // Handler when a dragged item is moved over a potential drop target
    function handleDragOver(event: DragEvent, id: number) {
        event.preventDefault(); // Crucial: Allows us to drop

        if (draggedTodoId !== id) { // Prevent showing drag-over on the dragged item itself
            hoveredTodoId = id; // Set the ID of the todo being hovered over
        } else {
            hoveredTodoId = null; // Clear if hovering over self
        }
    }

    // Handler when a dragged item leaves a potential drop target
    function handleDragLeave(event: DragEvent, id: number) {
        if (hoveredTodoId === id) {
            hoveredTodoId = null; // Clear hovered ID if the current item is left
        }
    }

    // Handler when a dragged item is dropped on a target
    function handleDrop(event: DragEvent, targetId: number) {
        event.preventDefault(); // Prevent default browser behavior

        // Reset hovered ID immediately after drop
        hoveredTodoId = null;

        // If no item was being dragged, or it was dropped on itself, do nothing
        if (draggedTodoId === null || draggedTodoId === targetId) {
            draggedTodoId = null; // Ensure draggedTodoId is reset
            return;
        }

        // Find the indices of the dragged and target items in the current todos array
        const draggedIndex = todos.findIndex(t => t.id === draggedTodoId);
        const targetIndex = todos.findIndex(t => t.id === targetId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            const newTodos = [...todos]; // Create a shallow copy to modify
            const [removed] = newTodos.splice(draggedIndex, 1); // Remove the dragged item
            newTodos.splice(targetIndex, 0, removed); // Insert it at the new position

            todos = newTodos; // Update the Svelte state, triggering a re-render
        }
        draggedTodoId = null; // Reset the dragged ID after the drop
    }

    // Handler when the drag operation ends (whether successful or cancelled)
    function handleDragEnd(event: DragEvent) {
        draggedTodoId = null; // Reset the dragged ID
        hoveredTodoId = null; // Ensure hovered ID is also reset
    }
</script>

<header>
    <button class="toggle-theme" onclick={toggleTheme}>
        Toggle Theme
    </button>
</header>

<main>
    <h1>📝 My To-Do List</h1>

    <div class="input">
        <input
            type="text"
            bind:value={newTodoText}
            placeholder="Add a new task..."
            onkeydown={(e) => {
                if (e.key === "Enter") addTodo();
            }}
        />
        <button class="addBTN" onclick={addTodo}>Add</button>
        <p>{MSG}</p>
    </div>

    <div class="filter">
        <button onclick={() => (filter = "all")} class:active={filter === 'all'}>All</button>
        <button onclick={() => (filter = "completed")} class:active={filter === 'completed'}>Completed</button>
        <button onclick={() => (filter = "incomplete")} class:active={filter === 'incomplete'}>Incomplete</button>
    </div>

    <div class="list">
        <ul>
            {#each filteredTodos() as todo (todo.id)}
                <!-- Removed svelte-ignore a11y_click_events_have_key_events as the primary click target is now the li -->
                <!-- Removed svelte-ignore a11y_no_noninteractive_element_interactions for the same reason -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <li
                    class:completed={todo.completed}
                    class:dragging={todo.id === draggedTodoId}
                    class:drag-over={todo.id === hoveredTodoId && todo.id !== draggedTodoId}
                    onclick={() => toggleChecked(todo.id)} 
                    style="cursor: pointer; {todo.id === draggedTodoId ? 'cursor: grabbing;' : 'cursor: grab;'}"
                    draggable="true"
                    ondragstart={(e) => handleDragStart(e, todo.id)}
                    ondragover={(e) => handleDragOver(e, todo.id)}
                    ondragleave={(e) => handleDragLeave(e, todo.id)}
                    ondrop={(e) => handleDrop(e, todo.id)}
                    ondragend={handleDragEnd}
                >
                    <input
                        type="checkbox"
                        checked={todo.completed}
                        onchange={(e) => {
                        e.stopPropagation(); // VERY IMPORTANT: Stops the click from bubbling up to the li
                        toggleChecked(todo.id);
                        }}
                    />
                    <!-- Text content for the todo item -->
                    <span style="flex-grow: 1;">{todo.text}</span>
                    <button
                        class="removeBTN"
                        onclick={(e) => {
                        e.stopPropagation(); // VERY IMPORTANT: Prevents li's onclick when clicking remove button
                        removeTodo(todo.id);
                        }}
                        aria-label="Remove task"
                    >
                        ❌
                    </button>
                </li>
            {/each}
        </ul>
        {#if filteredTodos().length === 0}
            <p class="no-tasks-message">No tasks to display for the current filter.</p>
        {/if}
    </div>
</main>

<style>
    /* Global base styles */
    :global(*),
    :global(*::before),
    :global(*::after) {
        box-sizing: border-box;
    }

    :global(body), :global(html) {
        margin: 0;
        padding: 0;
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        height: 100%;
        transition: background-color 0.3s, color 0.3s;
        overflow-x: hidden;
        max-width: 100vw;
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
        overflow-x: hidden;
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

    h1 {
        text-align: center;
        margin-bottom: 2rem;
        font-size: 2.2rem;
        color: #333; /* Default for light theme, overridden by dark theme below */
    }

    :global(body.dark) h1 {
        color: #eee;
    }

    /* Header button */
    header {
        display: flex;
        justify-content: flex-end; /* Align button right */
        padding: 1rem 2rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
        background-color: #4CAF50; /* A pleasant green */
        color: white;
        transition: background-color 0.3s ease, transform 0.1s ease;
        user-select: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    button.toggle-theme:hover {
        background-color: #45a049;
        transform: translateY(-2px); /* Slight lift effect */
    }

    button.toggle-theme:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }


    /* Input section */
    .input {
        display: flex;
        gap: 0.8rem;
        margin-bottom: 1.5rem;
        align-items: center;
    }

    .input input[type="text"] {
        flex: 1;
        padding: 0.8rem;
        border-radius: 8px;
        font-size: 1rem;
        border: 1px solid;
        transition: background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
    }

    :global(body.light) .input input[type="text"]:focus {
        border-color: #4CAF50;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
        outline: none;
    }

    :global(body.dark) .input input[type="text"]:focus {
        border-color: #388e3c;
        box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.3);
        outline: none;
    }

    /* Add button */
    .addBTN {
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.1s ease;
        user-select: none;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    :global(body.light) .addBTN {
        background-color: #4caf50;
        color: white;
    }

    :global(body.light) .addBTN:hover {
        background-color: #45a049;
        transform: translateY(-2px);
    }
    :global(body.light) .addBTN:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    :global(body.dark) .addBTN {
        background-color: #388e3c;
        color: white;
    }

    :global(body.dark) .addBTN:hover {
        background-color: #2e7d32;
        transform: translateY(-2px);
    }
    :global(body.dark) .addBTN:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }


    /* Filter buttons container */
    .filter {
        display: flex;
        justify-content: center;
        gap: 0.8rem;
        margin-bottom: 1.5rem;
    }

    /* Filter buttons */
    .filter button {
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        border: 1px solid;
        cursor: pointer;
        transition: background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s;
        font-weight: 500;
        user-select: none;
    }

    :global(body.light) .filter button {
        background-color: #eee;
        border-color: #ccc;
        color: #333;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    :global(body.light) .filter button:hover {
        background-color: #ddd;
        border-color: #bbb;
    }
    :global(body.light) .filter button.active {
        background-color: #4CAF50;
        color: white;
        border-color: #4CAF50;
        box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
    }
    :global(body.light) .filter button.active:hover {
        background-color: #45a049;
        border-color: #45a049;
    }

    :global(body.dark) .filter button {
        background-color: #2a2a2a;
        border-color: #555;
        color: #eee;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    :global(body.dark) .filter button:hover {
        background-color: #444;
        border-color: #777;
    }
    :global(body.dark) .filter button.active {
        background-color: #388e3c;
        color: white;
        border-color: #388e3c;
        box-shadow: 0 4px 8px rgba(56, 142, 60, 0.3);
    }
    :global(body.dark) .filter button.active:hover {
        background-color: #2e7d32;
        border-color: #2e7d32;
    }

    /* Task list */
    ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }

    li {
        display: flex;
        align-items: center;
        gap: 0.8rem; /* Increased gap for better spacing */
        margin-bottom: 0.8rem; /* Increased margin for better separation */
        padding: 0.8rem 1rem; /* More padding for a softer look */
        border-radius: 8px; /* Slightly more rounded corners */
        user-select: none;
        /* cursor will be dynamically set by style attribute */
        transition: background-color 0.3s, color 0.3s, box-shadow 0.2s;
        min-height: 48px; /* Ensure sufficient height for drag-and-drop */
        box-shadow: 0 2px 5px rgba(0,0,0,0.07);
        position: relative; /* For drag-over border positioning */
    }

    li:last-child {
        margin-bottom: 0; /* No margin for the last item */
    }

    /* Light mode li */
    :global(body.light) li {
        background-color: #e0e0e0;
        color: #333;
    }
    :global(body.light) li:hover {
        background-color: #d0d0d0;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    /* Dark mode li */
    :global(body.dark) li {
        background-color: #333333;
        color: #ddd;
    }
    :global(body.dark) li:hover {
        background-color: #444444;
        box-shadow: 0 4px 8px rgba(255,255,255,0.05);
    }


    /* Completed task style */
    .completed {
        text-decoration: line-through;
        opacity: 0.6;
        font-style: italic;
    }

    /* Remove button */
    .removeBTN {
        margin-left: auto;
        background: none;
        border: none;
        color: #e74c3c; /* Red color */
        font-size: 1.3rem; /* Slightly larger icon */
        cursor: pointer;
        transition: color 0.3s, transform 0.1s ease;
        padding: 0.5rem;
        border-radius: 50%; /* Make it circular */
        line-height: 1; /* For better vertical alignment of emoji */
    }

    :global(body.light) .removeBTN:hover {
        color: #c0392b;
        transform: scale(1.1);
    }

    :global(body.dark) .removeBTN:hover {
        color: #ff8a80; /* Lighter red for dark theme */
        transform: scale(1.1);
    }

    /* Checkbox */
    input[type="checkbox"] {
        width: 20px; /* Slightly larger checkbox */
        height: 20px;
        cursor: pointer;
        accent-color: #4CAF50; /* Green accent color */
        margin-right: 0.5rem; /* Space between checkbox and text */
        flex-shrink: 0; /* Prevent checkbox from shrinking */
    }

    /* Validation message */
    p {
        margin-top: 0.5rem;
        color: red;
        font-size: 0.9rem;
        text-align: center;
    }

    .no-tasks-message {
        text-align: center;
        color: #888;
        padding: 2rem;
        font-style: italic;
    }
    :global(body.dark) .no-tasks-message {
        color: #aaa;
    }

    /* --- Drag and Drop Visual Feedback --- */

    li.dragging {
        opacity: 0.4; /* Item being dragged is semi-transparent */
        box-shadow: 0 8px 15px rgba(0,0,0,0.2); /* More prominent shadow */
        transform: scale(0.98); /* Slight scale down */
        /* cursor is now set dynamically via style attribute */
    }

    li.drag-over {
        /* This creates a visual border at the intended insertion point */
        border-top: 3px solid #4CAF50; /* Green border for drop indication */
        padding-top: calc(0.8rem - 3px); /* Adjust padding to keep height consistent */
    }
    /* Ensure the drag-over visual doesn't interfere with the actual item's height */
    li.drag-over + li {
        margin-top: 0; /* Prevents double margin if drag-over and next item both have margin-bottom */
    }

    /* Responsive styles */
    @media (max-width: 600px) {
        :global(html), :global(body) {
            overflow-x: hidden;
            max-width: 100vw;
        }

        main {
            width: 100vw;
            max-width: 100vw;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0;
            box-shadow: none;
        }

        h1 {
            font-size: 1.8rem; /* Adjusted for smaller screens */
        }

        .input,
        .filter {
            flex-direction: column; /* Stack elements vertically */
            align-items: stretch; /* Stretch to full width */
            width: 100%;
            gap: 0.5rem; /* Reduced gap for mobile */
        }

        .input input[type="text"],
        .addBTN,
        .filter button {
            width: 100%;
            box-sizing: border-box;
        }

        .filter {
            margin-bottom: 1rem; /* Adjust margin */
        }

        .filter button {
            font-size: 0.95rem; /* Slightly smaller font */
            padding: 0.7rem 1rem;
        }

        li {
            flex-direction: row; /* Keep elements in a row for better readability */
            align-items: center;
            font-size: 0.95rem;
            width: 100%;
            overflow-wrap: break-word;
            word-break: break-word;
            padding: 0.6rem 0.8rem;
        }

        .removeBTN {
            align-self: center; /* Center vertically in the row */
            font-size: 1.1rem;
            padding: 0.4rem;
        }

        header {
            padding: 0.5rem 1rem;
            flex-direction: column;
            align-items: stretch;
            box-shadow: none; /* Remove shadow on mobile header for cleaner look */
        }

        button.toggle-theme {
            width: 100%;
            font-size: 1rem;
            padding: 0.8rem;
            border-radius: 10px;
            background-color: #4CAF50; /* Ensure consistent button color */
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    }
</style>
