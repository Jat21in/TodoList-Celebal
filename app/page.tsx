"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Plus,
  TrendingUp,
  Play,
  Check,
  Search,
  Settings,
  Clock,
  Calendar,
  Target,
  Zap,
  Edit,
  Trash2,
  X,
  Save,
  Bell,
  Download,
  Upload,
  Volume2,
  VolumeX,
  SortAsc,
  Archive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface Task {
  id: string
  name: string
  dueDate: string
  priority: "low" | "medium" | "high"
  notes: string
  completed: boolean
  angle: number
  radius: number
  orbitSpeed: number
  createdAt: Date
  category: string
  tags: string[]
}

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  twinkle: number
}

interface Notification {
  id: string
  message: string
  type: "info" | "warning" | "success" | "error"
  timestamp: Date
}

export default function SpaceTodoApp() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      name: "task1",
      dueDate: "2025-06-13",
      priority: "high",
      notes: "yes",
      completed: false,
      angle: 45,
      radius: 120,
      orbitSpeed: 0.5,
      createdAt: new Date("2024-01-10"),
      category: "work",
      tags: ["urgent", "project"],
    },
    {
      id: "2",
      name: "task2",
      dueDate: "2024-06-14",
      priority: "medium",
      notes: "Finish report",
      completed: true,
      angle: 225,
      radius: 160,
      orbitSpeed: 0.3,
      createdAt: new Date("2024-01-08"),
      category: "personal",
      tags: ["report"],
    },
  ])

  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "created">("dueDate")
  const [stars, setStars] = useState<Star[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const [newTask, setNewTask] = useState({
    name: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
    category: "work",
    tags: "",
  })

  useEffect(() => {
    const savedTasks = localStorage.getItem("spaceTodoTasks")
    const savedSettings = localStorage.getItem("spaceTodoSettings")

    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
        }))
        setTasks(parsedTasks)
      } catch (error) {
        console.error("Error loading tasks:", error)
      }
    }

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setSoundEnabled(settings.soundEnabled ?? true)
        setSortBy(settings.sortBy ?? "dueDate")
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("spaceTodoTasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(
      "spaceTodoSettings",
      JSON.stringify({
        soundEnabled,
        sortBy,
      }),
    )
  }, [soundEnabled, sortBy])

  const createAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  const playSound = useCallback(
    (type: "complete" | "add" | "delete" | "notification" | "error") => {
      if (!soundEnabled) return

      const audioContext = createAudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      switch (type) {
        case "complete":
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1)
          break
        case "add":
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3)
          break
        case "delete":
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.3)
          break
        case "notification":
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
          break
        case "error":
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
          break
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    },
    [soundEnabled, createAudioContext],
  )

  const addNotification = useCallback(
    (message: string, type: "info" | "warning" | "success" | "error" = "info") => {
      const notification: Notification = {
        id: Date.now().toString(),
        message,
        type,
        timestamp: new Date(),
      }
      setNotifications((prev) => [notification, ...prev.slice(0, 9)])
      playSound("notification")

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      }, 5000)
    },
    [playSound],
  )

  useEffect(() => {
    const generateStars = () => {
      const newStars: Star[] = []
      for (let i = 0; i < 80; i++) {
        newStars.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          twinkle: Math.random() * 3 + 1,
        })
      }
      setStars(newStars)
    }
    generateStars()
  }, [])

  useEffect(() => {
    const animate = () => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => ({
          ...task,
          angle: (task.angle + task.orbitSpeed) % 360,
        })),
      )
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const checkDueTasks = () => {
      const today = new Date()
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

      tasks.forEach((task) => {
        if (!task.completed) {
          const dueDate = new Date(task.dueDate)
          if (dueDate.toDateString() === today.toDateString()) {
            addNotification(`Task "${task.name}" is due today!`, "warning")
          } else if (dueDate.toDateString() === tomorrow.toDateString()) {
            addNotification(`Task "${task.name}" is due tomorrow!`, "info")
          } else if (dueDate < today) {
            addNotification(`Task "${task.name}" is overdue!`, "error")
          }
        }
      })
    }

    const interval = setInterval(checkDueTasks, 60000)
    return () => clearInterval(interval)
  }, [tasks, addNotification])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "n":
            e.preventDefault()
            setShowAddModal(true)
            break
          case "f":
            e.preventDefault()
            document.getElementById("search-input")?.focus()
            break
          case "s":
            e.preventDefault()
            setShowSettings(true)
            break
        }
      }

      if (e.key === "Escape") {
        setShowAddModal(false)
        setShowSettings(false)
        setShowNotifications(false)
        setSelectedTask(null)
        setEditingTask(null)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  const addTask = () => {
    if (!newTask.name.trim()) {
      addNotification("Task name is required!", "error")
      playSound("error")
      return
    }

    const task: Task = {
      id: Date.now().toString(),
      name: newTask.name,
      dueDate: newTask.dueDate,
      priority: newTask.priority,
      notes: newTask.notes,
      completed: false,
      angle: Math.random() * 360,
      radius: 120 + Math.random() * 80,
      orbitSpeed: 0.2 + Math.random() * 0.8,
      createdAt: new Date(),
      category: newTask.category,
      tags: newTask.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    }

    setTasks([...tasks, task])
    setNewTask({ name: "", dueDate: "", priority: "medium", notes: "", category: "work", tags: "" })
    setShowAddModal(false)
    addNotification(`Task "${task.name}" created successfully!`, "success")
    playSound("add")
  }

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      const newStatus = !task.completed
      setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: newStatus } : t)))
      addNotification(`Task "${task.name}" ${newStatus ? "completed" : "reopened"}!`, newStatus ? "success" : "info")
      playSound(newStatus ? "complete" : "add")
      setSelectedTask(null)
    }
  }

  const deleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (task) {
      setTasks(tasks.filter((t) => t.id !== id))
      addNotification(`Task "${task.name}" deleted!`, "info")
      playSound("delete")
      setSelectedTask(null)
    }
  }

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
    addNotification(`Task "${updatedTask.name}" updated!`, "success")
    playSound("add")
    setEditingTask(null)
  }

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "space-todo-tasks.json"
    link.click()
    URL.revokeObjectURL(url)
    addNotification("Tasks exported successfully!", "success")
  }

  const importTasks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedTasks = JSON.parse(e.target?.result as string)
          setTasks(importedTasks.map((task: any) => ({ ...task, createdAt: new Date(task.createdAt) })))
          addNotification("Tasks imported successfully!", "success")
          playSound("add")
        } catch (error) {
          addNotification("Error importing tasks!", "error")
          playSound("error")
        }
      }
      reader.readAsText(file)
    }
  }

  const totalMissions = tasks.length
  const completedMissions = tasks.filter((task) => task.completed).length
  const activeMissions = tasks.filter((task) => !task.completed).length
  const successRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0

  const today = new Date()
  const dueTodayMissions = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    return dueDate.toDateString() === today.toDateString() && !task.completed
  }).length

  const thisWeekMissions = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate >= today && dueDate <= weekFromNow && !task.completed
  }).length

  const highPriorityMissions = tasks.filter((task) => task.priority === "high" && !task.completed).length
  const overdueMissions = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    return dueDate < today && !task.completed
  }).length

  const filteredTasks = tasks
    .filter((task) => {
      const matchesFilter =
        filter === "all" || (filter === "active" && !task.completed) || (filter === "completed" && task.completed)
      const matchesSearch =
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case "created":
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

  const completedTasks = tasks.filter((task) => task.completed)
  const unreadNotifications = notifications.length

  return (
    <div className="min-h-screen bg-[#1a1b3a] relative overflow-hidden">
      <div className="absolute inset-0">
        {stars.map((star, index) => (
          <div
            key={index}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${index * 0.1}s`,
              animationDuration: `${star.twinkle}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-screen">
        <div className="w-20 flex flex-col items-center py-6 space-y-8">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-xl bg-[#2d2e5f] border border-[#3d3e6f] text-cyan-400 hover:bg-[#3d3e6f] transition-all duration-200 hover:scale-110"
            onClick={() => setShowAddModal(true)}
            title="Add New Task (Ctrl+N)"
          >
            <Plus className="w-6 h-6" />
          </Button>

          <div className="flex flex-col items-center space-y-6">
            <button
              onClick={() => setFilter("all")}
              className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                filter === "all" ? "text-cyan-400 bg-[#2d2e5f]" : "text-gray-400 hover:text-white"
              }`}
              title="Show All Tasks"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs font-medium">ALL</span>
            </button>

            <button
              onClick={() => setFilter("active")}
              className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-all duration-200 hover:scale-105 relative ${
                filter === "active" ? "text-cyan-400 bg-[#2d2e5f]" : "text-gray-400 hover:text-white"
              }`}
              title="Show Active Tasks"
            >
              <Play className="w-6 h-6" />
              <span className="text-xs font-medium">ACTIVE</span>
              {activeMissions > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 hover:bg-purple-600 text-xs p-0 flex items-center justify-center">
                  {activeMissions}
                </Badge>
              )}
            </button>

            <button
              onClick={() => setFilter("completed")}
              className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-all duration-200 hover:scale-105 relative ${
                filter === "completed" ? "text-cyan-400 bg-[#2d2e5f]" : "text-gray-400 hover:text-white"
              }`}
              title="Show Completed Tasks"
            >
              <Check className="w-6 h-6" />
              <span className="text-xs font-medium">COMPLET</span>
              {completedMissions > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 hover:bg-green-600 text-xs p-0 flex items-center justify-center">
                  {completedMissions}
                </Badge>
              )}
            </button>
          </div>

          <div className="mt-auto space-y-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold hover:bg-red-600 transition-all duration-200 hover:scale-110"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 hover:bg-orange-500 text-xs p-0 flex items-center justify-center">
                  {unreadNotifications}
                </Badge>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="search-input"
                  placeholder="Search missions... (Ctrl+F)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#2d2e5f] border-[#3d3e6f] text-white placeholder-gray-400 focus:border-cyan-400"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40 bg-[#2d2e5f] border-[#3d3e6f] text-white">
                  <SortAsc className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2e5f] border-[#3d3e6f]">
                  <SelectItem value="dueDate" className="text-white hover:bg-[#3d3e6f]">
                    Due Date
                  </SelectItem>
                  <SelectItem value="priority" className="text-white hover:bg-[#3d3e6f]">
                    Priority
                  </SelectItem>
                  <SelectItem value="created" className="text-white hover:bg-[#3d3e6f]">
                    Created
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={exportTasks}
                title="Export Tasks"
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" title="Import Tasks">
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="w-5 h-5" />
                </label>
                <input id="import-file" type="file" accept=".json" onChange={importTasks} className="hidden" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings (Ctrl+S)"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex">
            <div className="w-80 p-6">
              <Card className="bg-[#2d2e5f]/50 border-[#3d3e6f] backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center mb-6">
                    <TrendingUp className="w-5 h-5 text-cyan-400 mr-2" />
                    <h2 className="text-cyan-400 text-lg font-semibold">Mission Control</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cyan-400">{totalMissions}</div>
                      <div className="text-sm text-gray-400">Total Missions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400">{successRate}%</div>
                      <div className="text-sm text-gray-400">Success Rate</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-gray-300 text-sm">Completed</span>
                      </div>
                      <span className="text-white font-semibold">{completedMissions}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                        <span className="text-gray-300 text-sm">Active</span>
                      </div>
                      <span className="text-white font-semibold">{activeMissions}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-blue-400 mr-2" />
                        <span className="text-gray-300 text-sm">Due Today</span>
                      </div>
                      <span className="text-white font-semibold">{dueTodayMissions}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 text-purple-400 mr-2" />
                        <span className="text-gray-300 text-sm">This Week</span>
                      </div>
                      <span className="text-white font-semibold">{thisWeekMissions}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 text-orange-400 mr-2" />
                        <span className="text-gray-300 text-sm">High Priority</span>
                      </div>
                      <span className="text-white font-semibold">{highPriorityMissions}</span>
                    </div>

                    {overdueMissions > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Archive className="w-4 h-4 text-red-400 mr-2" />
                          <span className="text-gray-300 text-sm">Overdue</span>
                        </div>
                        <span className="text-red-400 font-semibold">{overdueMissions}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 text-sm">Mission Progress</span>
                      <span className="text-white font-semibold">{successRate}%</span>
                    </div>
                    <Progress value={successRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 relative flex items-center justify-center">
              <div className="absolute top-8 right-8">
                <Card className="bg-[#2d2e5f]/50 border-[#3d3e6f] backdrop-blur-sm">
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold mb-3">Completed</h3>
                    {completedTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-300">{task.name}</span>
                        <span className="text-gray-400">
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                    {completedTasks.length > 3 && (
                      <div className="text-xs text-gray-500">+{completedTasks.length - 3} more</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="relative w-96 h-96">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 shadow-2xl shadow-orange-500/50 animate-pulse" />

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border border-[#3d3e6f]/50" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-[#3d3e6f]/30" />

                {filteredTasks.map((task) => {
                  const x = Math.cos((task.angle * Math.PI) / 180) * task.radius
                  const y = Math.sin((task.angle * Math.PI) / 180) * task.radius
                  const isOverdue = new Date(task.dueDate) < today && !task.completed

                  return (
                    <div
                      key={task.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                      }}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                          task.completed
                            ? "bg-teal-500 shadow-lg shadow-teal-500/50"
                            : isOverdue
                              ? "bg-red-500 shadow-lg shadow-red-500/50 animate-pulse"
                              : task.priority === "high"
                                ? "bg-orange-500 shadow-lg shadow-orange-500/50"
                                : "bg-cyan-500 shadow-lg shadow-cyan-500/50"
                        }`}
                      >
                        {task.completed && <Check className="w-6 h-6 text-white" />}
                      </div>

                      <div className="absolute top-14 left-1/2 transform -translate-x-1/2 text-white text-sm whitespace-nowrap">
                        {task.name}
                      </div>

                      {!task.completed && (
                        <div
                          className={`absolute -top-2 -right-2 text-white text-xs px-1 rounded ${
                            isOverdue ? "bg-red-500" : "bg-orange-500"
                          }`}
                        >
                          {isOverdue ? "overdue" : "0d left"}
                        </div>
                      )}

                      {task.priority === "high" && !task.completed && (
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="absolute bottom-8 right-8 text-gray-400">Finish report</div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <Card className="bg-[#2d2e5f] border-[#3d3e6f] w-96" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Add New Mission</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Mission name"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="bg-[#3d3e6f] border-[#4d4e7f] text-white placeholder-gray-400"
                />

                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="bg-[#3d3e6f] border-[#4d4e7f] text-white"
                />

                <Select
                  value={newTask.priority}
                  onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger className="bg-[#3d3e6f] border-[#4d4e7f] text-white">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2e5f] border-[#3d3e6f]">
                    <SelectItem value="low" className="text-white hover:bg-[#3d3e6f]">
                      Low Priority
                    </SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-[#3d3e6f]">
                      Medium Priority
                    </SelectItem>
                    <SelectItem value="high" className="text-white hover:bg-[#3d3e6f]">
                      High Priority
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                  <SelectTrigger className="bg-[#3d3e6f] border-[#4d4e7f] text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2e5f] border-[#3d3e6f]">
                    <SelectItem value="work" className="text-white hover:bg-[#3d3e6f]">
                      Work
                    </SelectItem>
                    <SelectItem value="personal" className="text-white hover:bg-[#3d3e6f]">
                      Personal
                    </SelectItem>
                    <SelectItem value="project" className="text-white hover:bg-[#3d3e6f]">
                      Project
                    </SelectItem>
                    <SelectItem value="urgent" className="text-white hover:bg-[#3d3e6f]">
                      Urgent
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Tags (comma separated)"
                  value={newTask.tags}
                  onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                  className="bg-[#3d3e6f] border-[#4d4e7f] text-white placeholder-gray-400"
                />

                <Textarea
                  placeholder="Notes"
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  className="bg-[#3d3e6f] border-[#4d4e7f] text-white placeholder-gray-400"
                />

                <div className="flex space-x-3">
                  <Button onClick={addTask} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Mission
                  </Button>
                  <Button onClick={() => setShowAddModal(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTask && !editingTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedTask(null)}
        >
          <Card className="bg-[#2d2e5f] border-[#3d3e6f] w-80" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">{selectedTask.name}</h3>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingTask(selectedTask)}>
                    <Edit className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTask(null)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-300">
                    Due:{" "}
                    {new Date(selectedTask.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-gray-300">Priority: </span>
                  <span
                    className={`${selectedTask.priority === "high" ? "text-orange-400" : selectedTask.priority === "medium" ? "text-yellow-400" : "text-green-400"}`}
                  >
                    {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-gray-300">Category: </span>
                  <span className="text-cyan-400">{selectedTask.category}</span>
                </div>

                {selectedTask.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTask.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {selectedTask.notes && (
                  <div className="bg-[#3d3e6f] rounded p-3">
                    <div className="text-gray-300 text-sm">{selectedTask.notes}</div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => toggleTask(selectedTask.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {selectedTask.completed ? "Reopen" : "Complete"}
                </Button>
                <Button onClick={() => deleteTask(selectedTask.id)} variant="destructive" className="flex-1">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editingTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingTask(null)}
        >
          <Card className="bg-[#2d2e5f] border-[#3d3e6f] w-96" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Edit Mission</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingTask(null)}>
                  <X className="w-4 h-4 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  className="bg-[#3d3e6f] border-[#4d4e7f] text-white"
                />

                <Input
                  type="date"
                  value={editingTask.dueDate}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  className="bg-[#3d3e6f] border-[#4d4e7f] text-white"
                />

                <Select
                  value={editingTask.priority}
                  onValueChange={(value: any) => setEditingTask({ ...editingTask, priority: value })}
                >
                  <SelectTrigger className="bg-[#3d3e6f] border-[#4d4e7f] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2e5f] border-[#3d3e6f]">
                    <SelectItem value="low" className="text-white hover:bg-[#3d3e6f]">
                      Low Priority
                    </SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-[#3d3e6f]">
                      Medium Priority
                    </SelectItem>
                    <SelectItem value="high" className="text-white hover:bg-[#3d3e6f]">
                      High Priority
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  value={editingTask.notes}
                  onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                  className="bg-[#3d3e6f] border-[#4d4e7f] text-white"
                />

                <div className="flex space-x-3">
                  <Button
                    onClick={() => updateTask(editingTask)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button onClick={() => setEditingTask(null)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showSettings && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <Card className="bg-[#2d2e5f] border-[#3d3e6f] w-80" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Settings</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Sound Effects</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={soundEnabled ? "text-green-400" : "text-gray-400"}
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                </div>

                <div className="space-y-2">
                  <span className="text-gray-300 text-sm">Default Sort</span>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="bg-[#3d3e6f] border-[#4d4e7f] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d2e5f] border-[#3d3e6f]">
                      <SelectItem value="dueDate" className="text-white hover:bg-[#3d3e6f]">
                        Due Date
                      </SelectItem>
                      <SelectItem value="priority" className="text-white hover:bg-[#3d3e6f]">
                        Priority
                      </SelectItem>
                      <SelectItem value="created" className="text-white hover:bg-[#3d3e6f]">
                        Created
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-[#3d3e6f]">
                  <div className="text-gray-400 text-xs space-y-1">
                    <div>Keyboard Shortcuts:</div>
                    <div>Ctrl+N - Add Task</div>
                    <div>Ctrl+F - Search</div>
                    <div>Ctrl+S - Settings</div>
                    <div>Esc - Close Modals</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showNotifications && (
        <div className="fixed top-4 right-4 w-80 max-h-96 overflow-y-auto z-50">
          <Card className="bg-[#2d2e5f] border-[#3d3e6f]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Notifications</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowNotifications(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </Button>
              </div>
              {notifications.length === 0 ? (
                <div className="text-gray-400 text-sm">No notifications</div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded border-l-4 ${
                        notification.type === "error"
                          ? "bg-red-900/20 border-red-500"
                          : notification.type === "warning"
                            ? "bg-yellow-900/20 border-yellow-500"
                            : notification.type === "success"
                              ? "bg-green-900/20 border-green-500"
                              : "bg-blue-900/20 border-blue-500"
                      }`}
                    >
                      <div className="text-white text-sm">{notification.message}</div>
                      <div className="text-gray-400 text-xs">{notification.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
