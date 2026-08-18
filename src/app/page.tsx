"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ChevronDown, ChevronUp, Trash2, Edit3, Send, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Priority = "red" | "green" | "yellow";

interface Task {
  id: string;
  title: string;
  priority: Priority;
  is_done: boolean;
  descriptions: string[];
  created_at: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("green");

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel("realtime-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => {
              if (prev.find(t => t.id === payload.new.id)) return prev;
              return [payload.new as Task, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t))
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const { error } = await supabase.from("tasks").insert([
      {
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        is_done: false,
        descriptions: [],
      },
    ]);

    if (!error) {
      setNewTaskTitle("");
      setIsAdding(false);
    } else {
      console.error("Supabase insert error:", error);
      alert("Failed to add task: " + error.message);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 max-w-4xl mx-auto w-full flex flex-col gap-8 selection:bg-white/20">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Sync<span className="text-emerald-500">Task</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Shared workspace organizer</p>
        </div>
        {!isAdding && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="bg-white/10 border border-white/20 text-white rounded-full p-4 shadow-xl hover:bg-white/20 transition-all duration-300 ease-out flex items-center justify-center backdrop-blur-md"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            onSubmit={addTask}
            className="glass-panel p-6 rounded-3xl flex flex-col gap-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 opacity-80" />
            
            <input
              autoFocus
              type="text"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-500 focus:outline-none border-b border-white/10 pb-2 transition-colors focus:border-white/30"
            />
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/10">
                <span className="text-sm font-medium text-slate-400 ml-2">Priority:</span>
                {(["red", "yellow", "green"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewTaskPriority(p)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                      newTaskPriority === p ? "scale-110 border-white shadow-md" : "border-transparent opacity-40 hover:opacity-100",
                      p === "red" && "bg-[#ff453a]",
                      p === "yellow" && "bg-[#ffd60a]",
                      p === "green" && "bg-[#32d74b]"
                    )}
                  >
                    {newTaskPriority === p && <Check className="w-4 h-4 text-black" />}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-6 py-2.5 bg-white text-black rounded-xl font-bold shadow-lg hover:bg-slate-200 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  Add Task <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 relative z-10">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-medium text-lg">
            No tasks yet. Enjoy your day!
          </div>
        ) : (
          <AnimatePresence>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}

function TaskCard({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [addingDesc, setAddingDesc] = useState(false);

  const toggleDone = async () => {
    await supabase
      .from("tasks")
      .update({ is_done: !task.is_done })
      .eq("id", task.id);
  };

  const addDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const updatedDescriptions = [...(task.descriptions || []), newDesc.trim()];
    
    await supabase
      .from("tasks")
      .update({ descriptions: updatedDescriptions })
      .eq("id", task.id);
      
    setNewDesc("");
    setAddingDesc(false);
  };

  const deleteTask = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await supabase.from("tasks").delete().eq("id", task.id);
  };

  const priorityDots = {
    red: "bg-[#ff453a] shadow-[0_0_8px_rgba(255,69,58,0.5)]",
    yellow: "bg-[#ffd60a] shadow-[0_0_8px_rgba(255,214,10,0.5)]",
    green: "bg-[#32d74b] shadow-[0_0_8px_rgba(50,215,75,0.5)]",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
      className={cn(
        "glass-panel rounded-3xl overflow-hidden transition-all duration-500",
        task.is_done ? "opacity-50 grayscale-[50%]" : ""
      )}
    >
      <div className="p-5 flex items-center gap-4">
        <button
          onClick={toggleDone}
          className={cn(
            "w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300 shrink-0",
            task.is_done 
              ? "bg-emerald-500 border-emerald-500" 
              : "border-white/30 hover:border-white/60 bg-black/20"
          )}
        >
          <AnimatePresence>
            {task.is_done && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="w-4 h-4 text-black font-bold" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <div className="flex-1 min-w-0 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3">
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", priorityDots[task.priority])} />
            <h3 className={cn(
              "font-medium text-[1.15rem] truncate transition-all duration-300",
              task.is_done ? "text-slate-500 line-through" : "text-white"
            )}>
              {task.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={deleteTask}
            className="p-2 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-full transition-colors"
            title="Delete Task"
          >
            <X className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/40 border-t border-white/5"
          >
            <div className="p-5 pl-16 flex flex-col gap-4">
              {task.descriptions && task.descriptions.length > 0 && (
                <ul className="flex flex-col gap-3">
                  {task.descriptions.map((desc, i) => (
                    <li key={i} className="flex gap-3 text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/5 shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 shrink-0" />
                      <p className="leading-relaxed">{desc}</p>
                    </li>
                  ))}
                </ul>
              )}

              {addingDesc ? (
                <form onSubmit={addDescription} className="flex gap-2 items-center">
                  <input
                    autoFocus
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Add a description..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-white/30 text-white shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!newDesc.trim()}
                    className="p-2.5 bg-white text-black rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-colors shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingDesc(false)}
                    className="px-4 py-2 text-slate-400 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setAddingDesc(true)}
                  className="flex items-center gap-2 text-slate-300 font-medium py-2 px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors w-fit border border-white/5"
                >
                  <Plus className="w-4 h-4" /> Add Note
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
