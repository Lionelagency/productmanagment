import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Calendar,
  FileText,
  Upload,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  LogOut,
  UserPlus,
} from "lucide-react";

// API Configuration
const API_BASE_URL = "http://localhost:3000/api";

// API Service Functions
const apiService = {
  // Auth endpoints
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  addFileRemark: async (token, fileId, text) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}/remarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add file remark");
      }

      return response.json();
    } catch (error) {
      console.error("Error adding file remark:", error);
      throw error;
    }
  },
  // Task endpoints
  getTasks: async (token, filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE_URL}/tasks?${queryParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  createTask: async (token, taskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });
    return response.json();
  },

  updateTaskStatus: async (token, taskId, status) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  addRemark: async (token, taskId, text) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/remarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    return response.json();
  },

  reassignTask: async (token, taskId, assignedToId) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/reassign`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assignedToId }),
    });
    return response.json();
  },

  // User endpoints
  getUsers: async (token) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  getFileRemarks: async (token, fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}/remarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get file remarks");
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching file remarks:", error);
      throw error;
    }
  },
  deleteFileRemark: async (token, remarkId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/files/remarks/${remarkId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete remark");
      }

      return response.json();
    } catch (error) {
      console.error("Error deleting file remark:", error);
      throw error;
    }
  },

  getActiveClients: async (token) => {
    const response = await fetch(`${API_BASE_URL}/users/clients/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  updateUserStatus: async (token, userId, status) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  deleteUser: async (token, userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  // File endpoints
  uploadFile: async (token, taskId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/files/upload/${taskId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return response.json();
  },

  downloadFile: async (token, fileId) => {
    const response = await fetch(`${API_BASE_URL}/files/download/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.blob();
  },

  getFileVersions: async (token, taskId) => {
    const response = await fetch(
      `${API_BASE_URL}/files/task/${taskId}/versions`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.json();
  },
};

const statusConfig = {
  CREATED: {
    label: "Created",
    color: "bg-gray-100 text-gray-800",
    icon: Clock,
  },
  ASSIGNED: {
    label: "Assigned",
    color: "bg-blue-100 text-blue-800",
    icon: Users,
  },
  IN_REVIEW: {
    label: "In Review",
    color: "bg-yellow-100 text-yellow-800",
    icon: Eye,
  },
  REVISION_REQUIRED: {
    label: "Revision Required",
    color: "bg-orange-100 text-orange-800",
    icon: AlertCircle,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  PUBLISHED: {
    label: "Published",
    color: "bg-purple-100 text-purple-800",
    icon: CheckCircle,
  },
};

const TaskManagementApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeClients, setActiveClients] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showLogin, setShowLogin] = useState(!token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load data on component mount
  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [tasksData, clientsData] = await Promise.all([
        apiService.getTasks(token),
        apiService.getActiveClients(token),
      ]);

      setTasks(tasksData);
      setActiveClients(clientsData);

      // Load users if admin
      if (currentUser?.role === "ADMIN") {
        const usersData = await apiService.getUsers(token);
        setUsers(usersData);
      }
    } catch (error) {
      setError("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Login Component
  const LoginForm = () => {
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [loginLoading, setLoginLoading] = useState(false);

    const handleLogin = async (e) => {
      e.preventDefault();
      setLoginLoading(true);
      setError("");

      try {
        const response = await apiService.login(credentials);

        if (response.user && response.token) {
          setCurrentUser(response.user);
          setToken(response.token);
          localStorage.setItem("token", response.token);
          setShowLogin(false);
        } else {
          setError(response.error || "Login failed");
        }
      } catch (error) {
        setError("Login failed. Please try again.");
      } finally {
        setLoginLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <div className="p-3 bg-orange-600 rounded-lg inline-block mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials({ ...credentials, email: e.target.value })
                  }
                  placeholder="admin@taskflow.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  placeholder="admin123"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-6 bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-400"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p>Admin: admin@taskflow.com / admin123</p>
            <p>Product: alice@taskflow.com / product123</p>
            <p>Client: john@client.com / client123</p>
          </div>
        </div>
      </div>
    );
  };

  // Create Task Modal
  const CreateTaskModal = () => {
    const [taskData, setTaskData] = useState({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      taskType: "DESIGN",
      assignedToId: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setError("");

      try {
        const response = await apiService.createTask(token, {
          ...taskData,
          assignedToId: taskData.assignedToId
            ? parseInt(taskData.assignedToId)
            : undefined,
        });

        if (response.id) {
          setTasks([response, ...tasks]);
          setShowCreateTask(false);
          setTaskData({
            name: "",
            description: "",
            startDate: "",
            endDate: "",
            taskType: "DESIGN",
            assignedToId: "",
          });
        } else {
          setError(response.error || "Failed to create task");
        }
      } catch (error) {
        setError("Failed to create task");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create New Task</h3>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={taskData.name}
                  onChange={(e) =>
                    setTaskData({ ...taskData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  value={taskData.description}
                  onChange={(e) =>
                    setTaskData({ ...taskData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={taskData.startDate}
                    onChange={(e) =>
                      setTaskData({ ...taskData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={taskData.endDate}
                    onChange={(e) =>
                      setTaskData({ ...taskData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={taskData.taskType}
                  onChange={(e) =>
                    setTaskData({ ...taskData, taskType: e.target.value })
                  }
                >
                  <option value="DESIGN">Design</option>
                  <option value="DEVELOPMENT">Development</option>
                  <option value="TESTING">Testing</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="RESEARCH">Research</option>
                  <option value="DOCUMENTATION">Documentation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={taskData.assignedToId}
                  onChange={(e) =>
                    setTaskData({ ...taskData, assignedToId: e.target.value })
                  }
                >
                  <option value="">Auto-assign to available client</option>
                  {activeClients.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowCreateTask(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
              >
                {submitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Create User Modal
  const CreateUserModal = () => {
    const [userData, setUserData] = useState({
      name: "",
      email: "",
      password: "",
      role: "CLIENT",
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setError("");

      try {
        const response = await apiService.register(userData);

        if (response.user) {
          setUsers([response.user, ...users]);
          setShowCreateUser(false);
          setUserData({ name: "", email: "", password: "", role: "CLIENT" });
        } else {
          setError(response.error || "Failed to create user");
        }
      } catch (error) {
        setError("Failed to create user");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Create New User</h3>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={userData.name}
                  onChange={(e) =>
                    setUserData({ ...userData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={userData.email}
                  onChange={(e) =>
                    setUserData({ ...userData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={userData.password}
                  onChange={(e) =>
                    setUserData({ ...userData, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={userData.role}
                  onChange={(e) =>
                    setUserData({ ...userData, role: e.target.value })
                  }
                >
                  <option value="CLIENT">Client</option>
                  <option value="PRODUCT">Product</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowCreateUser(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TaskDetailModal = ({ task }) => {
    const [newRemark, setNewRemark] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [fileRemarks, setFileRemarks] = useState({});
    const [newFileRemark, setNewFileRemark] = useState({});
    const [showFileRemarks, setShowFileRemarks] = useState({});

    useEffect(() => {
      if (task.id) {
        loadFileVersions();
      }
    }, [task.id]);

    const loadFileVersions = async () => {
      try {
        const response = await apiService.getFileVersions(token, task.id);
        setFiles(response);
      } catch (error) {
        console.error("Failed to load file versions:", error);
      }
    };

    const loadFileRemarks = async (fileId) => {
      try {
        const response = await apiService.getFileRemarks(token, fileId);
        setFileRemarks((prev) => ({
          ...prev,
          [fileId]: response,
        }));
      } catch (error) {
        console.error("Failed to load file remarks:", error);
      }
    };

    // Group files by original name to show versions
    const groupedFiles = files.reduce((acc, file) => {
      const key = file.originalName;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(file);
      return acc;
    }, {});

    // Sort versions within each group
    Object.keys(groupedFiles).forEach((key) => {
      groupedFiles[key].sort((a, b) => b.version - a.version);
    });

    const handleStatusChange = async (newStatus) => {
      try {
        const response = await apiService.updateTaskStatus(
          token,
          task.id,
          newStatus
        );
        if (response.id) {
          setTasks(tasks.map((t) => (t.id === task.id ? response : t)));
          setSelectedTask(response);
        }
      } catch (error) {
        setError("Failed to update task status");
      }
    };

    const handleAddRemark = async () => {
      if (!newRemark.trim()) return;

      setSubmitting(true);
      try {
        const response = await apiService.addRemark(token, task.id, newRemark);
        if (response.id) {
          // Refresh tasks to get updated remarks
          const updatedTasksData = await apiService.getTasks(token);
          setTasks(updatedTasksData);

          // Update current task data
          const updatedTask = updatedTasksData.find((t) => t.id === task.id);
          if (updatedTask) {
            setSelectedTask(updatedTask);
          }

          setNewRemark("");
        }
      } catch (error) {
        setError("Failed to add remark");
      } finally {
        setSubmitting(false);
      }
    };

    const handleFileUpload = async () => {
      if (!selectedFile) return;

      setUploadingFile(true);
      try {
        const response = await apiService.uploadFile(
          token,
          task.id,
          selectedFile
        );
        if (response.id) {
          // Reload file versions to show the new upload
          await loadFileVersions();

          // Refresh the task to get updated file count
          const updatedTasksData = await apiService.getTasks(token);
          setTasks(updatedTasksData);

          // Update current task data
          const updatedTask = updatedTasksData.find((t) => t.id === task.id);
          if (updatedTask) {
            setSelectedTask(updatedTask);
          }

          setSelectedFile(null);
          // Reset the file input
          document.getElementById("file-input").value = "";
        }
      } catch (error) {
        setError("Failed to upload file");
      } finally {
        setUploadingFile(false);
      }
    };

    const handleFileDownload = async (fileId, fileName) => {
      try {
        const blob = await apiService.downloadFile(token, fileId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        setError("Failed to download file");
      }
    };

    const handleReassignTask = async (newAssigneeId) => {
      try {
        const response = await apiService.reassignTask(
          token,
          task.id,
          parseInt(newAssigneeId)
        );
        if (response.id) {
          setTasks(tasks.map((t) => (t.id === task.id ? response : t)));
          setSelectedTask(response);
        }
      } catch (error) {
        setError("Failed to reassign task");
      }
    };

    const handleAddFileRemark = async (fileId) => {
      const remarkText = newFileRemark[fileId];
      if (!remarkText?.trim()) return;

      try {
        const response = await apiService.addFileRemark(
          token,
          fileId,
          remarkText
        );
        if (response.id) {
          // Update file remarks
          setFileRemarks((prev) => ({
            ...prev,
            [fileId]: [response, ...(prev[fileId] || [])],
          }));

          // Clear input
          setNewFileRemark((prev) => ({
            ...prev,
            [fileId]: "",
          }));
        }
      } catch (error) {
        setError("Failed to add file remark");
      }
    };

    const toggleFileRemarks = async (fileId) => {
      const isCurrentlyShown = showFileRemarks[fileId];

      setShowFileRemarks((prev) => ({
        ...prev,
        [fileId]: !isCurrentlyShown,
      }));

      // Load remarks if showing for the first time
      if (!isCurrentlyShown && !fileRemarks[fileId]) {
        await loadFileRemarks(fileId);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {task.name}
              </h3>
              <p className="text-gray-600">Created by {task.createdBy?.name}</p>
              {task.description && (
                <p className="text-gray-700 mt-2">{task.description}</p>
              )}
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setSelectedTask(null)}
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Task Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Start Date:</span>
                    <p className="font-medium">
                      {new Date(task.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">End Date:</span>
                    <p className="font-medium">
                      {new Date(task.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Assigned To:</span>
                    <p className="font-medium">
                      {task.assignedTo?.name || "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Task Type:</span>
                    <p className="font-medium">{task.taskType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <p className="font-medium">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <p className="font-medium">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Files Section */}
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Files & Documents
                  <span className="ml-2 text-sm text-gray-500">
                    ({files.length} file{files.length !== 1 ? "s" : ""})
                  </span>
                </h4>

                {Object.keys(groupedFiles).length === 0 ? (
                  <p className="text-gray-500 text-sm mb-4 p-4 bg-gray-50 rounded-lg text-center">
                    No files uploaded yet
                  </p>
                ) : (
                  <div className="space-y-4 mb-4">
                    {Object.entries(groupedFiles).map(
                      ([fileName, fileVersions]) => (
                        <div
                          key={fileName}
                          className="border rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-orange-600" />
                              <h5 className="font-medium text-gray-900">
                                {fileName}
                              </h5>
                              <span className="text-sm text-gray-500">
                                ({fileVersions.length} version
                                {fileVersions.length > 1 ? "s" : ""})
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {fileVersions.map((file, index) => (
                              <div key={file.id}>
                                <div
                                  className={`flex items-center justify-between p-3 rounded-lg ${
                                    index === 0
                                      ? "bg-green-50 border border-green-200"
                                      : "bg-white border border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        index === 0
                                          ? "bg-green-100 text-green-800"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      v{file.version}{" "}
                                      {index === 0 && "(Latest)"}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {new Date(
                                          file.uploadedAt
                                        ).toLocaleDateString()}{" "}
                                        • {file.uploadedBy?.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                        MB • {file.mimetype}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => toggleFileRemarks(file.id)}
                                      className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                      title="View/Add remarks"
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                      {fileRemarks[file.id]?.length > 0 && (
                                        <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                          {fileRemarks[file.id].length}
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleFileDownload(
                                          file.id,
                                          file.originalName
                                        )
                                      }
                                      className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50"
                                      title={`Download version ${file.version}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* File Remarks Section */}
                                {showFileRemarks[file.id] && (
                                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h6 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      File Remarks (Version {file.version})
                                    </h6>

                                    {/* Display existing remarks */}
                                    <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                                      {fileRemarks[file.id]?.length > 0 ? (
                                        fileRemarks[file.id].map((remark) => (
                                          <div
                                            key={remark.id}
                                            className="p-2 bg-white rounded border"
                                          >
                                            <div className="flex justify-between items-start mb-1">
                                              <span className="text-xs font-medium text-gray-900 flex items-center">
                                                {remark.author.name}
                                                <span
                                                  className={`ml-2 px-1 py-0.5 rounded text-xs font-bold ${
                                                    remark.author.role ===
                                                    "ADMIN"
                                                      ? "bg-red-100 text-red-700"
                                                      : remark.author.role ===
                                                        "CLIENT"
                                                      ? "bg-blue-100 text-blue-700"
                                                      : "bg-green-100 text-green-700"
                                                  }`}
                                                >
                                                  {remark.author.role}
                                                </span>
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {new Date(
                                                  remark.createdAt
                                                ).toLocaleDateString()}{" "}
                                                {new Date(
                                                  remark.createdAt
                                                ).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-700">
                                              {remark.text}
                                            </p>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-xs text-gray-500 text-center p-2 bg-white rounded border">
                                          No remarks for this file yet
                                        </p>
                                      )}
                                    </div>

                                    {/* Add new remark */}
                                    <div className="flex space-x-2">
                                      <input
                                        type="text"
                                        placeholder="Add remark for this file version..."
                                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        value={newFileRemark[file.id] || ""}
                                        onChange={(e) =>
                                          setNewFileRemark((prev) => ({
                                            ...prev,
                                            [file.id]: e.target.value,
                                          }))
                                        }
                                        onKeyPress={(e) =>
                                          e.key === "Enter" &&
                                          handleAddFileRemark(file.id)
                                        }
                                      />
                                      <button
                                        onClick={() =>
                                          handleAddFileRemark(file.id)
                                        }
                                        disabled={
                                          !newFileRemark[file.id]?.trim()
                                        }
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* File Upload */}
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <input
                      id="file-input"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="mb-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      accept=".jpeg,.jpg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
                    />
                    {selectedFile && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 font-medium">
                          📄 {selectedFile.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                        {files.some(
                          (f) => f.originalName === selectedFile.name
                        ) && (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            ⚠️ This will create a new version of existing file
                          </p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={handleFileUpload}
                      disabled={!selectedFile || uploadingFile}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                    >
                      {uploadingFile ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </span>
                      ) : (
                        "Upload File"
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported: JPG, PNG, PDF, DOC, DOCX, TXT, ZIP (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Task Remarks Section */}
              <div>
                <h4 className="font-medium mb-3 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                  Task Remarks & Comments
                  <span className="ml-2 text-sm text-gray-500">
                    ({task.remarks?.length || 0} remark
                    {(task.remarks?.length || 0) !== 1 ? "s" : ""})
                  </span>
                </h4>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {task.remarks?.length > 0 ? (
                    task.remarks.map((remark) => (
                      <div
                        key={remark.id}
                        className="p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-gray-900">
                            {remark.author?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(remark.createdAt).toLocaleDateString()}{" "}
                            {new Date(remark.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{remark.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg text-center">
                      No task remarks yet
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add a task remark..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddRemark()}
                  />
                  <button
                    onClick={handleAddRemark}
                    disabled={submitting || !newRemark.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            </div>

            {/* Status & Actions Sidebar */}
            <div className="space-y-6">
              {/* Current Status */}
              <div>
                <h4 className="font-medium mb-3">Current Status</h4>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    statusConfig[task.status]?.color
                  }`}
                >
                  {React.createElement(statusConfig[task.status]?.icon, {
                    className: "h-4 w-4 mr-2",
                  })}
                  {statusConfig[task.status]?.label}
                </div>
              </div>

              {/* Change Status */}
              <div>
                <h4 className="font-medium mb-3">Change Status</h4>
                <div className="space-y-2">
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        task.status === status
                          ? "bg-orange-100 text-orange-800 border border-orange-200"
                          : "hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {React.createElement(config.icon, {
                        className: "h-4 w-4 inline mr-2",
                      })}
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reassign Task (for Admin/Product users) */}
              {(currentUser?.role === "ADMIN" ||
                currentUser?.role === "PRODUCT") && (
                <div>
                  <h4 className="font-medium mb-3">Reassign Task</h4>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={task.assignedToId || ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleReassignTask(e.target.value);
                      }
                    }}
                  >
                    <option value="">Select assignee</option>
                    {activeClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}{" "}
                        {task.assignedToId === client.id && "(Current)"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Task Statistics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Task Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Files:</span>
                    <span className="font-medium">{files.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Task Remarks:</span>
                    <span className="font-medium">
                      {task.remarks?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File Remarks:</span>
                    <span className="font-medium">
                      {Object.values(fileRemarks).reduce(
                        (total, remarks) => total + remarks.length,
                        0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days remaining:</span>
                    <span className="font-medium">
                      {Math.max(
                        0,
                        Math.ceil(
                          (new Date(task.endDate) - new Date()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Dashboard Component
  const Dashboard = () => {
    const getTaskStats = () => {
      const total = tasks.length;
      const inProgress = tasks.filter((t) =>
        ["ASSIGNED", "IN_REVIEW"].includes(t.status)
      ).length;
      const completed = tasks.filter((t) => t.status === "PUBLISHED").length;
      const revisionRequired = tasks.filter(
        (t) => t.status === "REVISION_REQUIRED"
      ).length;

      return { total, inProgress, completed, revisionRequired };
    };

    const stats = getTaskStats();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          {(currentUser?.role === "PRODUCT" ||
            currentUser?.role === "ADMIN") && (
            <button
              onClick={() => setShowCreateTask(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.inProgress}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Needs Revision
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.revisionRequired}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">Recent Tasks</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <p className="mt-2 text-gray-600">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tasks found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FileText className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{task.name}</h4>
                        <p className="text-sm text-gray-600">
                          Assigned to {task.assignedTo?.name || "Unassigned"} •
                          Due {new Date(task.endDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            📎 {task.files?.length || 0} files
                          </span>
                          <span className="text-xs text-gray-500">
                            💬 {task.remarks?.length || 0} remarks
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusConfig[task.status]?.color
                        }`}
                      >
                        {statusConfig[task.status]?.label}
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // User Management Component
  const UserManagement = () => {
    const handleUserStatusToggle = async (userId, currentStatus) => {
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

      try {
        const response = await apiService.updateUserStatus(
          token,
          userId,
          newStatus
        );
        if (response.id) {
          setUsers(users.map((u) => (u.id === userId ? response : u)));
          // Refresh active clients if status changed
          if (newStatus === "ACTIVE") {
            const clientsData = await apiService.getActiveClients(token);
            setActiveClients(clientsData);
          }
        }
      } catch (error) {
        setError("Failed to update user status");
      }
    };

    const handleDeleteUser = async (userId) => {
      if (!confirm("Are you sure you want to delete this user?")) return;

      try {
        await apiService.deleteUser(token, userId);
        setUsers(users.filter((u) => u.id !== userId));
      } catch (error) {
        setError("Failed to delete user");
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          {currentUser?.role === "ADMIN" && (
            <button
              onClick={() => setShowCreateUser(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">All Users</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-gray-600">
                        {user.email} • {user.role}
                      </p>
                      <p className="text-xs text-gray-500">
                        Tasks: {user._count?.assignedTasks || 0} assigned,{" "}
                        {user._count?.createdTasks || 0} created
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </div>
                    {currentUser?.role === "ADMIN" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleUserStatusToggle(user.id, user.status)
                          }
                          className="text-blue-600 hover:text-blue-800"
                          title={
                            user.status === "ACTIVE" ? "Deactivate" : "Activate"
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
    setShowLogin(true);
    setTasks([]);
    setUsers([]);
    setActiveClients([]);
  };

  // Main render
  if (showLogin) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-white">TaskFlow</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-white">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-orange-100 rounded-full">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-white">
                  {currentUser?.name}
                </span>
                <span className="text-xs text-gray-400 capitalize">
                  ({currentUser?.role})
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button
              onClick={() => setError("")}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
            {currentUser?.role === "ADMIN" && (
              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                User Management
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "users" && <UserManagement />}
      </div>

      {/* Modals */}
      {showCreateTask && <CreateTaskModal />}
      {showCreateUser && <CreateUserModal />}
      {selectedTask && <TaskDetailModal task={selectedTask} />}
    </div>
  );
};

export default TaskManagementApp;
