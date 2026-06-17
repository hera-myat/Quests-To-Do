import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("todos");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((todo) => ({ ...todo, completed: !!todo.completed }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [recentlyDeleted, setRecentlyDeleted] = useState(null);
  const [undoTimer, setUndoTimer] = useState(null);

  // logic functions
  function addTodo(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setTodos((prev) => [{ id: Date.now(), text: draft, completed: false }, ...prev]);
    setDraft("");
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTodo(id) {
    const deleted = todos.find((t) => t.id === id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
    setRecentlyDeleted(deleted);
    if (undoTimer) clearTimeout(undoTimer);
    setUndoTimer(setTimeout(() => setRecentlyDeleted(null), 5000));
  }

  function undoDelete() {
    if (!recentlyDeleted) return;
    clearTimeout(undoTimer);
    setTodos((prev) => [recentlyDeleted, ...prev]);
    setRecentlyDeleted(null);
  }

  function saveEdit(id) {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: editingText } : t)));
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  // filtering & counters
  const visibleTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const total = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  return (
    <div className="todo-container">
      <h1>Quests To-Do</h1>

      <form onSubmit={addTodo} className="todo-form">
        <input
          className="todo-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a task..."
        />
        <button type="submit" className="add-button">+</button>
      </form>

      <div className="stats-text">
        <strong>{total - completedCount}</strong> tasks left | <strong>{completedCount}</strong> completed
      </div>

      <div className="progress-track">
        <div
          className="progress-bar"
          style={{ 
            width: `${progress}%`, 
            background: progress === 100 ? "#39ff14" : "#e56fb8" 
          }}
        />
      </div>

      <div className="filter-bar">
        <FilterButton current={filter} value="all" onClick={setFilter} />
        <FilterButton current={filter} value="active" onClick={setFilter} />
        <FilterButton current={filter} value="completed" onClick={setFilter} />
        
        {completedCount > 0 && (
          <button onClick={clearCompleted} className="filter-btn clear-completed-btn">
            Clear Completed
          </button>
        )}
      </div>

      {/* conditional rendering for empty states & list */}
      {todos.length === 0 ? (
        <p className="empty-msg">No tasks yet. Add one above!</p>
      ) : visibleTodos.length === 0 ? (
        <p className="empty-msg">
          {filter === "completed" ? "No completed tasks found." : "No active tasks found."}
        </p>
      ) : (
        <ul className="todo-list">
          {visibleTodos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                className="todo-checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />

              {editingId === todo.id ? (
                <input
                  autoFocus
                  className="todo-input editing"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={() => saveEdit(todo.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(todo.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
              ) : (
                <span
                  className={`todo-text ${todo.completed ? 'strikethrough' : ''}`}
                  onDoubleClick={() => { 
                    setEditingId(todo.id); 
                    setEditingText(todo.text); 
                  }}
                >
                  {todo.text}
                </span>
              )}

              <button onClick={() => deleteTodo(todo.id)} className="delete-btn">✕</button>
            </li>
          ))}
        </ul>
      )}

      {recentlyDeleted && (
        <div className="undo-toast">
          <span>Task deleted</span>
          <button onClick={undoDelete} className="undo-btn">UNDO</button>
        </div>
      )}
    </div>
  );
}

function FilterButton({ current, value, onClick }) {
  const isActive = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`filter-btn ${isActive ? 'active' : 'inactive'}`}
    >
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </button>
  );
}
