import React, { useEffect, useState } from "react";
import { UsersApi, FullApi, RoleUpdate, CourseCategoryCreate } from "../api/index.js";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const token = localStorage.getItem("jwtToken");
  const usersApi = new UsersApi();
  const fullApi = new FullApi();

  if (token) {
    usersApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
    fullApi.apiClient.defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    } else {
      loadCategories();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.listUsersUsersGet({});
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fullApi.listCategoriesFullAdminCategoriesGet({});
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      const roleUpdate = new RoleUpdate(Number(newRoleId));
      await usersApi.updateUserRoleUsersUserIdRolePut(userId, roleUpdate);
      setUsers(users.map(u => u.id === userId ? { ...u, roleId: Number(newRoleId) } : u));
    } catch (err) {
      console.error("Failed to update role", err);
      alert("Ошибка при обновлении роли");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const catCreate = new CourseCategoryCreate(newCategoryName);
      await fullApi.createCategoryFullAdminCategoriesPost(catCreate);
      setNewCategoryName("");
      loadCategories();
    } catch (err) {
      console.error("Failed to create category", err);
      alert("Ошибка при создании категории");
    }
  };

  return (
    <div className="admin-panel">
      <h1 className="mb-4">Панель администратора</h1>
      
      <div className="flex gap-4 mb-4">
        <button 
          className={`btn ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("users")}
        >
          Пользователи
        </button>
        <button 
          className={`btn ${activeTab === "categories" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("categories")}
        >
          Категории
        </button>
      </div>

      {loading && <div className="text-center">Загрузка...</div>}

      {!loading && activeTab === "users" && (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Логин</th>
                <th className="text-left p-2">Имя</th>
                <th className="text-left p-2">Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="p-2">{user.id}</td>
                  <td className="p-2">{user.login}</td>
                  <td className="p-2">{user.name} {user.surname}</td>
                  <td className="p-2">
                    <select 
                      value={user.roleId} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="form-select"
                      style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)' }}
                    >
                      <option value={1}>Студент</option>
                      <option value={2}>Преподаватель</option>
                      <option value={3}>Администратор</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === "categories" && (
        <div className="card">
          <div className="flex gap-2 mb-4">
            <input 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Название новой категории"
              style={{ marginBottom: 0 }}
            />
            <button className="btn btn-primary" onClick={handleCreateCategory}>Добавить</button>
          </div>
          
          <ul style={{ listStyle: 'none' }}>
            {categories.map(cat => (
              <li key={cat.id} className="p-2 border-b border-gray-200 flex justify-between">
                <span>{cat.name}</span>
                <span className="text-secondary text-sm">ID: {cat.id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
